/**
 * PDF Document for the "Download PDF" feature on /redesign/ask.
 *
 * Rendered client-side via @react-pdf/renderer `pdf(...).toBlob()`.
 * Uses the Greentryst design tokens: Inter font family, teal accents
 * on light cream background, rounded-friendly layout, subtle watermark.
 */

import * as React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Link,
} from '@react-pdf/renderer';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent, PhrasingContent, TableContent } from 'mdast';
import type { PdfExportData } from '../_lib/pdf-export';

// Font registration is best-effort. react-pdf requires TTF/OTF (not WOFF2),
// and the Google Fonts CDN can fail CORS or 404 at runtime, which crashes
// the entire PDF generation. We disable Hyphenation to avoid dictionary fetches
// and skip custom font registration entirely — falling back to the built-in
// Helvetica keeps the export robust and offline-safe.
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  try {
    Font.registerHyphenationCallback((word) => [word]);
  } catch {
    // no-op
  }
  fontsRegistered = true;
}

const TEAL = '#005c55';
const TEAL_LIGHT = '#8cd4ca';
const DARK = '#0a1a1a';
const CREAM = '#f8faf9';
const DIM = '#5c6b6b';
const BORDER = '#e5eceb';

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 56,
    fontSize: 10.5,
    lineHeight: 1.55,
    color: DARK,
    backgroundColor: CREAM,
  },
  headerBar: {
    position: 'absolute',
    top: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerWordmark: {
    fontSize: 13,
    fontWeight: 700,
    color: TEAL,
    letterSpacing: 0.4,
  },
  headerLogo: {
    height: 16,
    width: 'auto',
  },
  headerMeta: {
    fontSize: 8.5,
    color: DIM,
    letterSpacing: 1.2,
  },
  accentBar: {
    position: 'absolute',
    top: 50,
    left: 56,
    right: 56,
    height: 2,
    backgroundColor: TEAL,
    borderRadius: 1,
  },
  watermark: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 72,
    fontWeight: 700,
    color: TEAL,
    opacity: 0.03,
    letterSpacing: 8,
    transform: 'rotate(-22deg)',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    color: DIM,
  },
  eyebrow: {
    fontSize: 8.5,
    fontWeight: 600,
    color: TEAL,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  query: {
    fontSize: 18,
    fontWeight: 600,
    color: DARK,
    lineHeight: 1.35,
    marginBottom: 22,
  },
  groundingNote: {
    fontSize: 9.5,
    color: TEAL,
    backgroundColor: '#e6f4f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 18,
  },
  answerBlock: {
    fontSize: 10.5,
    lineHeight: 1.65,
    color: DARK,
  },
  citeMarker: {
    fontSize: 8,
    fontWeight: 700,
    color: TEAL,
    verticalAlign: 'super',
  },
  sourcesHeader: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: 700,
    color: DARK,
    letterSpacing: 0.4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sourceRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sourceNum: {
    width: 22,
    fontSize: 9.5,
    fontWeight: 700,
    color: TEAL,
  },
  sourceBody: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  sourceTitle: {
    fontWeight: 600,
    color: DARK,
  },
  sourceMeta: {
    color: DIM,
    fontSize: 9,
  },
  sourceLink: {
    color: TEAL,
    textDecoration: 'none',
    fontSize: 9,
  },
  sourceUnavailable: {
    color: DIM,
    fontSize: 9,
    fontStyle: 'italic',
  },
  aboutPage: {
    paddingTop: 96,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontSize: 11,
    lineHeight: 1.7,
    color: DARK,
    backgroundColor: CREAM,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: TEAL,
    marginTop: 24,
    marginBottom: 18,
    letterSpacing: 0.4,
  },
  aboutBody: {
    fontSize: 11,
    lineHeight: 1.75,
    color: DARK,
  },
  aboutCaption: {
    marginTop: 28,
    fontSize: 9,
    color: DIM,
    letterSpacing: 1.2,
  },
});

// ---------- Markdown -> react-pdf renderer ----------

