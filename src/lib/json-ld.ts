/**
 * Serialize a value for embedding inside a <script type="application/ld+json">
 * block. JSON.stringify alone is NOT safe here: it does not escape "</script>"
 * or U+2028 / U+2029 line separators, so any stringified value containing
 * those sequences would break out of the script tag or the JSON parser.
 *
 * Use this whenever you pass the result to dangerouslySetInnerHTML inside
 * an ld+json (or plain inline JSON) script element.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
