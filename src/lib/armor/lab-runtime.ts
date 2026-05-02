/**
 * Lab runtime manager — server-side bridge between the WebSocket handler
 * and ephemeral Docker containers running PLC simulators.
 *
 * Phase 3 ships a **local mock** that echoes commands and fakes protocol
 * responses. When the Docker lab-runner infrastructure is deployed
 * (Phase 3.4+), this module will:
 *
 *   1. Spin up a container from the lab's Dockerfile.
 *   2. Attach to the container's stdio via Docker API.
 *   3. Pipe WS frames ↔ container stdio.
 *   4. Tear down the container on disconnect or timeout.
 *
 * For now, the mock implementation keeps the WS handler functional and
 * lets the frontend terminal work end-to-end without Docker.
 */

export interface LabSession {
  id: string;
  labSlug: string;
  state: 'booting' | 'running' | 'stopped';
  createdAt: number;
  /** Write data to the lab process stdin. */
  write: (data: string) => void;
  /** Register a handler for lab process stdout. */
  onData: (handler: (data: string) => void) => void;
  /** Tear down the lab session. */
  destroy: () => void;
}

// ── Active sessions (in-memory, single-process) ──────────────────────

const sessions = new Map<string, LabSession>();

export function getSession(id: string): LabSession | undefined {
  return sessions.get(id);
}

export function listSessions(): LabSession[] {
  return Array.from(sessions.values());
}

// ── Mock lab session ──────────────────────────────────────────────────

