/**
 * TryItDemo
 *
 * Inline interactive preview of SustainIQ. Lets the visitor type a
 * sustainability question and see a sourced answer with full
 * cross-referencing appear - without signing up or hitting the real
 * backend.
 *
 * The key differentiator this component demonstrates is cross-
 * referencing. When SustainIQ answers a question, it doesn't just quote
 * a single document - it pulls the primary source, cross-references
 * in supporting documents, and shows related frameworks that touch
 * the same topic. This proves the answer is grounded in the full
 * body of sustainability regulation, not a single isolated quote.
 *
 * Answer card structure:
 *   [Badge: SustainIQ Answer] [Cross-referenced across N documents] [Verified]
 *   Question echo
 *   Highlighted value (if applicable)
 *   Full answer text
 *   PRIMARY SOURCE with excerpt
 *   CROSS-REFERENCED IN (2-3 supporting citations with excerpts)
 *   RELATED FRAMEWORKS (1-2 connected regulations)
 *
 * When the real SustainIQ backend is wired up, replace `lookupDemoAnswer`
 * with a fetch to `/api/ask` and the rest of the component stays.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, ArrowRight, CheckCircle2, Link2 } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

/* ==========================================================================
   Particle effect - dots flowing during "thinking" state
   ========================================================================== */
function ThinkingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      life: number;
    }

    const particles: Particle[] = [];
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    let animationId: number;

    const createParticle = () => {
      // Start from edges, flow toward center
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(rect.width, rect.height) * 0.6;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Velocity toward center with some randomness
      const speed = 1 + Math.random() * 2;
      const targetAngle = Math.atan2(centerY - y, centerX - x);
      const vx = Math.cos(targetAngle) * speed + (Math.random() - 0.5) * 0.5;
      const vy = Math.sin(targetAngle) * speed + (Math.random() - 0.5) * 0.5;

      particles.push({
        x,
        y,
        vx,
        vy,
        size: 2 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.4,
        life: 1,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Create new particles
      if (Math.random() > 0.7) {
        createParticle();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;

        // Fade out as approaching center
        const distToCenter = Math.hypot(p.x - centerX, p.y - centerY);
        const fadeZone = 60;
        if (distToCenter < fadeZone) {
          p.alpha *= distToCenter / fadeZone;
        }

        if (p.life <= 0 || distToCenter < 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(82, 183, 136, ${p.alpha * p.life})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ==========================================================================
   Typing effect hook
   ========================================================================== */
function useTypingEffect(text: string, isActive: boolean, speed = 15) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  return { displayedText, isComplete };
}

interface SourceCitation {
  citation: string;
  excerpt: string;
}

interface RelatedFramework {
  name: string;
  connection: string;
}

interface DemoAnswer {
  question: string;
  answer: string;
  /** Primary highlighted value (e.g. "27.9", "Jan 1, 2026") shown larger */
  highlight?: string;
  /** Unit or label after the highlight */
  highlightCaption?: string;
  /** The authoritative source the answer comes from */
  primarySource: SourceCitation;
  /** Supporting sources that cross-reference the same topic */
  crossReferences: SourceCitation[];
  /** Adjacent regulations or frameworks that touch the same topic */
  relatedFrameworks: RelatedFramework[];
}

const DEMO_ANSWERS: DemoAnswer[] = [
  {
    question: 'What is the GWP of methane under AR6?',
    answer:
      'The 100-year Global Warming Potential of methane (CH₄) was revised in IPCC AR6 to better reflect climate-carbon feedbacks and fossil vs biogenic origin.',
    highlight: '27.9',
    highlightCaption: '100-year GWP (fossil-origin CH₄)',
    primarySource: {
      citation: 'IPCC AR6 WG1, Chapter 7, Table 7.15, p.1017',
      excerpt:
        '"Fossil CH₄ has a GWP-100 of 29.8 ± 11, and non-fossil CH₄ has a GWP-100 of 27.0 ± 11..."',
    },
    crossReferences: [
      {
        citation: 'AR6 Technical Summary, TS.3.3.2',
        excerpt:
          '"The revised GWP values include carbon-climate feedbacks for the first time..."',
      },
      {
        citation: 'AR6 SPM.C.1.3',
        excerpt:
          '"Strong, rapid and sustained reductions in CH₄ emissions would limit warming..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'UNFCCC Decision 18/CMA.1',
        connection: 'Official GWP values adopted for Paris Agreement reporting (currently AR5)',
      },
      {
        name: 'GHG Protocol Scope 3 Standard',
        connection: 'Uses AR5 GWPs by default, with AR6 update pending',
      },
    ],
  },
  {
    question: 'What is the baseline period for VM0042?',
    answer:
      'The baseline period under VM0042 represents the 10 years of historical management practices before the project start date, used to establish the counterfactual scenario.',
    highlight: '10 years',
    highlightCaption: 'prior to project start date',
    primarySource: {
      citation: 'VM0042 v2.2, Section 3.1.2, p.14',
      excerpt:
        '"The baseline period shall be defined as the 10 years immediately prior to the project start date..."',
    },
    crossReferences: [
      {
        citation: 'Verra Methodology Handbook, p.47',
        excerpt:
          '"For AFOLU methodologies under VCS, baseline periods must reflect common practice at the project location..."',
      },
      {
        citation: 'VCS Standard v4.7, Section 5.2',
        excerpt:
          '"Projects shall document baseline scenario selection using historical data spanning the baseline period..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'VM0032 (Improved Forest Management)',
        connection: 'Uses identical 10-year historical baseline approach',
      },
      {
        name: 'Article 6.4 PACM Methodology',
        connection: 'Baseline periods aligned with Verra AFOLU conventions',
      },
    ],
  },
  {
    question: 'Which companies must file BRSR?',
    answer:
      'SEBI mandates Business Responsibility and Sustainability Report filing for the top 1,000 listed companies by market capitalization on BSE and NSE, with BRSR Core a subset of 150+ data points mandatory from FY 2023-24.',
    highlight: 'Top 1,000',
    highlightCaption: 'listed companies by market cap',
    primarySource: {
      citation: 'SEBI Circular SEBI/HO/CFD/CMD-2/P/CIR/2021/562',
      excerpt:
        '"The top one thousand listed entities based on market capitalisation shall submit a Business Responsibility and Sustainability Report..."',
    },
    crossReferences: [
      {
        citation: 'LODR Regulations, Regulation 34(2)(f)',
        excerpt:
          '"The annual report shall contain a Business Responsibility and Sustainability Report describing the initiatives taken..."',
      },
      {
        citation: 'SEBI BRSR Core Circular, July 2023',
        excerpt:
          '"BRSR Core shall be mandatory for the top 150 listed entities from FY 2023-24, progressively expanding..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'RBI Climate Risk Disclosure Framework',
        connection: 'Parallel disclosure mandate for regulated financial entities',
      },
      {
        name: 'IFRS S1/S2',
        connection: 'BRSR Core datapoints aligned with ISSB disclosure principles',
      },
    ],
  },
  {
    question: 'When does CSRD apply to non-EU companies?',
    answer:
      'CSRD extends to non-EU parent companies that generate significant net turnover in the EU, with reporting required from the 2028 financial year, subject to turnover and EU-subsidiary thresholds.',
    highlight: 'Jan 1, 2028',
    highlightCaption: 'reporting year for non-EU parent companies',
    primarySource: {
      citation: 'EU Directive 2022/2464/EU, Article 40a',
      excerpt:
        '"Non-EU undertakings with net turnover in the Union of more than EUR 150 million for two consecutive years..."',
    },
    crossReferences: [
      {
        citation: 'EFRAG Implementation Guidance, Section 4',
        excerpt:
          '"For the purposes of Article 40a thresholds, net turnover is calculated on a consolidated basis at group level..."',
      },
      {
        citation: 'ESRS 1, Section 3',
        excerpt:
          '"The reporting boundary for non-EU entities shall follow the financial consolidation perimeter..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'CSDDD (2024/1760)',
        connection: 'Similar EUR 150M turnover threshold for non-EU groups',
      },
      {
        name: 'SFDR Article 8/9',
        connection: 'Parallel disclosure requirement for financial market participants',
      },
    ],
  },
  {
    question: 'How many Scope 3 categories are there in the GHG Protocol?',
    answer:
      'The GHG Protocol Corporate Value Chain (Scope 3) Standard defines 15 distinct Scope 3 categories, split into 8 upstream activities (Categories 1-8) and 7 downstream activities (Categories 9-15). Not all categories are relevant to every company - a Scope 3 screening is used to identify which categories are material.',
    highlight: '15 categories',
    highlightCaption: '8 upstream + 7 downstream',
    primarySource: {
      citation: 'GHG Protocol Scope 3 Standard, Chapter 5, Table 5.4, p.34',
      excerpt:
        '"The standard identifies 15 categories of scope 3 emissions, covering both upstream and downstream activities of a reporting company..."',
    },
    crossReferences: [
      {
        citation: 'GHG Protocol Scope 3 Calculation Guidance, Part 2',
        excerpt:
          '"Each of the 15 categories has a corresponding calculation methodology, with multiple methods available to accommodate different data availability situations..."',
      },
      {
        citation: 'Corporate Value Chain Standard FAQ, Section 3',
        excerpt:
          '"Not all reporting companies will have emissions in all 15 categories. Companies should identify material categories through a Scope 3 screening..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'ESRS E1 Climate Change',
        connection: 'Requires disclosure of all 15 Scope 3 categories (or explanation for exclusion)',
      },
      {
        name: 'BRSR Principle 6, Essential Indicator 1',
        connection: 'Mandates upstream Scope 3 disclosure aligned with GHG Protocol categories',
      },
    ],
  },
  {
    question: 'What is double materiality under CSRD?',
    answer:
      'Double materiality requires companies to assess sustainability topics through two lenses simultaneously: financial materiality (how sustainability matters affect enterprise value and financial performance) and impact materiality (how the company affects people and the environment). A topic is material if it meets either criterion.',
    highlight: 'Two lenses',
    highlightCaption: 'Financial materiality + Impact materiality',
    primarySource: {
      citation: 'ESRS 1 General Requirements, Section 3.1-3.5, p.15',
      excerpt:
        '"A sustainability matter is material from an impact perspective when it pertains to the undertaking\'s material actual or potential, positive or negative impacts..."',
    },
    crossReferences: [
      {
        citation: 'EFRAG Implementation Guidance on Materiality Assessment, §4.2',
        excerpt:
          '"The double materiality perspective means that a sustainability matter is material if it meets the criteria of impact materiality, financial materiality, or both..."',
      },
      {
        citation: 'CSRD Directive 2022/2464, Article 29a(2)',
        excerpt:
          '"The sustainability information shall cover matters that are material from both a financial and an impact perspective..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'GRI Universal Standards 2021',
        connection: 'Uses single materiality: impact-only perspective',
      },
      {
        name: 'IFRS S1 General Requirements',
        connection: 'Uses single materiality: financial/enterprise-value perspective only',
      },
    ],
  },
  {
    question: 'How is attribution calculated under PCAF for business loans?',
    answer:
      'Under PCAF, the attribution factor for business loans and unlisted equity equals the outstanding amount divided by the sum of total equity and debt (EVIC for listed, book value for unlisted) of the investee company. This share determines the portion of the borrower\'s absolute emissions allocated to the financial institution.',
    highlight: 'Outstanding / (Equity + Debt)',
    highlightCaption: 'Attribution factor formula',
    primarySource: {
      citation: 'PCAF Global GHG Accounting Standard for Financials, Part A §5.1, p.43',
      excerpt:
        '"The attribution factor for business loans and unlisted equity is calculated as the outstanding amount divided by the total equity plus debt of the investee company..."',
    },
    crossReferences: [
      {
        citation: 'PCAF Data Quality Scoring, Table 5-3',
        excerpt:
          '"Data quality score ranges from 1 (best - verified emissions) to 5 (worst - proxy by sector), recorded at each asset class..."',
      },
      {
        citation: 'TCFD 2023 Annex on Financial Disclosures, p.22',
        excerpt:
          '"Financial institutions are recommended to disclose financed emissions aligned with PCAF methodology, with separate attribution factors by asset class..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'SBTi Financial Institutions Criteria',
        connection: 'Uses PCAF attribution for portfolio alignment targets',
      },
      {
        name: 'CDP Financial Services Questionnaire',
        connection: 'Requires PCAF-aligned financed emissions reporting in module FS',
      },
    ],
  },
  {
    question: 'What is the SBTi 1.5°C target criterion for near-term reductions?',
    answer:
      'SBTi requires companies pursuing 1.5°C-aligned near-term targets to reduce absolute Scope 1 and 2 emissions by at least 4.2% per year in linear terms from the base year. The target period must cover 5 to 10 years, and Scope 3 targets are required if Scope 3 emissions exceed 40% of total.',
    highlight: '4.2% / year',
    highlightCaption: 'Linear absolute reduction for 1.5°C alignment',
    primarySource: {
      citation: 'SBTi Corporate Near-Term Criteria V5.1, Section C, Criterion C13',
      excerpt:
        '"Companies shall reduce scope 1 and 2 emissions by at least 4.2% per year in absolute terms to align with a 1.5°C pathway through 2030..."',
    },
    crossReferences: [
      {
        citation: 'SBTi Target Validation Protocol v2.1, §3.2',
        excerpt:
          '"The linear annual reduction rate is calculated using the Cross-Sectoral Absolute Reduction Approach (CSAA) from the base year to target year..."',
      },
      {
        citation: 'IPCC AR6 WG3, Chapter 3, Table 3.2',
        excerpt:
          '"1.5°C-aligned pathways with no or limited overshoot require global net CO2 emissions to reach net zero around 2050..."',
      },
    ],
    relatedFrameworks: [
      {
        name: 'Race to Zero Campaign',
        connection: 'Requires SBTi-validated near-term targets for all partners',
      },
      {
        name: 'EU Taxonomy DNSH Climate Mitigation',
        connection: 'References SBTi 1.5°C pathways for activity alignment assessment',
      },
    ],
  },
];

const PLACEHOLDER_PREFIX = 'Try: ';

export interface TryItDemoProps {
  className?: string;
}

export function TryItDemo({ className }: TryItDemoProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'answered'>('idle');
  const [currentAnswer, setCurrentAnswer] = useState<DemoAnswer | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typing effect for the answer
  const { displayedText: typedAnswer, isComplete: typingComplete } = useTypingEffect(
    currentAnswer?.answer ?? '',
    showTyping,
    12
  );

  // Get suggested follow-up questions (exclude current question)
  const getFollowUps = useCallback((current: DemoAnswer): DemoAnswer[] => {
    return DEMO_ANSWERS
      .filter((a) => a.question !== current.question)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, []);

  const [followUps, setFollowUps] = useState<DemoAnswer[]>([]);

  // Cycle the placeholder text every 3 seconds when the input is empty
  // and nothing has been answered yet.
  useEffect(() => {
    if (query !== '' || status !== 'idle') return;
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % DEMO_ANSWERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [query, status]);

  const placeholderQuestion = DEMO_ANSWERS[placeholderIndex].question;
  const placeholder = `${PLACEHOLDER_PREFIX}${placeholderQuestion}`;

  const lookupDemoAnswer = (userQuery: string): DemoAnswer => {
    const q = userQuery.toLowerCase();
    const match = DEMO_ANSWERS.find((a) =>
      a.question
        .toLowerCase()
        .split(' ')
        .some((word) => word.length > 3 && q.includes(word))
    );
    return match ?? DEMO_ANSWERS[placeholderIndex];
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const effectiveQuery = query.trim() || placeholderQuestion;
    setQuery(effectiveQuery);
    setStatus('thinking');
    setShowTyping(false);

    setTimeout(() => {
      const answer = lookupDemoAnswer(effectiveQuery);
      setCurrentAnswer(answer);
      setFollowUps(getFollowUps(answer));
      setStatus('answered');
      // Start typing after a brief pause
      setTimeout(() => setShowTyping(true), 100);
    }, 1400); // Longer delay to see particles
  };

  const handleSuggestionClick = (answer: DemoAnswer) => {
    setQuery(answer.question);
    setStatus('thinking');
    setShowTyping(false);
    setTimeout(() => {
      setCurrentAnswer(answer);
      setFollowUps(getFollowUps(answer));
      setStatus('answered');
      setTimeout(() => setShowTyping(true), 100);
    }, 1200);
  };

  const handleReset = () => {
    setQuery('');
    setCurrentAnswer(null);
    setStatus('idle');
    setShowTyping(false);
    setFollowUps([]);
    inputRef.current?.focus();
  };

  // Total documents referenced (primary + cross-references) for the
  // "Cross-referenced across N documents" badge in the answer header.
  const totalCrossReferences = currentAnswer
    ? 1 + currentAnswer.crossReferences.length
    : 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-10 text-center">
        <div
          className="inline-block text-[11px] font-bold uppercase text-gt-medium mb-4"
          style={{ letterSpacing: '0.25em' }}
        >
          Try it yourself
        </div>
        <h3
          className="text-3xl md:text-4xl font-extrabold text-gt-text leading-tight"
          style={{ letterSpacing: '-0.02em' }}
        >
          Ask SustainIQ any sustainability question.
        </h3>
        <p className="mt-4 text-base text-gt-text-muted max-w-2xl mx-auto leading-relaxed">
          Every answer sourced to the correct regulation and framework,
          cross-referenced across multiple authoritative documents.
        </p>
      </div>

      {/* Search box */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative mx-auto max-w-2xl rounded-2xl transition-all duration-300',
          'bg-white border border-gt-border-light shadow-gt-card-lg focus-within:border-gt-medium focus-within:shadow-gt-glow'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Search
            className={cn(
              'w-5 h-5 flex-shrink-0 transition-colors',
              status === 'thinking' ? 'text-gt-medium animate-pulse' : 'text-gt-text-dim'
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-base text-gt-text placeholder:text-gt-text-dim focus:outline-none"
            aria-label="Ask SustainIQ"
            disabled={status === 'thinking'}
          />
          <button
            type="submit"
            disabled={status === 'thinking'}
            className="flex items-center gap-2 bg-gt-medium text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gt-deepest transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Ask</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggestion chips (only when idle) */}
      {status === 'idle' && (
        <div className="mx-auto max-w-2xl mt-6 flex flex-wrap justify-center gap-2">
          {DEMO_ANSWERS.map((answer) => (
            <button
              key={answer.question}
              onClick={() => handleSuggestionClick(answer)}
              className="text-xs font-medium text-gt-text-muted bg-white border border-gt-border-light rounded-full px-3 py-1.5 hover:border-gt-medium hover:text-gt-medium transition-colors"
            >
              {answer.question}
            </button>
          ))}
        </div>
      )}

      {/* Thinking state with particle effect */}
      {status === 'thinking' && (
        <div className="relative mx-auto max-w-2xl mt-8 h-32">
          <ThinkingParticles />
          <div className="absolute inset-0 flex items-center justify-center gap-3 text-sm text-gt-text-muted">
            <Sparkles className="w-4 h-4 text-gt-medium animate-pulse" />
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              Cross-referencing across indexed documents...
            </span>
          </div>
        </div>
      )}

      {/* Answer display */}
      {status === 'answered' && currentAnswer && (
        <div className="mx-auto max-w-3xl mt-8 animate-gt-fade-in-up">
          <div className="rounded-2xl bg-gt-deep text-white p-7 md:p-9 border border-white/10 shadow-gt-card-lg">
            {/* Header: badge + cross-ref count + verified */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span
                className="px-2.5 py-1 rounded-md bg-gt-leaf/15 text-gt-leaf text-[11px] font-bold uppercase"
                style={{ letterSpacing: '0.1em' }}
              >
                SustainIQ Answer
              </span>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-white/80 text-[11px] font-semibold"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                <Link2 className="w-3 h-3" />
                Cross-referenced across {totalCrossReferences} documents
              </span>
              <span className="flex items-center gap-1.5 ml-auto text-gt-leaf">
                <CheckCircle2 className="w-4 h-4" />
                <span
                  className="text-[11px] font-bold uppercase"
                  style={{ letterSpacing: '0.1em' }}
                >
                  Verified
                </span>
              </span>
            </div>

            {/* Question echo */}
            <p className="text-sm text-white/55 mb-4">{currentAnswer.question}</p>

            {/* Highlight value */}
            {currentAnswer.highlight && (
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="text-4xl md:text-5xl font-bold text-gt-leaf"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {currentAnswer.highlight}
                </span>
                {currentAnswer.highlightCaption && (
                  <span className="text-sm text-white/65">
                    {currentAnswer.highlightCaption}
                  </span>
                )}
              </div>
            )}

            {/* Full answer text with typing effect */}
            <p className="text-base text-white/85 leading-relaxed mb-8">
              {typedAnswer}
              {!typingComplete && (
                <span className="inline-block w-0.5 h-5 bg-gt-leaf ml-0.5 animate-pulse" />
              )}
            </p>

            {/* Primary source */}
            <div className="mb-6">
              <div
                className="text-[10px] font-bold text-gt-leaf uppercase mb-2"
                style={{ letterSpacing: '0.2em' }}
              >
                Primary Source
              </div>
              <div className="bg-black/25 rounded-lg border-l-2 border-gt-leaf p-4">
                <p
                  className="text-[12px] text-gt-leaf font-semibold mb-2"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {currentAnswer.primarySource.citation}
                </p>
                <p className="text-sm text-white/70 italic leading-relaxed">
                  {currentAnswer.primarySource.excerpt}
                </p>
              </div>
            </div>

            {/* Cross-referenced in */}
            <div className="mb-6">
              <div
                className="text-[10px] font-bold text-white/55 uppercase mb-2"
                style={{ letterSpacing: '0.2em' }}
              >
                Cross-referenced in
              </div>
              <div className="space-y-2">
                {currentAnswer.crossReferences.map((ref) => (
                  <div
                    key={ref.citation}
                    className="bg-white/[0.03] rounded-lg border border-white/5 p-3 hover:bg-white/[0.06] hover:border-white/10 transition-colors cursor-pointer"
                  >
                    <p
                      className="text-[11px] text-white/80 font-semibold mb-1"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {ref.citation}
                    </p>
                    <p className="text-xs text-white/55 italic leading-relaxed">
                      {ref.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related frameworks */}
            <div>
              <div
                className="text-[10px] font-bold text-white/55 uppercase mb-2"
                style={{ letterSpacing: '0.2em' }}
              >
                Related Frameworks
              </div>
              <div className="flex flex-wrap gap-2">
                {currentAnswer.relatedFrameworks.map((framework) => (
                  <div
                    key={framework.name}
                    className="group relative bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5 hover:border-gt-leaf/40 transition-colors cursor-pointer"
                  >
                    <span
                      className="text-[11px] text-white/75 group-hover:text-white"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {framework.name}
                    </span>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gt-text-dark border border-white/10 rounded-lg text-[11px] text-white/80 leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {framework.connection}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gt-text-dark border-r border-b border-white/10 rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested follow-up questions */}
          {typingComplete && followUps.length > 0 && (
            <div className="mt-6 animate-gt-fade-in-up">
              <p className="text-center text-sm text-gt-text-muted mb-3">
                Related questions you might ask:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {followUps.map((followUp) => (
                  <button
                    key={followUp.question}
                    onClick={() => handleSuggestionClick(followUp)}
                    className="text-xs font-medium text-gt-medium bg-gt-light border border-gt-border-light rounded-full px-4 py-2 hover:border-gt-medium hover:bg-white transition-all hover:shadow-sm"
                  >
                    {followUp.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset CTA */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleReset}
              className="text-sm text-gt-medium hover:text-gt-deepest font-semibold transition-colors flex items-center gap-2"
            >
              Ask another question
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
