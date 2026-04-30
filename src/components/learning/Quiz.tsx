'use client';

import type {
  QuizQuestion,
  QuizState,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  MultiSelectQuestion,
  MatchingQuestion,
} from '@/lib/types';

// ─── Matching shuffle helpers ─────────────────────────────────────────────────

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

// ─── Correctness helper ───────────────────────────────────────────────────────

function isCorrect(q: QuizQuestion, qIdx: number, state: QuizState): boolean {
  const type = q.type ?? 'multiple-choice';
  if (type === 'multiple-choice') {
    const mc = q as MultipleChoiceQuestion;
    return state.answers[qIdx] === mc.answer;
  }
  if (type === 'true-false') {
    const tf = q as TrueFalseQuestion;
    // 0 = True, 1 = False in answers map
    return (state.answers[qIdx] === 0) === tf.answer;
  }
  if (type === 'multi-select') {
    const ms = q as MultiSelectQuestion;
    const selected = [...(state.multiSelectAnswers[qIdx] ?? [])].sort((a, b) => a - b);
    const correct = [...ms.answers].sort((a, b) => a - b);
    return selected.length === correct.length && selected.every((v, i) => v === correct[i]);
  }
  if (type === 'matching') {
    const mt = q as MatchingQuestion;
    const seed = hashSeed(mt.question);
    const shuffledRight = seededShuffle(mt.pairs.map((p, i) => i), seed);
    // shuffledRight[i] = original index of the right item shown at position i
    // correctMapping[i] = which shuffled position corresponds to pair i
    const correctMapping = mt.pairs.map((_, origIdx) => shuffledRight.indexOf(origIdx));
    const mapping = state.matchingAnswers[qIdx];
    if (!mapping || mapping.length !== mt.pairs.length) return false;
    return mt.pairs.every((_, i) => mapping[i] === correctMapping[i]);
  }
  return false;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  questions: QuizQuestion[];
  lessonId: string;
  quizState: QuizState;
  onSaveAnswer: (qIndex: number, answer: number) => void;
  onSaveMultiSelectAnswer: (qIndex: number, selected: number[]) => void;
  onSaveMatchingAnswer: (qIndex: number, mapping: number[]) => void;
  onSubmitAnswer: (qIndex: number) => void;
  onResetQuiz: () => void;
}

// ─── Quiz component ───────────────────────────────────────────────────────────

