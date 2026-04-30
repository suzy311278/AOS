# IFRS S2 Editorial Rewrite: Implementation Plan

## Objective
Transform all 32 IFRS S2 lessons from their current dense, academic style into highly engaging, accessible, and easy-to-understand content while preserving technical accuracy.

## Current State Assessment
- **32 lessons** across 9 modules
- **429 em/en-dash violations** across all files (must be eliminated)
- Content quality varies: some lessons already use components well, others are wall-of-text
- Good technical accuracy but overly formal in places
- Component usage is inconsistent (some lessons lack AnalogyBox, DeepDive, or ExampleBox)

## Editorial Strategy

### Voice and Tone
- Conversational but authoritative ("think of it this way" not "one might consider")
- Second person where natural ("you must disclose" not "an entity shall disclose")
- Short paragraphs (3-4 sentences max)
- Lead with the "so what" before the technical detail

### Structural Approach
- Every lesson opens with a HighlightBox summarizing the key takeaway
- Dense paragraphs broken into bullet points or numbered lists
- Technical definitions moved into HighlightBox or DeepDive components
- Real-world examples added via ExampleBox where absent
- Complex regulatory logic explained via AnalogyBox
- Supplementary/advanced detail housed in DeepDive (collapsible)
- Each lesson ends with a HighlightBox key takeaway

### Strict Formatting Rules
1. **Zero em-dashes or en-dashes** (replace with commas, colons, parentheses, or restructured sentences)
2. **Zero horizontal rules** (no ---, ***, or ___)
3. **No decorative symbols** for transitions
4. **Preserve all existing source comments** ({/* source: ... */})
5. **Preserve all existing tables** (ResponsiveTable) but clean up if needed
6. **Preserve all existing FormulaBox content** precisely

## Execution Order
Process module by module, sequentially from Module 0 through Module 8.
Within each module, process lessons in order (0.1, 0.2, 0.3, 0.4, then 1.1, etc.).

## Quality Checks Per Lesson
- [ ] No em-dashes or en-dashes remain
- [ ] No horizontal rules remain
- [ ] At least one HighlightBox present
- [ ] At least one ExampleBox or AnalogyBox present
- [ ] Dense paragraphs converted to bullet/numbered lists
- [ ] Source comment preserved
- [ ] Technical accuracy preserved
