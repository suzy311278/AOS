'use client';

/**
 * ArmorInnovate lab terminal — xterm.js wrapper.
 *
 * Connects to a WebSocket endpoint that bridges to an ephemeral Docker
 * container running a mock PLC simulator (pymodbus, snap7, etc.).
 *
 * Props:
 *   labSlug  – lab identifier, used to build the WS URL
 *   onReady  – called once the terminal is mounted and sized
 *   onClose  – called when the WS connection closes
 *
 * Lifecycle:
 *   1. Mount → create Terminal + FitAddon.
 *   2. Connect WS to /api/armor/lab/<slug>/socket.
 *   3. Pipe WS messages → terminal; terminal input → WS.
 *   4. On unmount: dispose terminal + close WS.
 *
 * If the WS is unreachable (e.g. lab runner not deployed yet), the
 * terminal falls back to a local mock shell that responds to `help`,
 * `scan`, `exit`, and echoes unknown commands.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Terminal as XTerminal } from '@xterm/xterm';
import './xterm-styles';

// ── Types ──────────────────────────────────────────────────────────────

interface TerminalProps {
  labSlug: string;
  onReady?: () => void;
  onClose?: (reason: string) => void;
  className?: string;
}

type ConnectionState = 'connecting' | 'connected' | 'fallback' | 'closed';

// ── Component ──────────────────────────────────────────────────────────

export default function LabTerminal({ labSlug, onReady, onClose, className }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ConnectionState>('connecting');

  // Local fallback shell state
  const lineBufferRef = useRef('');

  const writeFallbackPrompt = useCallback(() => {
    termRef.current?.write('\r\n\x1b[36marmor@lab\x1b[0m:\x1b[33m~/' + labSlug + '\x1b[0m$ ');
  }, [labSlug]);

  const handleFallbackInput = useCallback((data: string) => {
    const term = termRef.current;
    if (!term) return;

    for (const ch of data) {
      if (ch === '\r' || ch === '\n') {
        const cmd = lineBufferRef.current.trim();
        lineBufferRef.current = '';
        term.write('\r\n');

        if (!cmd) {
          writeFallbackPrompt();
          continue;
        }

        switch (cmd) {
          case 'help':
            term.writeln('\x1b[1mAvailable commands:\x1b[0m');
            term.writeln('  help       Show this message');
            term.writeln('  scan       Run a simulated Modbus scan');
            term.writeln('  status     Show lab runtime status');
            term.writeln('  clear      Clear the screen');
            term.writeln('  exit       Close the terminal');
            break;
          case 'scan':
            term.writeln('\x1b[36m[i]\x1b[0m Scanning Modbus/TCP on 127.0.0.1:502…');
            term.writeln('  Slave ID 1 … \x1b[32mONLINE\x1b[0m  (holding registers: 40001–40100)');
            term.writeln('  Slave ID 2 … \x1b[32mONLINE\x1b[0m  (coils: 00001–00064)');
            term.writeln('  Slave ID 3 … \x1b[31mOFFLINE\x1b[0m');
            term.writeln('\x1b[36m[i]\x1b[0m Scan complete. 2/3 slaves responding.');
            break;
          case 'status':
            term.writeln('\x1b[36m[i]\x1b[0m Lab: ' + labSlug);
            term.writeln('  Runtime:    \x1b[33mlocal-fallback\x1b[0m (no WS connection)');
            term.writeln('  Protocol:   Modbus/TCP');
            term.writeln('  Port:       502');
            term.writeln('  Status:     \x1b[33mSimulated\x1b[0m');
            break;
          case 'clear':
            term.clear();
            break;
          case 'exit':
            term.writeln('\x1b[90mSession closed.\x1b[0m');
            onClose?.('user-exit');
            return;
          default:
            term.writeln(`\x1b[31mCommand not found:\x1b[0m ${cmd}`);
            term.writeln('Type \x1b[1mhelp\x1b[0m for available commands.');
        }
        writeFallbackPrompt();
      } else if (ch === '\x7f') {
        // Backspace
        if (lineBufferRef.current.length > 0) {
          lineBufferRef.current = lineBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (ch >= ' ') {
        lineBufferRef.current += ch;
        term.write(ch);
      }
    }
  }, [labSlug, writeFallbackPrompt, onClose]);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    async function init() {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');

      // xterm CSS is imported via link tag in the lab page layout

      if (disposed || !containerRef.current) return;

      const fitAddon = new FitAddon();
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
          background: '#0F172A',
          foreground: '#E2E8F0',
          cursor: '#67E8F9',
          cursorAccent: '#0F172A',
          selectionBackground: '#334155',
          black: '#0F172A',
          red: '#DC2626',
          green: '#16A34A',
          yellow: '#D97706',
          blue: '#2563EB',
          magenta: '#9333EA',
          cyan: '#06B6D4',
          white: '#E2E8F0',
          brightBlack: '#475569',
          brightRed: '#EF4444',
          brightGreen: '#22C55E',
          brightYellow: '#FBBF24',
          brightBlue: '#3B82F6',
          brightMagenta: '#A855F7',
          brightCyan: '#22D3EE',
          brightWhite: '#F8FAFC',
        },
      });

      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      // Resize observer
      const ro = new ResizeObserver(() => {
        try { fitAddon.fit(); } catch { /* noop */ }
      });
      ro.observe(containerRef.current);

      // Banner
      term.writeln('\x1b[1;36m╔══════════════════════════════════════════╗\x1b[0m');
      term.writeln('\x1b[1;36m║\x1b[0m  \x1b[1mArmorInnovate Lab Environment\x1b[0m          \x1b[1;36m║\x1b[0m');
      term.writeln('\x1b[1;36m╚══════════════════════════════════════════╝\x1b[0m');
      term.writeln('');

      // Try WebSocket connection
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/api/armor/lab/${labSlug}/socket`;

      term.writeln(`\x1b[36m[i]\x1b[0m Connecting to lab runtime: ${labSlug}`);
      term.writeln(`\x1b[36m[i]\x1b[0m WebSocket: ${wsUrl}`);
      term.writeln('');

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const connectTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            if (!disposed) startFallback(term);
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          if (disposed) { ws.close(); return; }
          setState('connected');
          term.writeln('\x1b[32m[✓]\x1b[0m Connected to lab runtime.');
          term.writeln('');
          onReady?.();

          // Pipe terminal input → WS
          term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(data);
            }
          });
        };

        ws.onmessage = (evt) => {
          if (typeof evt.data === 'string') {
            term.write(evt.data);
          }
        };

        ws.onclose = (evt) => {
          if (disposed) return;
          if (evt.code === 1000) {
            setState('closed');
            term.writeln('\r\n\x1b[90m[i] Connection closed.\x1b[0m');
            onClose?.('server-close');
          } else {
            startFallback(term);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectTimeout);
          if (!disposed) startFallback(term);
        };
      } catch {
        startFallback(term);
      }

      function startFallback(t: XTerminal) {
        if (disposed) return;
        setState('fallback');
        t.writeln('\x1b[33m[!]\x1b[0m Lab runtime not available — entering local simulation.');
        t.writeln('    Type \x1b[1mhelp\x1b[0m for commands.');
        writeFallbackPrompt();
        t.onData(handleFallbackInput);
        onReady?.();
      }

      return () => {
        disposed = true;
        ro.disconnect();
        wsRef.current?.close();
        term.dispose();
        termRef.current = null;
        wsRef.current = null;
      };
    }

    const cleanup = init();
    return () => { disposed = true; cleanup.then((fn) => fn?.()); };
  }, [labSlug, onReady, onClose, writeFallbackPrompt, handleFallbackInput]);

  return (
    <div className={className}>
      {/* Status indicator */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-ai-line-deep bg-black/30">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            state === 'connected' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
            state === 'fallback'  ? 'bg-amber-400 shadow-[0_0_6px_rgba(217,119,6,0.6)]' :
            state === 'closed'    ? 'bg-red-400' :
            'bg-gray-400 animate-pulse'
          }`}
        />
        <span className="font-mono text-[11px] text-ai-mono-on-deep flex-1">
          armor@lab:~/{labSlug}
        </span>
        <span className="font-mono text-[10px] text-ai-ink-dim uppercase tracking-wider">
          {state === 'connected' ? 'live' :
           state === 'fallback'  ? 'simulation' :
           state === 'closed'    ? 'disconnected' :
           'connecting…'}
        </span>
      </div>
      {/* Terminal container */}
      <div ref={containerRef} className="h-[400px] bg-[#0F172A]" />
    </div>
  );
}