export function createMockSession(labSlug: string): LabSession {
  const id = `lab-${labSlug}-${Date.now().toString(36)}`;
  const handlers: ((data: string) => void)[] = [];
  let lineBuffer = '';
  let running = true;

  function emit(data: string) {
    for (const h of handlers) h(data);
  }

  function processCommand(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) {
      prompt();
      return;
    }

    switch (trimmed) {
      case 'help':
        emit('\r\n\x1b[1mLab commands:\x1b[0m\r\n');
        emit('  help       Show this message\r\n');
        emit('  scan       Enumerate Modbus slaves\r\n');
        emit('  read <reg> Read a holding register\r\n');
        emit('  write <reg> <val> Write a holding register\r\n');
        emit('  coils      List coil states\r\n');
        emit('  capture    Start pcap capture\r\n');
        emit('  status     Lab runtime status\r\n');
        emit('  clear      Clear terminal\r\n');
        emit('  exit       End session\r\n');
        break;

      case 'scan':
        emit('\r\n\x1b[36m[modbus-scan]\x1b[0m Scanning 127.0.0.1:502…\r\n');
        emit('  Unit  1  \x1b[32mONLINE\x1b[0m   Holding registers 40001–40100\r\n');
        emit('  Unit  2  \x1b[32mONLINE\x1b[0m   Coils 00001–00064\r\n');
        emit('  Unit  3  \x1b[31mOFFLINE\x1b[0m  (no response)\r\n');
        emit('\x1b[36m[modbus-scan]\x1b[0m 2 of 3 units responding.\r\n');
        break;

      case 'coils':
        emit('\r\n\x1b[36m[coils]\x1b[0m Unit 2 — 8 coils:\r\n');
        emit('  00001: \x1b[32mON\x1b[0m   00002: \x1b[31mOFF\x1b[0m  00003: \x1b[32mON\x1b[0m   00004: \x1b[32mON\x1b[0m\r\n');
        emit('  00005: \x1b[31mOFF\x1b[0m  00006: \x1b[31mOFF\x1b[0m  00007: \x1b[32mON\x1b[0m   00008: \x1b[31mOFF\x1b[0m\r\n');
        break;

      case 'capture':
        emit('\r\n\x1b[36m[pcap]\x1b[0m Capturing on eth0… (mock — 10 packets)\r\n');
        for (let i = 1; i <= 10; i++) {
          emit(`  ${i.toString().padStart(3)}  ${new Date().toISOString()}  Modbus/TCP  ${i % 3 === 0 ? 'FC5 Write' : 'FC3 Read'}\r\n`);
        }
        emit('\x1b[36m[pcap]\x1b[0m 10 packets captured, saved to /tmp/capture.pcap\r\n');
        break;

      case 'status':
        emit('\r\n\x1b[36m[status]\x1b[0m\r\n');
        emit(`  Lab:       ${labSlug}\r\n`);
        emit('  Runtime:   mock (no Docker)\r\n');
        emit('  Protocol:  Modbus/TCP\r\n');
        emit('  Port:      502\r\n');
        emit(`  Session:   ${id}\r\n`);
        emit(`  Uptime:    ${Math.floor((Date.now() - session.createdAt) / 1000)}s\r\n`);
        break;

      case 'clear':
        emit('\x1b[2J\x1b[H');
        break;

      case 'exit':
        emit('\r\n\x1b[90mSession ended.\x1b[0m\r\n');
        running = false;
        session.state = 'stopped';
        return;

      default:
        if (trimmed.startsWith('read ')) {
          const reg = trimmed.slice(5).trim();
          const val = Math.floor(Math.random() * 65535);
          emit(`\r\n\x1b[36m[read]\x1b[0m Register ${reg} = ${val} (0x${val.toString(16).toUpperCase()})\r\n`);
        } else if (trimmed.startsWith('write ')) {
          const parts = trimmed.slice(6).trim().split(/\s+/);
          emit(`\r\n\x1b[33m[write]\x1b[0m Register ${parts[0]} ← ${parts[1] ?? '0'} \x1b[32mOK\x1b[0m\r\n`);
        } else {
          emit(`\r\n\x1b[31mUnknown command:\x1b[0m ${trimmed}\r\n`);
          emit('Type \x1b[1mhelp\x1b[0m for available commands.\r\n');
        }
    }
    if (running) prompt();
  }

  function prompt() {
    emit(`\x1b[36marmor@lab\x1b[0m:\x1b[33m~/${labSlug}\x1b[0m$ `);
  }

  const session: LabSession = {
    id,
    labSlug,
    state: 'running',
    createdAt: Date.now(),
    write(data: string) {
      if (!running) return;
      for (const ch of data) {
        if (ch === '\r' || ch === '\n') {
          emit('\r\n');
          processCommand(lineBuffer);
          lineBuffer = '';
        } else if (ch === '\x7f') {
          if (lineBuffer.length > 0) {
            lineBuffer = lineBuffer.slice(0, -1);
            emit('\b \b');
          }
        } else if (ch >= ' ') {
          lineBuffer += ch;
          emit(ch);
        }
      }
    },
    onData(handler) {
      handlers.push(handler);
    },
    destroy() {
      running = false;
      session.state = 'stopped';
      sessions.delete(id);
    },
  };

  sessions.set(id, session);

  // Boot sequence
  setTimeout(() => {
    emit('\x1b[36m[boot]\x1b[0m Initializing lab runtime…\r\n');
    emit(`\x1b[36m[boot]\x1b[0m Lab: ${labSlug}\r\n`);
    emit('\x1b[36m[boot]\x1b[0m Protocol: Modbus/TCP on port 502\r\n');
    emit('\x1b[36m[boot]\x1b[0m Starting PLC simulator… \x1b[32mOK\x1b[0m\r\n');
    emit('\x1b[36m[boot]\x1b[0m Ready. Type \x1b[1mhelp\x1b[0m for commands.\r\n\r\n');
    prompt();
  }, 200);

  return session;
}

// ── Session cleanup (auto-reap after 30 minutes) ─────────────────────

const REAP_INTERVAL_MS = 60_000;
const MAX_SESSION_AGE_MS = 30 * 60_000;

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, s] of sessions) {
      if (now - s.createdAt > MAX_SESSION_AGE_MS) {
        s.destroy();
        sessions.delete(id);
      }
    }
  }, REAP_INTERVAL_MS);
}
