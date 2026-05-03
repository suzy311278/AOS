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

import { useRef, useEffect, useState } from 'react';
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

  // Stable refs for callbacks so the mount effect runs only once per labSlug
  const onReadyRef = useRef(onReady);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    const lineBuffer = { value: '' };
    const dataDisposables: Array<{ dispose: () => void }> = [];

    const writeFallbackPrompt = (t: XTerminal) => {
      t.write('\r\n\x1b[36marmor@lab\x1b[0m:\x1b[33m~/' + labSlug + '\x1b[0m$ ');
    };

    const handleFallbackInput = (t: XTerminal, data: string) => {
      for (const ch of data) {
        if (ch === '\r' || ch === '\n') {
          const cmd = lineBuffer.value.trim();
          lineBuffer.value = '';
          t.write('\r\n');

          if (!cmd) {
            writeFallbackPrompt(t);
            continue;
          }

          switch (cmd) {
            case 'help':
              t.writeln('\x1b[1mAvailable commands:\x1b[0m');
              t.writeln('  help       Show this message');
              t.writeln('  scan       Run a simulated Modbus scan');
              t.writeln('  status     Show lab runtime status');
              t.writeln('  clear      Clear the screen');
              t.writeln('  exit       Close the terminal');
              break;
            case 'scan':
              t.writeln('\x1b[36m[i]\x1b[0m Scanning Modbus/TCP on 127.0.0.1:502…');
              t.writeln('  Slave ID 1 … \x1b[32mONLINE\x1b[0m  (holding registers: 40001–40100)');
              t.writeln('  Slave ID 2 … \x1b[32mONLINE\x1b[0m  (coils: 00001–00064)');
              t.writeln('  Slave ID 3 … \x1b[31mOFFLINE\x1b[0m');
              t.writeln('\x1b[36m[i]\x1b[0m Scan complete. 2/3 slaves responding.');
              break;
            case 'status':
              t.writeln('\x1b[36m[i]\x1b[0m Lab: ' + labSlug);
              t.writeln('  Runtime:    \x1b[33mlocal-fallback\x1b[0m (no WS connection)');
              t.writeln('  Protocol:   Modbus/TCP');
              t.writeln('  Port:       502');
              t.writeln('  Status:     \x1b[33mSimulated\x1b[0m');
              break;
            case 'clear':
              t.clear();
              break;
            case 'exit':
              t.writeln('\x1b[90mSession closed.\x1b[0m');
              onCloseRef.current?.('user-exit');
              return;
            default:
              t.writeln(`\x1b[31mCommand not found:\x1b[0m ${cmd}`);
              t.writeln('Type \x1b[1mhelp\x1b[0m for available commands.');
          }
          writeFallbackPrompt(t);
        } else if (ch === '\x7f') {
          if (lineBuffer.value.length > 0) {
            lineBuffer.value = lineBuffer.value.slice(0, -1);
            t.write('\b \b');
          }
        } else if (ch >= ' ') {
          lineBuffer.value += ch;
          t.write(ch);
        }
      }
    };

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
          onReadyRef.current?.();

          // Pipe terminal input → WS (single handler, tracked for disposal)
          dataDisposables.push(
            term.onData((data) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
              }
            })
          );
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
            onCloseRef.current?.('server-close');
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
        // Dispose any prior data handlers (e.g. WS handler) so each
        // keystroke is processed exactly once — fixes the "hheellpp"
        // doubling that occurred when both handlers were active.
        while (dataDisposables.length) dataDisposables.pop()?.dispose();
        setState('fallback');
        t.writeln('\x1b[33m[!]\x1b[0m Lab runtime not available — entering local simulation.');
        t.writeln('    Type \x1b[1mhelp\x1b[0m for commands.');
        writeFallbackPrompt(t);
        dataDisposables.push(t.onData((data) => handleFallbackInput(t, data)));
        onReadyRef.current?.();
      }

      return () => {
        disposed = true;
        ro.disconnect();
        while (dataDisposables.length) dataDisposables.pop()?.dispose();
        wsRef.current?.close();
        term.dispose();
        termRef.current = null;
        wsRef.current = null;
      };
    }

    const cleanup = init();
    return () => { disposed = true; cleanup.then((fn) => fn?.()); };
  }, [labSlug]);

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
      {/* Terminal container — responsive height for mobile */}
      <div ref={containerRef} className="h-[280px] sm:h-[360px] lg:h-[400px] bg-[#0F172A]" />
    </div>
  );
}
