'use client';

import { useState, useId } from 'react';

interface Props {
  /** The problem statement shown to the learner. */
  question: string;
  /** The correct numeric answer. */
  answer: number;
  /**
   * Acceptable absolute tolerance around `answer`.
   * Defaults to 0 (exact match).
   */
  tolerance?: number;
  /** Optional unit label displayed after the input (e.g. "tCO₂e"). */
  unit?: string;
  /**
   * Progressive hints revealed one at a time.
   * Each "Check" click with a wrong answer reveals the next hint.
   */
  hints?: string[];
  /**
   * Solution explanation shown once the learner submits the correct answer
   * or after all hints are exhausted.
   */
  solution?: string;
}

type Status = 'idle' | 'correct' | 'wrong' | 'revealed';

export default function CalculationExercise({
  question,
  answer,
  tolerance = 0,
  unit,
  hints = [],
  solution,
}: Props) {
  const inputId = useId();
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [hintsShown, setHintsShown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = (raw: string) => {
    const parsed = parseFloat(raw.replace(/,/g, '').trim());
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - answer) <= tolerance;
  };

  function handleCheck() {
    if (status === 'correct' || status === 'revealed') return;

    if (isCorrect(inputValue)) {
      setStatus('correct');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= hints.length + 1) {
      // No more hints — reveal the answer
      setStatus('revealed');
    } else {
      setStatus('wrong');
      setHintsShown(Math.min(newAttempts, hints.length));
    }
  }

  function handleReveal() {
    setStatus('revealed');
  }

  function handleReset() {
    setInputValue('');
    setStatus('idle');
    setHintsShown(0);
    setAttempts(0);
  }

  const solved = status === 'correct' || status === 'revealed';

  return (
    <div
      className="border border-violet-200 bg-violet-50 rounded-lg p-5 my-6"
      role="group"
      aria-label="Calculation exercise"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-violet-700 text-lg" aria-hidden>🧮</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Practice Calculation
        </span>
      </div>

      {/* Question */}
      <p className="text-gray-800 font-medium mb-4 leading-relaxed">{question}</p>

      {/* Input row */}
      {!solved && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label htmlFor={inputId} className="sr-only">
            Your answer
          </label>
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (status === 'wrong') setStatus('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Enter your answer"
              className={`w-full sm:w-44 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                status === 'wrong'
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              aria-describedby={status === 'wrong' ? 'calc-feedback' : undefined}
            />
            {unit && (
              <span className="text-sm text-gray-600 whitespace-nowrap">{unit}</span>
            )}
          </div>

          <button
            onClick={handleCheck}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            Check
          </button>

          {hints.length > 0 && hintsShown < hints.length && attempts > 0 && (
            <button
              onClick={handleReveal}
              className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
            >
              Show answer
            </button>
          )}
        </div>
      )}

      {/* Wrong answer feedback */}
      {status === 'wrong' && (
        <p id="calc-feedback" className="text-red-600 text-sm mb-3" role="alert">
          Not quite — try again.
        </p>
      )}

      {/* Progressive hints */}
      {hintsShown > 0 && hints.slice(0, hintsShown).map((hint, i) => (
        <div
          key={i}
          className="flex gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-2"
          role="note"
          aria-label={`Hint ${i + 1}`}
        >
          <span aria-hidden className="shrink-0">💡</span>
          <span>{hint}</span>
        </div>
      ))}

      {/* Correct answer */}
      {status === 'correct' && (
        <div
          className="flex items-start gap-2 text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-3 mb-3"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden className="shrink-0 text-lg">✅</span>
          <div>
            <p className="font-semibold">Correct!</p>
            {solution && <p className="text-sm mt-1 text-green-700">{solution}</p>}
          </div>
        </div>
      )}

      {/* Revealed answer */}
      {status === 'revealed' && (
        <div
          className="flex items-start gap-2 text-gray-800 bg-gray-100 border border-gray-300 rounded-md px-3 py-3 mb-3"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden className="shrink-0 text-lg">📖</span>
          <div>
            <p className="font-semibold">
              Answer:{' '}
              <span className="font-mono">
                {answer}
                {unit ? ` ${unit}` : ''}
              </span>
            </p>
            {solution && <p className="text-sm mt-1 text-gray-600">{solution}</p>}
          </div>
        </div>
      )}

      {/* Try again */}
      {solved && (
        <button
          onClick={handleReset}
          className="text-xs text-violet-600 underline hover:text-violet-800 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
