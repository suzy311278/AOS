'use client';

import { useState, useCallback } from 'react';

interface Step {
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

interface Props {
  title: string;
  scenario: string;
  /** Pipe-delimited steps separated by ;;
   *  Format: "question | optionA | optionB | optionC | correctIndex | feedback" */
  steps: string;
  summary?: string;
}

function parseSteps(raw: string): Step[] {
  return raw.split(';;').map(s => {
    const parts = s.trim().split('|').map(p => p.trim());
    const question = parts[0];
    const options = parts.slice(1, -2);
    const correctIndex = parseInt(parts[parts.length - 2], 10);
    const feedback = parts[parts.length - 1];
    return { question, options, correctIndex, feedback };
  });
}

export default function CaseStudy({ title, scenario, steps: stepsRaw, summary }: Props) {
  const steps = parseSteps(stepsRaw);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const allDone = Object.keys(submitted).length === steps.length;
  const correctCount = steps.filter(
    (s, i) => submitted[i] && answers[i] === s.correctIndex
  ).length;

  const handleSelect = useCallback((stepIdx: number, optIdx: number) => {
    if (submitted[stepIdx]) return;
    setAnswers(prev => ({ ...prev, [stepIdx]: optIdx }));
  }, [submitted]);

  const handleSubmit = useCallback((stepIdx: number) => {
    setSubmitted(prev => ({ ...prev, [stepIdx]: true }));
    if (stepIdx < steps.length - 1) {
      // Auto-advance after a short delay
      setTimeout(() => setCurrentStep(stepIdx + 1), 600);
    }
  }, [steps.length]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setSubmitted({});
  }, []);

  return (
    <div className="my-8 border-2 border-teal-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-teal-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg" aria-hidden>🔍</span>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Case Study</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      {/* Scenario */}
      <div className="px-6 py-4 bg-teal-50/40 border-b border-teal-100">
        <p className="text-sm text-gray-700 leading-relaxed">{scenario}</p>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 space-y-6">
        {steps.map((step, idx) => {
          if (idx > currentStep) return null;
          const isSubmitted = !!submitted[idx];
          const selectedOpt = answers[idx];
          const isCorrect = selectedOpt === step.correctIndex;

          return (
            <div key={idx} role="group" aria-label={`Step ${idx + 1}`}>
              <p className="text-xs font-semibold text-teal-600 mb-2">
                Step {idx + 1} of {steps.length}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-3">{step.question}</p>

              <div className="space-y-2 mb-3">
                {step.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const showCorrect = isSubmitted && optIdx === step.correctIndex;
                  const showWrong = isSubmitted && isSelected && !isCorrect;

                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        showCorrect
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : showWrong
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : isSelected
                          ? 'border-teal-400 bg-teal-50 text-teal-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      } ${isSubmitted ? 'pointer-events-none' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`case-study-step-${idx}`}
                        checked={isSelected}
                        onChange={() => handleSelect(idx, optIdx)}
                        disabled={isSubmitted}
                        className="accent-teal-600"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>

              {!isSubmitted && selectedOpt !== undefined && (
                <button
                  onClick={() => handleSubmit(idx)}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  Submit
                </button>
              )}

              {isSubmitted && (
                <div
                  className={`mt-3 px-4 py-3 rounded-lg text-sm ${
                    isCorrect
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}
                  aria-live="polite"
                >
                  <span className="font-semibold">
                    {isCorrect ? 'Correct!' : 'Not quite.'}
                  </span>{' '}
                  {step.feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary + Score */}
      {allDone && (
        <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Score: {correctCount}/{steps.length} correct
              </p>
              {summary && (
                <p className="text-sm text-gray-600 mt-1">{summary}</p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
