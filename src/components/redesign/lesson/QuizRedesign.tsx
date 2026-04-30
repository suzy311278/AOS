/**
 * QuizRedesign
 *
 * Redesigned Knowledge Check that sits at the bottom of every lesson
 * page. Self-contained client component: it owns all interaction
 * state internally, so the lesson route is a server component that
 * just passes the parsed questions array down.
 *
 * Features preserved from the production Quiz:
 *   - Four question types: multiple-choice, true-false, multi-select,
 *     matching
 *   - Per-question check / submit logic with correctness feedback
 *   - Progressive answering (no need to fill all questions before
 *     getting feedback on the first)
 *   - Final score display once every question is submitted
 *   - Reset button
 *   - Seeded shuffle for the right column of matching questions
 *     so the same lesson always renders the same shuffle
 *
 * Visual treatment:
 *   - Knowledge Check header with dark forest icon tile + title +
 *     subtitle + "N of M answered" mono badge (borrowed from the
 *     reference HTML design at experiment-1/lesson.html)
 *   - Each question is a white card with rounded corners, hairline
 *     border, and a numbered circular badge
 *   - Options are tappable rows with brand-aligned highlight on
 *     hover and selection
 *   - Correct feedback uses leaf-green check + tinted background
 *   - Incorrect feedback uses rose tint + cross icon
 *   - Explanation appears below the options after submission
 *   - No emoji, no gradients on large surfaces, all Lucide icons
 */

'use client';

import { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import type {
  QuizQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  MultiSelectQuestion,
  MatchingQuestion,
} from '@/lib/types';
import { cn } from '@/components/redesign/lib/cn';

/**
 * Per-question state. The shape mirrors the production QuizState
 * but flattened into a single map keyed by question index.
 */
interface QuestionState {
  /** For multiple-choice and true-false: the chosen option index */
  answer?: number;
  /** For multi-select: the array of chosen option indices */
  multiSelect?: number[];
  /** For matching: pairs[i] = position in shuffled right column */
  matching?: number[];
  /** Whether the user has clicked the check / submit button */
  submitted: boolean;
}

type QuizStateMap = Record<number, QuestionState>;

/* ============================================================
   Seeded shuffle for matching question right column
   ============================================================ */

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/* ============================================================
   Correctness check
   ============================================================ */

function isCorrect(q: QuizQuestion, qIdx: number, state: QuestionState): boolean {
  const type = q.type ?? 'multiple-choice';

  if (type === 'multiple-choice') {
    return state.answer === (q as MultipleChoiceQuestion).answer;
  }

  if (type === 'true-false') {
    // 0 = True, 1 = False in the answer index
    return (state.answer === 0) === (q as TrueFalseQuestion).answer;
  }

  if (type === 'multi-select') {
    const ms = q as MultiSelectQuestion;
    const selected = [...(state.multiSelect ?? [])].sort((a, b) => a - b);
    const correct = [...ms.answers].sort((a, b) => a - b);
    return (
      selected.length === correct.length &&
      selected.every((v, i) => v === correct[i])
    );
  }

  if (type === 'matching') {
    const mt = q as MatchingQuestion;
    const seed = hashSeed(mt.question);
    const shuffledRightOrder = seededShuffle(mt.pairs.map((_, i) => i), seed);
    // shuffledRightOrder[i] = original index of the right item shown
    // at position i in the dropdown. Correct mapping: pair i should
    // map to whichever shuffled position contains its original index.
    const correctMapping = mt.pairs.map((_, origIdx) =>
      shuffledRightOrder.indexOf(origIdx)
    );
    const mapping = state.matching;
    if (!mapping || mapping.length !== mt.pairs.length) return false;
    return mt.pairs.every((_, i) => mapping[i] === correctMapping[i]);
  }

  return false;
}

/* ============================================================
   Public component
   ============================================================ */

export interface QuizRedesignProps {
  questions: QuizQuestion[];
  /** Lesson id used as part of the matching shuffle seed */
  lessonId: string;
}

export function QuizRedesign({ questions, lessonId }: QuizRedesignProps) {
  const [state, setState] = useState<QuizStateMap>({});

  if (!questions || questions.length === 0) return null;

  const submittedCount = Object.values(state).filter((s) => s.submitted).length;
  const allSubmitted = submittedCount === questions.length;
  const correctCount = questions.filter(
    (q, i) => state[i]?.submitted && isCorrect(q, i, state[i] ?? { submitted: false })
  ).length;
  const hasAnyState = Object.keys(state).length > 0;

  function update(qIdx: number, patch: Partial<QuestionState>) {
    setState((prev) => ({
      ...prev,
      [qIdx]: { ...(prev[qIdx] ?? { submitted: false }), ...patch },
    }));
  }

  function submit(qIdx: number) {
    update(qIdx, { submitted: true });
  }

  function reset() {
    setState({});
  }

  return (
    <section
      aria-label="Lesson knowledge check"
      className="mt-16 pt-12 border-t border-gt-border-light"
    >
      {/* ========================================================
          Header band
          ======================================================== */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Brain className="w-5 h-5 text-gt-leaf" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <p
              className="text-[10px] font-bold uppercase text-gt-medium mb-1"
              style={{
                letterSpacing: '0.2em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              Knowledge Check
            </p>
            <h2 className="text-xl font-bold text-gt-text leading-snug tracking-tight">
              Test what you just learned
            </h2>
            <p className="text-[13px] text-gt-text-muted mt-1">
              {questions.length} {questions.length === 1 ? 'question' : 'questions'} · check each one as you go
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gt-medium/[0.08] text-gt-medium text-[11px] font-bold"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            {submittedCount} of {questions.length} answered
          </span>
          {hasAnyState && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-[11px] text-gt-text-dim hover:text-gt-medium transition-colors"
            >
              <RotateCw className="w-3 h-3" strokeWidth={2.5} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          Questions
          ======================================================== */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <QuestionCard
            key={qIdx}
            question={q}
            qIdx={qIdx}
            state={state[qIdx] ?? { submitted: false }}
            update={(patch) => update(qIdx, patch)}
            submit={() => submit(qIdx)}
            lessonId={lessonId}
          />
        ))}
      </div>

      {/* ========================================================
          Final score band
          ======================================================== */}
      {allSubmitted && (
        <div
          className={cn(
            'mt-8 p-6 rounded-2xl border flex items-start gap-4',
            correctCount === questions.length
              ? 'bg-gt-leaf/10 border-gt-leaf/35'
              : 'bg-gt-medium/[0.06] border-gt-medium/20'
          )}
        >
          <CheckCircle2
            className="w-6 h-6 text-gt-medium flex-shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <div>
            <p className="font-bold text-gt-deepest text-[16px] mb-0.5">
              {correctCount === questions.length
                ? 'Perfect score'
                : `${correctCount} of ${questions.length} correct`}
            </p>
            <p className="text-[14px] text-gt-text-muted leading-relaxed">
              {correctCount === questions.length
                ? 'You can move to the next lesson with confidence.'
                : 'Reset and try again, or move on and revisit this lesson later.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   QuestionCard
   ============================================================ */

interface QuestionCardProps {
  question: QuizQuestion;
  qIdx: number;
  state: QuestionState;
  update: (patch: Partial<QuestionState>) => void;
  submit: () => void;
  lessonId: string;
}

function QuestionCard({
  question,
  qIdx,
  state,
  update,
  submit,
  lessonId,
}: QuestionCardProps) {
  const type = question.type ?? 'multiple-choice';
  const correct = isCorrect(question, qIdx, state);
  const number = qIdx + 1;

  return (
    <div className="bg-white border border-gt-border-light rounded-2xl p-6 lg:p-7 shadow-gt-card">
      {/* Question header */}
      <div className="flex items-start gap-4 mb-5">
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gt-medium/[0.10] text-gt-medium text-[12px] font-bold flex items-center justify-center mt-0.5"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
          aria-hidden
        >
          {number}
        </span>
        <p className="text-[16px] font-semibold text-gt-text leading-relaxed flex-1 min-w-0">
          {question.question}
        </p>
      </div>

      {/* Per-type body */}
      <div className="pl-12">
        {type === 'multiple-choice' && (
          <MultipleChoiceBody
            question={question as MultipleChoiceQuestion}
            state={state}
            update={update}
          />
        )}
        {type === 'true-false' && (
          <TrueFalseBody
            question={question as TrueFalseQuestion}
            state={state}
            update={update}
          />
        )}
        {type === 'multi-select' && (
          <MultiSelectBody
            question={question as MultiSelectQuestion}
            state={state}
            update={update}
          />
        )}
        {type === 'matching' && (
          <MatchingBody
            question={question as MatchingQuestion}
            state={state}
            update={update}
            seedKey={`${lessonId}-${qIdx}`}
          />
        )}

        {/* Submit / feedback row */}
        {!state.submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!hasAnswer(question, state)}
            className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gt-medium text-white text-[13px] font-bold hover:bg-gt-deepest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check answer
          </button>
        ) : (
          <FeedbackBlock
            correct={correct}
            explanation={question.explanation}
          />
        )}
      </div>
    </div>
  );
}

function hasAnswer(question: QuizQuestion, state: QuestionState): boolean {
  const type = question.type ?? 'multiple-choice';
  if (type === 'multiple-choice' || type === 'true-false') {
    return typeof state.answer === 'number';
  }
  if (type === 'multi-select') {
    return (state.multiSelect?.length ?? 0) > 0;
  }
  if (type === 'matching') {
    const mt = question as MatchingQuestion;
    return (
      (state.matching?.length ?? 0) === mt.pairs.length &&
      (state.matching ?? []).every((v) => typeof v === 'number')
    );
  }
  return false;
}

/* ============================================================
   Per-type bodies
   ============================================================ */

function OptionRow({
  index,
  label,
  selected,
  disabled,
  type,
  onClick,
}: {
  index: number;
  label: string;
  selected: boolean;
  disabled: boolean;
  type: 'radio' | 'checkbox';
  onClick: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-all',
        selected
          ? 'border-gt-medium bg-gt-medium/[0.08]'
          : 'border-gt-border-light bg-white hover:border-gt-medium/40 hover:bg-gt-medium/[0.03]',
        disabled && 'opacity-70 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-bold',
          type === 'radio' ? 'rounded-full' : 'rounded-md',
          selected
            ? 'bg-gt-medium text-white'
            : 'bg-gt-border-light/60 text-gt-text-muted'
        )}
        style={{
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
        aria-hidden
      >
        {letter}
      </span>
      <span className="text-[14px] text-gt-text leading-snug">{label}</span>
    </button>
  );
}

function MultipleChoiceBody({
  question,
  state,
  update,
}: {
  question: MultipleChoiceQuestion;
  state: QuestionState;
  update: (patch: Partial<QuestionState>) => void;
}) {
  return (
    <div className="space-y-2.5">
      {question.options.map((opt, i) => (
        <OptionRow
          key={i}
          index={i}
          label={opt}
          selected={state.answer === i}
          disabled={state.submitted}
          type="radio"
          onClick={() => update({ answer: i })}
        />
      ))}
    </div>
  );
}

function TrueFalseBody({
  question,
  state,
  update,
}: {
  question: TrueFalseQuestion;
  state: QuestionState;
  update: (patch: Partial<QuestionState>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <OptionRow
        index={0}
        label="True"
        selected={state.answer === 0}
        disabled={state.submitted}
        type="radio"
        onClick={() => update({ answer: 0 })}
      />
      <OptionRow
        index={1}
        label="False"
        selected={state.answer === 1}
        disabled={state.submitted}
        type="radio"
        onClick={() => update({ answer: 1 })}
      />
    </div>
  );
}

function MultiSelectBody({
  question,
  state,
  update,
}: {
  question: MultiSelectQuestion;
  state: QuestionState;
  update: (patch: Partial<QuestionState>) => void;
}) {
  const selected = state.multiSelect ?? [];
  return (
    <div className="space-y-2.5">
      <p
        className="text-[11px] font-bold uppercase text-gt-text-dim mb-2"
        style={{
          letterSpacing: '0.14em',
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        Select all that apply
      </p>
      {question.options.map((opt, i) => (
        <OptionRow
          key={i}
          index={i}
          label={opt}
          selected={selected.includes(i)}
          disabled={state.submitted}
          type="checkbox"
          onClick={() => {
            if (state.submitted) return;
            const next = selected.includes(i)
              ? selected.filter((v) => v !== i)
              : [...selected, i];
            update({ multiSelect: next });
          }}
        />
      ))}
    </div>
  );
}

function MatchingBody({
  question,
  state,
  update,
  seedKey,
}: {
  question: MatchingQuestion;
  state: QuestionState;
  update: (patch: Partial<QuestionState>) => void;
  seedKey: string;
}) {
  const seed = hashSeed(seedKey + question.question);
  const shuffledRightOrder = seededShuffle(
    question.pairs.map((_, i) => i),
    seed
  );
  const shuffledRightLabels = shuffledRightOrder.map(
    (origIdx) => question.pairs[origIdx].right
  );

  const mapping = state.matching ?? new Array(question.pairs.length).fill(-1);

  function setMapping(leftIdx: number, rightPos: number) {
    if (state.submitted) return;
    const next = [...mapping];
    next[leftIdx] = rightPos;
    update({ matching: next });
  }

  return (
    <div className="space-y-2.5">
      <p
        className="text-[11px] font-bold uppercase text-gt-text-dim mb-2"
        style={{
          letterSpacing: '0.14em',
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        Match each item to its pair
      </p>
      {question.pairs.map((pair, leftIdx) => (
        <div
          key={leftIdx}
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border border-gt-border-light bg-white"
        >
          <p className="text-[14px] font-semibold text-gt-text flex-1 min-w-0">
            {pair.left}
          </p>
          <span className="text-gt-text-dim text-sm hidden sm:inline">→</span>
          <select
            disabled={state.submitted}
            value={mapping[leftIdx] ?? -1}
            onChange={(e) => setMapping(leftIdx, parseInt(e.target.value, 10))}
            className="text-[13px] px-3 py-2 rounded-lg border border-gt-border-light bg-white text-gt-text focus:outline-none focus:border-gt-medium focus:ring-2 focus:ring-gt-medium/15 disabled:opacity-70 sm:max-w-xs"
          >
            <option value={-1}>Select a match…</option>
            {shuffledRightLabels.map((label, pos) => (
              <option key={pos} value={pos}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Feedback block (correct / incorrect + optional explanation)
   ============================================================ */

function FeedbackBlock({
  correct,
  explanation,
}: {
  correct: boolean;
  explanation?: string;
}) {
  return (
    <div
      className={cn(
        'mt-5 flex items-start gap-3 px-4 py-3.5 rounded-lg border',
        correct
          ? 'bg-gt-leaf/10 border-gt-leaf/35'
          : 'bg-rose-50 border-rose-200'
      )}
    >
      {correct ? (
        <CheckCircle2
          className="w-5 h-5 text-gt-medium flex-shrink-0 mt-0.5"
          strokeWidth={2}
        />
      ) : (
        <XCircle
          className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
          strokeWidth={2}
        />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            'font-bold text-[14px]',
            correct ? 'text-gt-deepest' : 'text-rose-800'
          )}
        >
          {correct ? 'Correct' : 'Not quite'}
        </p>
        {explanation && (
          <p className="text-[13px] mt-1 text-gt-text-muted leading-relaxed">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