const mdStyles = StyleSheet.create({
  paragraph: { marginBottom: 8, fontSize: 10.5, lineHeight: 1.65, color: DARK },
  h1: { fontSize: 20, fontWeight: 700, color: DARK, marginTop: 16, marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: 700, color: DARK, marginTop: 14, marginBottom: 8 },
  h3: { fontSize: 14, fontWeight: 700, color: DARK, marginTop: 12, marginBottom: 6 },
  h4: { fontSize: 12, fontWeight: 700, color: DARK, marginTop: 10, marginBottom: 6 },
  h5: { fontSize: 11, fontWeight: 700, color: DARK, marginTop: 8, marginBottom: 4 },
  h6: { fontSize: 10, fontWeight: 700, color: DARK, marginTop: 8, marginBottom: 4 },
  listWrap: { marginBottom: 8, paddingLeft: 6 },
  listItemRow: { flexDirection: 'row', marginBottom: 3 },
  listBullet: { width: 14, fontSize: 10.5, color: DARK },
  listBody: { flex: 1, fontSize: 10.5, lineHeight: 1.65, color: DARK },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: TEAL,
    paddingLeft: 10,
    marginBottom: 8,
    marginTop: 4,
    color: DIM,
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 10,
    backgroundColor: '#eef2f1',
    color: DARK,
  },
  codeBlock: {
    backgroundColor: '#0a1a1a',
    color: '#f8faf9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 4,
  },
  codeBlockText: {
    fontFamily: 'Courier',
    fontSize: 9.5,
    color: '#f8faf9',
    lineHeight: 1.5,
  },
  link: { color: TEAL, textDecoration: 'underline' },
  table: {
    marginBottom: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e0e6e4',
  },
  tableRow: { flexDirection: 'row' },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    backgroundColor: TEAL,
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: 700,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e6e4',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9.5,
    color: DARK,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e6e4',
  },
});

/**
 * Render a plain string with inline `[N]` citation markers as a sequence
 * of Text nodes, turning each marker into a superscript.
 */
function renderTextWithCitations(
  text: string,
  keyPrefix: string,
  inheritedStyle?: any,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(
        <Text key={`${keyPrefix}-t-${i++}`} style={inheritedStyle}>
          {text.slice(last, m.index)}
        </Text>,
      );
    }
    out.push(
      <Text key={`${keyPrefix}-c-${i++}`} style={styles.citeMarker}>
        {` [${m[1]}] `}
      </Text>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(
      <Text key={`${keyPrefix}-t-${i++}`} style={inheritedStyle}>
        {text.slice(last)}
      </Text>,
    );
  }
  return out;
}

function renderPhrasing(
  nodes: PhrasingContent[],
  keyPrefix: string,
  inherited: { bold?: boolean; italic?: boolean } = {},
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  nodes.forEach((node, idx) => {
    const k = `${keyPrefix}-${idx}`;
    switch (node.type) {
      case 'text': {
        const style: any = {};
        if (inherited.bold) style.fontWeight = 'bold';
        if (inherited.italic) style.fontStyle = 'italic';
        out.push(
          <Text key={k}>{renderTextWithCitations(node.value, k, style)}</Text>,
        );
        break;
      }
      case 'strong':
        out.push(
          <Text key={k}>
            {renderPhrasing(node.children, k, { ...inherited, bold: true })}
          </Text>,
        );
        break;
      case 'emphasis':
        out.push(
          <Text key={k}>
            {renderPhrasing(node.children, k, { ...inherited, italic: true })}
          </Text>,
        );
        break;
      case 'delete':
        out.push(
          <Text key={k} style={{ textDecoration: 'line-through' }}>
            {renderPhrasing(node.children, k, inherited)}
          </Text>,
        );
        break;
      case 'inlineCode':
        out.push(
          <Text key={k} style={mdStyles.inlineCode}>
            {node.value}
          </Text>,
        );
        break;
      case 'link':
        out.push(
          <Link key={k} src={node.url} style={mdStyles.link}>
            {renderPhrasing(node.children, k, inherited) as any}
          </Link>,
        );
        break;
      case 'break':
        out.push(<Text key={k}>{'\n'}</Text>);
        break;
      case 'image':
        // Images inside answer are rare; render alt text as fallback.
        out.push(<Text key={k}>{node.alt || ''}</Text>);
        break;
      default: {
        // Unknown inline node: fall back to raw text if possible.
        const anyNode = node as any;
        if (Array.isArray(anyNode.children)) {
          out.push(
            <Text key={k}>
              {renderPhrasing(anyNode.children, k, inherited)}
            </Text>,
          );
        } else if (typeof anyNode.value === 'string') {
          out.push(<Text key={k}>{anyNode.value}</Text>);
        }
      }
    }
  });
  return out;
}

