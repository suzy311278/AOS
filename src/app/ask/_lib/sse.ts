import type { SSEEvent } from './pipeline-types';

/**
 * Async iterator over a fetch ReadableStream that yields typed SSE events.
 * Handles partial chunks by maintaining a string buffer, splitting on \n, and
 * popping the incomplete trailing line back into the buffer on each iteration.
 */
export async function* iterSSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          yield JSON.parse(payload) as SSEEvent;
        } catch {
          /* skip malformed */
        }
      }
    }
    // Flush any remaining buffered line
    if (buffer.startsWith('data: ')) {
      const payload = buffer.slice(6);
      if (payload && payload !== '[DONE]') {
        try {
          yield JSON.parse(payload) as SSEEvent;
        } catch {
          /* skip */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}
