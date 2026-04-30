#!/usr/bin/env python3
"""
SustainIQ Ask Server
=====================
HTTP server that keeps indexes loaded in memory and serves the full retrieval pipeline.

Endpoints:
  POST /ask  {"query": "..."}  -> {"answer": "...", "sources": [...], "timings": {...}, "grounding": {...}}
  GET  /health  -> {"status": "ok", "indexes_loaded": true}

Runs on http://localhost:5100

Start:
  python3 scripts/ask-server.py
"""

import json
import os
import sys
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_env = os.path.join(os.path.dirname(__file__), "..", ".env.local")
with open(_env) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if k not in os.environ:
                os.environ[k] = v

import importlib.util
spec = importlib.util.spec_from_file_location("ra", "scripts/retrieval-advisor.py")
ra = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ra)


# =============================================================================
# Load indexes once at startup
# =============================================================================
print("Loading indexes...")
t0 = time.time()
with open(ra.rf.CHUNKS_PATH) as f:
    CHUNKS_DATA = json.load(f)
with open(ra.rf.DEFINITIONS_PATH) as f:
    DEFS_DATA = json.load(f)
with open(ra.rf.FORMULAS_PATH) as f:
    FORMS_DATA = json.load(f)
print(f"  Loaded JSON in {time.time()-t0:.1f}s")

print("Building normalized matrices...")
t0 = time.time()
CHUNKS_MATRIX = ra.rf.build_embedding_matrix([s for s in CHUNKS_DATA["sections"] if s.get("embedding")])
DEFS_MATRIX = ra.rf.build_embedding_matrix([d for d in DEFS_DATA["definitions"] if d.get("embedding")])
FORMS_MATRIX = ra.rf.build_embedding_matrix([f for f in FORMS_DATA["formulas"] if f.get("embedding")])
print(f"  Matrices built in {time.time()-t0:.1f}s")
print(f"  Chunks: {CHUNKS_MATRIX.shape}")
print(f"  Defs:   {DEFS_MATRIX.shape}")
print(f"  Forms:  {FORMS_MATRIX.shape}")

print("Warming up query embedding (first call is slow)...")
try:
    _ = ra.rf.embed_query("warmup")
except Exception as e:
    print(f"  Warmup failed: {e}")


# =============================================================================
# HTTP handler
# =============================================================================
class AskHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Custom log format - concise
        sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {self.address_string()} - {fmt % args}\n")

    def _json(self, status: int, body: dict):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {
                "status": "ok",
                "indexes_loaded": True,
                "chunks": int(CHUNKS_MATRIX.shape[0]),
                "definitions": int(DEFS_MATRIX.shape[0]),
                "formulas": int(FORMS_MATRIX.shape[0]),
            })
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/ask":
            return self._handle_ask_blocking()
        if self.path == "/ask/stream":
            return self._handle_ask_stream()
        self._json(404, {"error": "not found"})

    def _handle_ask_blocking(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length).decode() or "{}")
            query = body.get("query", "").strip()
            enable_revise = body.get("enable_revise", True)

            if not query:
                self._json(400, {"error": "query is required"})
                return

            print(f"\n[QUERY] {query[:100]}")
            t0 = time.time()

            result = ra.run_production(
                query,
                CHUNKS_DATA, DEFS_DATA, FORMS_DATA,
                CHUNKS_MATRIX, DEFS_MATRIX, FORMS_MATRIX,
                enable_revise=enable_revise,
            )

            elapsed = time.time() - t0
            intent = result.get("intent", "?")
            ungrounded = result.get("grounding", {}).get("unsupported", 0) if result.get("grounding") else 0
            print(f"  [{intent}] {elapsed:.1f}s | {ungrounded} unsupported claims")

            self._json(200, result)

        except Exception as e:
            traceback.print_exc()
            self._json(500, {"error": str(e)})

    def _handle_ask_stream(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length).decode() or "{}")
            query = body.get("query", "").strip()
            enable_revise = body.get("enable_revise", True)

            if not query:
                self._json(400, {"error": "query is required"})
                return

            print(f"\n[STREAM] {query[:100]}")
            t0 = time.time()

            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("X-Accel-Buffering", "no")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            generator = ra.run_production_stream(
                query,
                CHUNKS_DATA, DEFS_DATA, FORMS_DATA,
                CHUNKS_MATRIX, DEFS_MATRIX, FORMS_MATRIX,
                enable_revise=enable_revise,
            )

            for event in generator:
                line = f"data: {json.dumps(event)}\n\n".encode()
                try:
                    self.wfile.write(line)
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    print("  client disconnected")
                    return

            # Final marker
            try:
                self.wfile.write(b"data: [DONE]\n\n")
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

            elapsed = time.time() - t0
            print(f"  [STREAM done] {elapsed:.1f}s")

        except Exception as e:
            traceback.print_exc()
            try:
                err = json.dumps({"type": "error", "message": str(e)})
                self.wfile.write(f"data: {err}\n\n".encode())
                self.wfile.flush()
            except Exception:
                pass


def main():
    port = int(os.environ.get("ASK_SERVER_PORT", "5100"))
    server = ThreadingHTTPServer(("127.0.0.1", port), AskHandler)
    print(f"\n{'='*60}")
    print(f"SustainIQ ask server listening on http://127.0.0.1:{port}")
    print(f"  Health: curl http://127.0.0.1:{port}/health")
    print(f"  Query:  curl -X POST http://127.0.0.1:{port}/ask -d '{{\"query\":\"...\"}}'")
    print(f"{'='*60}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
