/**
 * Prompt Library — types shared between loader, pages, and client UI.
 */

export interface PromptVariable {
  /** Key used in the `{placeholder}` substitution inside the prompt body. */
  key: string;
  /** Human-readable label for the form field. */
  label: string;
  /** Hint text shown inside the input. */
  placeholder: string;
  /** `textarea` renders a multi-line input; anything else is a single line. */
  type?: 'text' | 'textarea';
  /** If true, the filled-prompt copy button disables until it is non-empty. */
  required?: boolean;
}

export interface Prompt {
  id: string;
  slug: string;
  title: string;
  /** Framework the prompt targets (CDP, DJSI, BRSR, etc.). Free text. */
  framework: string;
  /** Coarse grouping: 'reporting', 'disclosure', 'review', etc. */
  category: string;
  /** One-line hook for list cards. Plain text. */
  short_description: string;
  /** Paragraph or two explaining what this prompt does and when to use it. */
  description: string;
  /** Fields the user fills in before the prompt is copied. Empty for prompts
   *  without variables (pure copy-as-is). */
  variables: PromptVariable[];
  /** The full prompt text with `{variable_key}` placeholders. */
  prompt: string;
  /** Optional tail notes (usage tips, when to prefer another prompt, etc.). */
  notes?: string;
}
