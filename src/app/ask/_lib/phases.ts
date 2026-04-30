import type { Phase } from './pipeline-types';

export const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  intent: 'Classifying intent',
  plan: 'Planning research',
  retrieval: 'Retrieving evidence',
  synthesis: 'Drafting answer',
  factcheck: 'Fact-checking against sources',
  revise: 'Revising to remove unsupported claims',
  done: 'Done',
};

export const PHASE_ORDER: Phase[] = [
  'intent',
  'plan',
  'retrieval',
  'synthesis',
  'factcheck',
  'revise',
];

export function isLoadingPhase(phase: Phase): boolean {
  return phase !== 'idle' && phase !== 'done';
}