function renderBlocks(
  nodes: RootContent[] | TableContent[],
  keyPrefix: string,
  ordered?: { ordered: boolean; start: number },
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  nodes.forEach((node, idx) => {
    const k = `${keyPrefix}-${idx}`;
    switch (node.type) {
      case 'paragraph':
        out.push(
          <Text key={k} style={mdStyles.paragraph}>
            {renderPhrasing(node.children, k)}
          </Text>,
        );
        break;
      case 'heading': {
        const style = [mdStyles.h1, mdStyles.h2, mdStyles.h3, mdStyles.h4, mdStyles.h5, mdStyles.h6][
          (node.depth || 1) - 1
        ];
        out.push(
          <Text key={k} style={style}>
            {renderPhrasing(node.children, k)}
          </Text>,
        );
        break;
      }
      case 'list': {
        const isOrdered = !!node.ordered;
        const startNum = node.start ?? 1;
        out.push(
          <View key={k} style={mdStyles.listWrap}>
            {node.children.map((li, i) => {
              const bullet = isOrdered ? `${startNum + i}.` : '•';
              return (
                <View key={`${k}-li-${i}`} style={mdStyles.listItemRow}>
                  <Text style={mdStyles.listBullet}>{bullet}</Text>
                  <View style={mdStyles.listBody}>
                    {renderBlocks(li.children as RootContent[], `${k}-li-${i}`)}
                  </View>
                </View>
              );
            })}
          </View>,
        );
        break;
      }
      case 'blockquote':
        out.push(
          <View key={k} style={mdStyles.blockquote}>
            {renderBlocks(node.children as RootContent[], k)}
          </View>,
        );
        break;
      case 'code':
        out.push(
          <View key={k} style={mdStyles.codeBlock}>
            <Text style={mdStyles.codeBlockText}>{node.value}</Text>
          </View>,
        );
        break;
      case 'table': {
        const rows = node.children;
        out.push(
          <View key={k} style={mdStyles.table}>
            {rows.map((row, ri) => {
              const isHeader = ri === 0;
              return (
                <View key={`${k}-r-${ri}`} style={mdStyles.tableRow}>
                  {row.children.map((cell, ci) => (
                    <Text
                      key={`${k}-r-${ri}-c-${ci}`}
                      style={isHeader ? mdStyles.tableHeaderCell : mdStyles.tableCell}
                    >
                      {renderPhrasing(cell.children, `${k}-r-${ri}-c-${ci}`)}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>,
        );
        break;
      }
      case 'thematicBreak':
        // Per global style guidance: skip section breakers.
        break;
      case 'html':
        // Render raw HTML as plain text (no HTML parsing inside PDF).
        out.push(
          <Text key={k} style={mdStyles.paragraph}>
            {(node as any).value}
          </Text>,
        );
        break;
      default: {
        const anyNode = node as any;
        if (Array.isArray(anyNode.children)) {
          out.push(...renderBlocks(anyNode.children, k));
        }
      }
    }
  });
  return out;
}

function renderAnswerMarkdown(md: string): React.ReactNode {
  if (!md || !md.trim()) return null;
  let tree: Root;
  try {
    tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
  } catch {
    // If parsing fails for any reason, fall back to a single paragraph.
    return <Text style={mdStyles.paragraph}>{renderTextWithCitations(md, 'fallback')}</Text>;
  }
  return <>{renderBlocks(tree.children, 'md')}</>;
}

export interface AnswerPdfDocumentProps {
  data: PdfExportData;
  logoUrl?: string;
}

export function AnswerPdfDocument({ data, logoUrl }: AnswerPdfDocumentProps) {
  ensureFonts();

  // Parse the answer markdown into a tree and render it with react-pdf
  // primitives. Preserves bold, italic, headings, lists, blockquotes,
  // inline code, code blocks, tables, and links. Citation markers `[N]`
  // are rendered as superscripts inside whatever block they appear in.
  const answerBody = renderAnswerMarkdown(data.answerMarkdown);

  const Header = (
    <>
      <View style={styles.headerBar} fixed>
        {logoUrl ? (
          <Image src={logoUrl} style={styles.headerLogo} />
        ) : (
          <Text style={styles.headerWordmark}>GREENTRYST</Text>
        )}
        <Text style={styles.headerMeta}>SUSTAINIQ</Text>
      </View>
      <View style={styles.accentBar} fixed />
    </>
  );

  const Footer = (
    <View style={styles.footer} fixed>
      <Text>Generated {data.generatedAt}</Text>
      <Text>greentryst.com</Text>
    </View>
  );

  const Watermark = <Text style={styles.watermark} fixed>GREENTRYST</Text>;

  return (
    <Document
      title={`Greentryst SustainIQ — ${data.query.slice(0, 80)}`}
      author="Greentryst"
      creator="Greentryst SustainIQ"
    >
      <Page size="A4" style={styles.page}>
        {Header}
        {Watermark}
        {Footer}

        <Text style={styles.eyebrow}>QUERY</Text>
        <Text style={styles.query}>{data.query}</Text>

        {data.groundingNote && (
          <Text style={styles.groundingNote}>{data.groundingNote}</Text>
        )}

        <Text style={styles.eyebrow}>ANSWER</Text>
        <View style={styles.answerBlock}>{answerBody}</View>

        {data.sources.length > 0 && (
          <>
            <Text style={styles.sourcesHeader}>Sources</Text>
            {data.sources.map((s) => (
              <View key={s.n} style={styles.sourceRow} wrap={false}>
                <Text style={styles.sourceNum}>[{s.n}]</Text>
                <View style={styles.sourceBody}>
                  <Text>
                    <Text style={styles.sourceTitle}>{s.docTitle}</Text>
                    {s.sectionTitle ? (
                      <Text style={styles.sourceMeta}>
                        {` · ${s.sectionTitle}`}
                      </Text>
                    ) : null}
                    {s.pagePart ? (
                      <Text style={styles.sourceMeta}>{` · ${s.pagePart}`}</Text>
                    ) : null}
                  </Text>
                  {s.viewerUrl ? (
                    <Link src={s.viewerUrl} style={styles.sourceLink}>
                      Open source (PDF, page {s.page})
                    </Link>
                  ) : (
                    <Text style={styles.sourceUnavailable}>
                      Source PDF not available online
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </Page>

      {/* About page */}
      <Page size="A4" style={styles.aboutPage}>
        {Watermark}
        <View style={styles.footer} fixed>
          <Text>Generated {data.generatedAt}</Text>
          <Text>greentryst.com</Text>
        </View>

        {logoUrl ? (
          <Image src={logoUrl} style={{ height: 18, width: 'auto', alignSelf: 'flex-start' }} />
        ) : (
          <Text
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: TEAL,
              letterSpacing: 0.4,
            }}
          >
            GREENTRYST
          </Text>
        )}
        <Text style={styles.aboutTitle}>About Greentryst</Text>
        <Text style={styles.aboutBody}>
          Greentryst is a professional platform for sustainability practitioners. It covers climate science, carbon markets, ESG and corporate reporting, clean energy, biodiversity, and the circular economy, drawing on primary sources rather than secondary commentary. SustainIQ, the intelligence layer used to generate this document, grounds every answer in verified references such as VM0042, the EU CBAM regulation, the CSRD and ESRS standards, IPCC AR6, and the GHG Protocol. Each citation resolves to a specific page, so any claim in this document can be traced back to the source. More at greentryst.com.
        </Text>
        <Text style={styles.aboutCaption}>
          This document was generated from a SustainIQ session on
          {' '}{data.generatedAt}.
        </Text>
      </Page>
    </Document>
  );
}

export default AnswerPdfDocument;