export default function Quiz({
  questions,
  lessonId,
  quizState,
  onSaveAnswer,
  onSaveMultiSelectAnswer,
  onSaveMatchingAnswer,
  onSubmitAnswer,
  onResetQuiz,
}: Props) {
  if (!questions || questions.length === 0) return null;

  const { answers, multiSelectAnswers = {}, matchingAnswers = {}, submitted } = quizState;

  const hasNoAnswers =
    Object.keys(answers).length === 0 &&
    Object.keys(multiSelectAnswers).length === 0 &&
    Object.keys(matchingAnswers).length === 0;

  const allSubmitted = questions.every((_, i) => submitted[i]);
  const correctCount = questions.filter((q, i) => submitted[i] && isCorrect(q, i, quizState)).length;

  return (
    <section aria-label="Lesson Quiz" className="mt-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span aria-hidden>📝</span> Knowledge Check
        </h2>
        <button
          onClick={onResetQuiz}
          disabled={hasNoAnswers}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↺ Reset Quiz
        </button>
      </div>

      {allSubmitted && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            correctCount === questions.length
              ? 'bg-green-50 border border-green-300 text-green-800'
              : 'bg-blue-50 border border-blue-300 text-blue-800'
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="text-2xl" aria-hidden>
            {correctCount === questions.length ? '🎉' : '📊'}
          </span>
          <div>
            <p className="font-semibold">Score: {correctCount}/{questions.length}</p>
            <p className="text-sm">
              {correctCount === questions.length
                ? 'Perfect score! Ready to move on.'
                : 'Review the explanations below and try again.'}
            </p>
          </div>
        </div>
      )}

      {questions.map((q, qIdx) => {
        const isSubmitted = !!submitted[qIdx];
        const correct = isSubmitted && isCorrect(q, qIdx, quizState);
        const type = q.type ?? 'multiple-choice';

        return (
          <div key={qIdx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="font-semibold text-gray-800 mb-4" id={`q-${lessonId}-${qIdx}-label`}>
              <span className="text-gray-400 mr-2 text-sm">{qIdx + 1}.</span>
              {q.question}
              {type === 'multi-select' && (
                <span className="ml-2 text-xs font-normal text-gray-500">(Select all that apply)</span>
              )}
            </p>

            {(type === 'multiple-choice' || type === 'true-false') && (
              <MultipleChoiceRenderer
                q={q as MultipleChoiceQuestion | TrueFalseQuestion}
                qIdx={qIdx}
                lessonId={lessonId}
                isSubmitted={isSubmitted}
                selected={answers[qIdx]}
                onSaveAnswer={onSaveAnswer}
              />
            )}

            {type === 'multi-select' && (
              <MultiSelectRenderer
                q={q as MultiSelectQuestion}
                qIdx={qIdx}
                isSubmitted={isSubmitted}
                selected={multiSelectAnswers[qIdx] ?? []}
                onSaveMultiSelectAnswer={onSaveMultiSelectAnswer}
              />
            )}

            {type === 'matching' && (
              <MatchingRenderer
                q={q as MatchingQuestion}
                qIdx={qIdx}
                isSubmitted={isSubmitted}
                mapping={matchingAnswers[qIdx]}
                onSaveMatchingAnswer={onSaveMatchingAnswer}
              />
            )}

            {!isSubmitted && (
              <CheckAnswerButton
                qIdx={qIdx}
                type={type}
                answers={answers}
                multiSelectAnswers={multiSelectAnswers}
                matchingAnswers={matchingAnswers}
                pairsLength={type === 'matching' ? (q as MatchingQuestion).pairs.length : 0}
                onSubmitAnswer={onSubmitAnswer}
              />
            )}

            {isSubmitted && q.explanation && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  correct
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
                role="note"
                aria-label="Explanation"
              >
                <span className="font-semibold mr-1">{correct ? '✓ Correct!' : '→ Explanation:'}</span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function MultipleChoiceRenderer({
  q,
  qIdx,
  lessonId,
  isSubmitted,
  selected,
  onSaveAnswer,
}: {
  q: MultipleChoiceQuestion | TrueFalseQuestion;
  qIdx: number;
  lessonId: string;
  isSubmitted: boolean;
  selected: number | undefined;
  onSaveAnswer: (qIdx: number, answer: number) => void;
}) {
  const options =
    q.type === 'true-false' ? ['True', 'False'] : (q as MultipleChoiceQuestion).options;

  // For true-false: correct answer index is 0 if answer===true, 1 if false
  const correctIdx =
    q.type === 'true-false'
      ? (q as TrueFalseQuestion).answer ? 0 : 1
      : (q as MultipleChoiceQuestion).answer;

  return (
    <div
      role="radiogroup"
      aria-labelledby={`q-${lessonId}-${qIdx}-label`}
      className="space-y-2"
      onKeyDown={e => {
        if (isSubmitted) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = ((selected ?? -1) + 1) % options.length;
          onSaveAnswer(qIdx, next);
          (e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = ((selected ?? 0) - 1 + options.length) % options.length;
          onSaveAnswer(qIdx, prev);
          (e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[prev])?.focus();
        }
      }}
    >
      {options.map((option, optIdx) => {
        const isSelected = selected === optIdx;
        const isAnswer = correctIdx === optIdx;

        let optionClass =
          'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ';

        if (!isSubmitted) {
          optionClass += isSelected
            ? 'border-green-500 bg-green-50 text-green-800 font-medium focus:ring-green-500'
            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 focus:ring-gray-400';
        } else {
          if (isAnswer) {
            optionClass += 'border-green-500 bg-green-50 text-green-800 font-medium';
          } else if (isSelected && !isAnswer) {
            optionClass += 'border-red-400 bg-red-50 text-red-700';
          } else {
            optionClass += 'border-gray-200 text-gray-500';
          }
        }

        return (
          <button
            key={optIdx}
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isSubmitted}
            tabIndex={isSelected || (!isSubmitted && optIdx === 0) ? 0 : -1}
            className={optionClass}
            onClick={() => {
              if (isSubmitted) return;
              onSaveAnswer(qIdx, optIdx);
            }}
            onKeyDown={e => {
              if (isSubmitted) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSaveAnswer(qIdx, optIdx);
              }
            }}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                  isSelected
                    ? isSubmitted
                      ? isAnswer
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-red-400 bg-red-400 text-white'
                      : 'border-green-500 bg-green-500 text-white'
                    : isSubmitted && isAnswer
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300'
                }`}
                aria-hidden
              >
                {isSubmitted && isAnswer ? '✓' : isSubmitted && isSelected ? '✗' : ''}
              </span>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectRenderer({
  q,
  qIdx,
  isSubmitted,
  selected,
  onSaveMultiSelectAnswer,
}: {
  q: MultiSelectQuestion;
  qIdx: number;
  isSubmitted: boolean;
  selected: number[];
  onSaveMultiSelectAnswer: (qIdx: number, selected: number[]) => void;
}) {
  return (
    <div className="space-y-2">
      {q.options.map((option, optIdx) => {
        const isChecked = selected.includes(optIdx);
        const isCorrectOption = q.answers.includes(optIdx);

        let optionClass =
          'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-3 ';

        if (!isSubmitted) {
          optionClass += isChecked
            ? 'border-violet-500 bg-violet-50 text-violet-800 font-medium focus:ring-violet-500'
            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 focus:ring-gray-400';
        } else {
          if (isCorrectOption && isChecked) {
            optionClass += 'border-green-500 bg-green-50 text-green-800 font-medium';
          } else if (isCorrectOption && !isChecked) {
            optionClass += 'border-green-400 bg-green-50 text-green-700';
          } else if (!isCorrectOption && isChecked) {
            optionClass += 'border-red-400 bg-red-50 text-red-700';
          } else {
            optionClass += 'border-gray-200 text-gray-500';
          }
        }

        return (
          <button
            key={optIdx}
            role="checkbox"
            aria-checked={isChecked}
            aria-disabled={isSubmitted}
            className={optionClass}
            onClick={() => {
              if (isSubmitted) return;
              const next = isChecked
                ? selected.filter(i => i !== optIdx)
                : [...selected, optIdx];
              onSaveMultiSelectAnswer(qIdx, next);
            }}
          >
            <span
              className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                isChecked
                  ? isSubmitted
                    ? isCorrectOption
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-red-400 bg-red-400 text-white'
                    : 'border-violet-500 bg-violet-500 text-white'
                  : isSubmitted && isCorrectOption
                  ? 'border-green-400 bg-green-100'
                  : 'border-gray-300'
              }`}
              aria-hidden
            >
              {isChecked && isSubmitted && isCorrectOption ? '✓' : ''}
              {isChecked && isSubmitted && !isCorrectOption ? '✗' : ''}
              {isChecked && !isSubmitted ? '✓' : ''}
              {!isChecked && isSubmitted && isCorrectOption ? '○' : ''}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MatchingRenderer({
  q,
  qIdx,
  isSubmitted,
  mapping,
  onSaveMatchingAnswer,
}: {
  q: MatchingQuestion;
  qIdx: number;
  isSubmitted: boolean;
  mapping: number[] | undefined;
  onSaveMatchingAnswer: (qIdx: number, mapping: number[]) => void;
}) {
  const seed = hashSeed(q.question);
  // shuffledRight[displayPosition] = original pair index
  const shuffledOriginalIndices = seededShuffle(q.pairs.map((_, i) => i), seed);
  // correctMapping[pairIndex] = which display position is correct for that pair
  const correctMapping = q.pairs.map((_, origIdx) => shuffledOriginalIndices.indexOf(origIdx));

  const currentMapping = mapping ?? new Array(q.pairs.length).fill(-1);

  function handleSelect(pairIdx: number, displayPosition: number) {
    if (isSubmitted) return;
    const next = [...currentMapping];
    next[pairIdx] = displayPosition;
    onSaveMatchingAnswer(qIdx, next);
  }

  return (
    <div className="space-y-3">
      {/* Right-side labels displayed as reference */}
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pb-1">Item</div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pb-1">Match</div>

        {q.pairs.map((pair, pairIdx) => {
          const selectedDisplayPos = currentMapping[pairIdx];
          const selectedOrigIdx = selectedDisplayPos >= 0 ? shuffledOriginalIndices[selectedDisplayPos] : -1;
          const isCorrectSelection = isSubmitted && selectedDisplayPos === correctMapping[pairIdx];

          return (
            <>
              {/* Left item */}
              <div
                key={`left-${pairIdx}`}
                className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 flex items-center"
              >
                {pair.left}
              </div>

              {/* Right dropdown */}
              <div key={`right-${pairIdx}`} className="relative">
                <select
                  disabled={isSubmitted}
                  value={selectedDisplayPos >= 0 ? selectedDisplayPos : ''}
                  onChange={e => handleSelect(pairIdx, Number(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed ${
                    !isSubmitted
                      ? selectedDisplayPos >= 0
                        ? 'border-violet-400 bg-violet-50 text-violet-800 focus:ring-violet-500'
                        : 'border-gray-300 bg-white text-gray-500 focus:ring-gray-400'
                      : isCorrectSelection
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-red-400 bg-red-50 text-red-700'
                  }`}
                >
                  <option value="" disabled>— Select —</option>
                  {shuffledOriginalIndices.map((origIdx, displayPos) => (
                    <option key={displayPos} value={displayPos}>
                      {q.pairs[origIdx].right}
                    </option>
                  ))}
                </select>
                {isSubmitted && (
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                    {isCorrectSelection ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </>
          );
        })}
      </div>

      {/* Show correct answers after wrong submission */}
      {isSubmitted && !isCorrect(q, qIdx, { answers: {}, multiSelectAnswers: {}, matchingAnswers: { [qIdx]: currentMapping }, submitted: { [qIdx]: true } }) && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Correct matches:</p>
          {q.pairs.map((pair, i) => (
            <p key={i}><span className="font-medium">{pair.left}</span> → {pair.right}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckAnswerButton({
  qIdx,
  type,
  answers,
  multiSelectAnswers,
  matchingAnswers,
  pairsLength,
  onSubmitAnswer,
}: {
  qIdx: number;
  type: string;
  answers: Record<number, number>;
  multiSelectAnswers: Record<number, number[]>;
  matchingAnswers: Record<number, number[]>;
  pairsLength: number;
  onSubmitAnswer: (qIdx: number) => void;
}) {
  let disabled = false;
  if (type === 'multiple-choice' || type === 'true-false') {
    disabled = answers[qIdx] === undefined;
  } else if (type === 'multi-select') {
    disabled = !multiSelectAnswers[qIdx] || multiSelectAnswers[qIdx].length === 0;
  } else if (type === 'matching') {
    const mapping = matchingAnswers[qIdx];
    disabled = !mapping || mapping.length !== pairsLength || mapping.some(v => v < 0);
  }

  return (
    <button
      className="mt-4 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      disabled={disabled}
      onClick={() => onSubmitAnswer(qIdx)}
    >
      Check Answer
    </button>
  );
}
