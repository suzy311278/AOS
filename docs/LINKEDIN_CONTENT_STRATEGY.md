# LinkedIn Content Strategy for Sustainability Academy

## Overview

This guide covers the end-to-end LinkedIn content strategy for promoting Sustainability Academy. The platform has deep, technical sustainability courses (climate science, carbon markets, ESG, EU Taxonomy, biodiversity, circular economy) with interactive quizzes, calculation exercises, audio lessons, a 190+ term glossary, and a jobs directory. All of this existing content becomes the raw material for a LinkedIn content engine.

The goal: extract structured content from the LearningPlatform codebase, format it into LinkedIn-ready posts, and feed it into the existing auto-posting setup for a company page.

## Account Setup

### Company Page (Not Personal)

All LinkedIn content posts from a **Company Page** (e.g., "Sustainability Academy"), not a personal profile. Reasons:

- Avoids tying the brand to a single personality
- Allows diverse content without personal brand conflict
- Builds standalone brand equity
- Multiple admins can manage it without public attribution
- Ads and analytics become available later

### Privacy and Separation

LinkedIn does **not** publicly display who administers a company page. The admin list is visible only to other admins of the same page. To maintain clean separation between any personal profile and the company page:

- Do not add "Sustainability Academy" as a work experience entry on any personal profile
- Do not like or comment on company page posts from a personal account
- When the page is new, invite a few contacts to follow it so the follower list is not a single person
- Use the API or scheduling tool for all posting (never log into the company page manually from a browser tied to a personal session)

Posts from the company page show as "Sustainability Academy posted this," with no personal attribution.

### API Safety

Using the LinkedIn API to post on both a personal profile and a company page from the same developer app is normal and intended. These are separate entities in LinkedIn's system (different URN types: `urn:li:person` vs `urn:li:organization`). LinkedIn will not restrict or ban an account for this.

What LinkedIn does penalize:
- More than 2-3 posts per day on a single entity (algorithmic throttling, not a ban)
- Identical content cross-posted between personal and company page
- Bulk connection requests or DM automation
- Browser-scraping tools (Phantombuster, etc.), not the official API

The official API rate limit is roughly 100 posts per day per app, far above any reasonable posting cadence.

## Content Sources in the Codebase

All content lives under `src/content/` in the LearningPlatform repo. Here is what can be extracted and how it maps to LinkedIn post types.

### 1. Glossary Terms (190+ terms)

**Source file:** `src/content/glossary.yaml`

Each term has a name and definition. These become "Term of the Day" posts.

**Extraction:** Parse the YAML file, pull each term/definition pair.

**Post volume:** 190+ posts (nearly 9 months of weekday content from this source alone).

### 2. HighlightBoxes (Key Takeaways)

**Source files:** `src/content/*/lessons/*.mdx`

Every `<HighlightBox>` in the MDX content contains a key takeaway from a lesson. These are already written as concise, standalone insights.

**Extraction:** Regex or AST parse each MDX file for content between `<HighlightBox>` and `</HighlightBox>` tags.

**Post type:** "Did you know" or "Key insight" posts.

### 3. AnalogyBoxes (Real-World Analogies)

**Source files:** `src/content/*/lessons/*.mdx`

Every `<AnalogyBox>` contains a real-world analogy that makes a technical concept accessible. These are inherently shareable because they simplify complex ideas.

**Extraction:** Same approach as HighlightBoxes, targeting `<AnalogyBox>` tags.

**Post type:** "Think of it this way" posts. Strong engagement drivers because they invite agreement or debate.

### 4. Quiz Questions (Polls and Engagement Posts)

**Source files:** `src/content/*/quizzes/*.yaml`

Each YAML file contains questions with multiple-choice options, correct answers, and optional explanations.

**Extraction:** Parse YAML, pull question + options + explanation.

**Post type:** LinkedIn polls or "Can you answer this?" text posts. High engagement because people love testing their knowledge.

### 5. CalculationExercises (Challenge Posts)

**Source files:** `src/content/*/lessons/*.mdx`

`<CalculationExercise>` components have a `question`, `answer`, `unit`, `hints`, and `solution` prop.

**Extraction:** Parse MDX for CalculationExercise components and extract props.

**Post type:** "Sustainability math challenge" posts. Post the question, reveal the answer in a follow-up comment after 24 hours.

### 6. FormulaBoxes (Formula Spotlight)

**Source files:** `src/content/*/lessons/*.mdx`

`<FormulaBox>` components contain key equations used in carbon accounting, ESG metrics, etc.

**Extraction:** Parse MDX for FormulaBox content.

**Post type:** "Formula of the week" posts. Explain what each variable means and why the formula matters.

### 7. Course and Lesson Metadata

**Source files:** `src/content/*/course.yaml`

Each course has a title, description, module list, and lesson titles with durations.

**Extraction:** Parse YAML.

**Post type:** Course announcement posts, "What you'll learn" breakdowns, module-level previews.

## Content Extraction Script

Build a script (in TypeScript, to stay consistent with the codebase) that:

1. Walks all directories under `src/content/`
2. Parses `glossary.yaml` for glossary terms
3. Parses each `course.yaml` for course/module/lesson metadata
4. Parses each MDX file and extracts:
   - HighlightBox content
   - AnalogyBox content
   - FormulaBox content
   - CalculationExercise props (question, answer, unit, hints, solution)
5. Parses each quiz YAML file for questions, options, answers, explanations
6. Formats each extracted item into a LinkedIn post using the templates below
7. Outputs a JSON or CSV file with columns: `post_type`, `content`, `hashtags`, `link`, `course_id`, `lesson_id`

This output file is what gets fed into the existing auto-posting setup.

### Extraction Patterns

For MDX component extraction, use these regex patterns:

```
HighlightBox:         <HighlightBox>([\s\S]*?)<\/HighlightBox>
AnalogyBox:           <AnalogyBox>([\s\S]*?)<\/AnalogyBox>
FormulaBox:           <FormulaBox>([\s\S]*?)<\/FormulaBox>
ExampleBox:           <ExampleBox>([\s\S]*?)<\/ExampleBox>
CalculationExercise:  <CalculationExercise\s+([\s\S]*?)\/>
```

For CalculationExercise, parse the JSX props (question, answer, unit, hints, solution) from the matched attribute string.

### Output Schema

```json
{
  "posts": [
    {
      "id": "glossary-carbon-intensity",
      "type": "glossary",
      "course_id": null,
      "lesson_id": null,
      "content": "formatted post text here",
      "hashtags": ["#Sustainability", "#CarbonAccounting", "#ESG"],
      "link": "https://sustainabilityacademy.co/glossary#term-carbon-intensity",
      "image_suggestion": null
    },
    {
      "id": "highlight-vm0042-3.1-001",
      "type": "highlight",
      "course_id": "vm0042",
      "lesson_id": "3.1",
      "content": "formatted post text here",
      "hashtags": ["#CarbonCredits", "#VM0042", "#ClimateAction"],
      "link": "https://sustainabilityacademy.co/courses/vm0042/3_1",
      "image_suggestion": "Create a carousel from this lesson's key points"
    }
  ]
}
```

## Post Templates

Each content type maps to a specific LinkedIn post template. The templates are designed for the LinkedIn algorithm: front-loaded hooks, line breaks for readability, a call to action, and hashtags.

### Template 1: Glossary Term of the Day

```
{term_name}

{definition}

Why it matters for sustainability professionals:
{one-sentence practical context}

Deepen your understanding for free:
{lesson_link}

#Sustainability #ESG #ClimateAction #{topic_specific_tag}
```

**Example:**

```
Carbon Intensity

Carbon Intensity = Total GHG Emissions (tCO2e) / Revenue ($ million)

Why it matters for sustainability professionals:
It lets you compare companies of wildly different sizes
on an apples-to-apples basis, which is why investors and
rating agencies rely on it over absolute emissions.

Deepen your understanding for free:
https://sustainabilityacademy.co/courses/esg-benchmarking/2_3

#Sustainability #ESG #CarbonAccounting #GHGProtocol
```

### Template 2: Key Insight (from HighlightBox)

```
{hook_sentence}

{highlight_content}

This is from our free course on {course_title}.
Full lesson: {lesson_link}

#Sustainability #{topic_tag_1} #{topic_tag_2}
```

**Example:**

```
Most companies are ignoring 70-90% of their carbon footprint.

Scope 3 emissions (indirect value chain emissions) typically
dwarf Scope 1 and 2 combined, yet the majority of corporate
climate disclosures either omit them entirely or report only
a handful of the 15 categories.

This is from our free course on GHG Protocol and Scope 3 Accounting.
Full lesson: https://sustainabilityacademy.co/courses/ghg-scope-3/2_1

#Sustainability #Scope3 #GHGProtocol #CarbonAccounting
```

### Template 3: Analogy (from AnalogyBox)

```
Here's a simple way to think about {concept}:

{analogy_content}

Sometimes the best way to understand complex sustainability
concepts is through everyday comparisons.

Explore the full lesson: {lesson_link}

#Sustainability #{topic_tag}
```

### Template 4: Quiz / Poll

```
Test your sustainability knowledge:

{question}

A) {option_1}
B) {option_2}
C) {option_3}
D) {option_4}

Drop your answer in the comments.
The correct answer (with explanation) goes up tomorrow.

#Sustainability #Quiz #{topic_tag}
```

**Follow-up comment (post next day):**

```
The answer is {correct_letter}) {correct_option}.

{explanation}

Learn more in our free {course_title} course:
{lesson_link}
```

### Template 5: Calculation Challenge

```
Sustainability math challenge:

{question}

{hints[0] if available, framed as a clue}

Take your best shot in the comments.
Solution drops in 24 hours.

#Sustainability #{topic_tag} #CarbonAccounting
```

**Follow-up comment:**

```
Solution: {answer} {unit}

{solution_explanation}

Practice more with our interactive exercises:
{lesson_link}
```

### Template 6: Formula Spotlight

```
One formula every sustainability professional should know:

{formula_content}

What each part means:
- {variable_1}: {explanation}
- {variable_2}: {explanation}

This is used in {practical_context}.

Full breakdown in our free course:
{lesson_link}

#Sustainability #{topic_tag}
```

### Template 7: Course Announcement

```
New free course: {course_title}

{course_description}

What's inside:
- {module_count} modules, {lesson_count} lessons
- Interactive quizzes after every lesson
- Audio narration for learning on the go
- Calculation exercises with step-by-step solutions

Completely free. Start here: {course_link}

#Sustainability #{category_tag} #FreeLearning
```

### Template 8: Resource List (Organic Reach Play)

```
{N} free resources for learning {topic}:

1. {External resource 1} - {one-line description}
2. {External resource 2} - {one-line description}
3. {External resource 3} - {one-line description}
...
{N}. Sustainability Academy's {course_title} - {one-line description}
   {course_link}

Save this for later.

#Sustainability #{topic_tag} #FreeResources
```

This template positions the platform alongside established resources (GHG Protocol guides, IPCC summaries, UN documents). It looks generous rather than promotional, and people save and share resource lists heavily on LinkedIn.

## Posting Strategy

### Cadence

- **5 posts per week** (Monday through Friday), one post per day
- This is the sweet spot for company pages: consistent enough for algorithmic favor, not so frequent that it looks spammy

### Weekly Content Mix

| Day | Post Type | Source |
|-----|-----------|--------|
| Monday | Glossary Term | glossary.yaml |
| Tuesday | Key Insight or Analogy | HighlightBox / AnalogyBox from MDX |
| Wednesday | Quiz or Poll | Quiz YAML |
| Thursday | Formula or Calculation Challenge | FormulaBox / CalculationExercise from MDX |
| Friday | Course Announcement or Resource List | course.yaml / curated |

This rotation ensures variety in format and keeps the audience engaged with different interaction types throughout the week.

### Hashtag Strategy

**Always include:** `#Sustainability`

**Rotate based on topic:**

| Course Topic | Hashtags |
|-------------|----------|
| Climate Science | #ClimateChange #ClimateScience #GlobalWarming |
| Carbon Markets | #CarbonCredits #CarbonMarkets #VoluntaryCarbon |
| GHG Accounting | #GHGProtocol #CarbonAccounting #Scope3 |
| ESG | #ESG #ESGReporting #ResponsibleInvesting |
| EU Taxonomy | #EUTaxonomy #SustainableFinance #GreenDeal |
| Biodiversity | #Biodiversity #NatureLoss #TNFD |
| Circular Economy | #CircularEconomy #ZeroWaste |
| Clean Energy | #CleanEnergy #RenewableEnergy #EnergyTransition |

**Limit to 3-5 hashtags per post.** More than that reduces reach on LinkedIn.

### Engagement Tactics

**Reply to every comment within the first 2 hours.** LinkedIn's algorithm heavily weights early engagement. If someone comments on a quiz post with their answer, reply with encouragement or a follow-up question. This can be partially automated with templated responses, but genuine replies perform better.

**Post timing:** Between 7:00-9:00 AM in the target audience's timezone (sustainability professionals tend to check LinkedIn during morning commutes and at the start of the workday). For a global audience, 8:00 AM GMT is a reasonable default.

**Hook format:** The first 2-3 lines of a LinkedIn post are visible before the "see more" fold. Every post must have a compelling opening that makes people click. Lead with the insight, not the introduction.

Good: "Scope 3 emissions are typically 70-90% of a company's total footprint."
Bad: "In today's post, we're going to talk about an important concept in carbon accounting."

## Community Distribution

Beyond the company page's own following, actively distribute content into LinkedIn communities where sustainability professionals gather.

### LinkedIn Groups (Post Directly)

- Sustainability Professionals
- ESG & Responsible Investing
- Climate Change Professionals
- Carbon Trading & Carbon Markets
- Corporate Sustainability Network
- Green Finance Network
- Circular Economy Club

Post the same content types (glossary terms, insights, quizzes) into these groups, but **rewrite the text slightly** for each group to avoid LinkedIn's duplicate content detection. Adapt the framing to the group's specific focus (e.g., emphasize investment implications in the ESG investing group, emphasize compliance in the corporate sustainability group).

**Posting limit in groups:** 1-2 posts per group per week maximum. More than that and group admins will flag the account.

### Engaging with Sustainability Voices

Identify 10-15 mid-tier LinkedIn creators (5K-50K followers) in the sustainability space. These are people who post daily about ESG, carbon markets, climate policy, green finance.

**The approach:**
1. Follow them from the company page
2. When they post about a topic covered in a Sustainability Academy course, add a genuinely valuable comment (not "check out our course")
3. If the comment thread naturally allows it, share a specific insight from a lesson with a link: "We actually break down the full Scope 3 calculation methodology here: [link]"
4. Over time, some of these creators will organically reference or share the platform

This is a manual effort and cannot be fully automated, but it is the highest-leverage activity for early growth. One share from a creator with 30K followers is worth more than a month of company page posts.

### Cross-Posting to Other Platforms

The same content extracted for LinkedIn can be adapted for:

- **Reddit** (r/sustainability, r/climatechange, r/ESG): Longer-form, more technical, no self-promotion in titles. Share insights, link in comments.
- **X/Twitter**: Shorter versions. Thread the quiz questions. Share one formula per week.
- **Sustainability-focused Slack/Discord communities** (Climate Action Tech, CISL Alumni): Share course links when someone asks a relevant question.

These channels are secondary to LinkedIn for this audience, but the content extraction pipeline produces material that works across all of them with minor reformatting.

## Content Calendar Generation

The extraction script should also generate a content calendar: a date-assigned schedule of which post goes out on which day.

### Calendar Logic

1. Run the extraction script to produce the full post library
2. Categorize each post by type (glossary, highlight, analogy, quiz, formula, calculation, course_announcement)
3. Assign posts to dates following the weekly mix pattern (Monday = glossary, Tuesday = insight, etc.)
4. Ensure no two posts from the same course appear on consecutive days (spread course representation across the calendar)
5. Output as a CSV with columns: `date`, `post_type`, `content`, `hashtags`, `link`, `follow_up_content` (for quiz/challenge posts that need a next-day answer reveal)

### Calendar Duration

Given the content volume in the platform:
- 190+ glossary terms = 38+ weeks of Monday posts
- Estimated 100+ HighlightBoxes across all courses = 50+ weeks of Tuesday posts
- Estimated 200+ quiz questions = 50+ weeks of Wednesday posts
- Estimated 30+ formulas and exercises = 30+ weeks of Thursday posts

**Conservatively, the existing content generates 6-9 months of daily LinkedIn posts without writing a single new piece of content.** As new courses are added to the platform, the extraction script can be re-run to extend the calendar.

## Measuring Success

### Metrics to Track

| Metric | What It Tells You | Target (first 3 months) |
|--------|-------------------|------------------------|
| Impressions per post | Reach | 500+ average |
| Engagement rate | Content resonance | 2-4% |
| Follower growth | Audience building | 50-100/month |
| Link clicks | Traffic to platform | 10-20 per post |
| Website signups from LinkedIn | Conversion | Track via UTM params |

### UTM Tracking

Append UTM parameters to every link in LinkedIn posts so that traffic from LinkedIn is trackable in analytics:

```
https://sustainabilityacademy.co/courses/vm0042/3_1?utm_source=linkedin&utm_medium=social&utm_campaign=glossary_term&utm_content=carbon_intensity
```

**Parameter conventions:**
- `utm_source`: always `linkedin`
- `utm_medium`: always `social`
- `utm_campaign`: post type (`glossary_term`, `key_insight`, `quiz`, `formula`, `course_launch`, `resource_list`)
- `utm_content`: specific identifier (term name, lesson ID, course ID)

The extraction script should auto-generate these UTM-tagged URLs for each post.

## Summary: End-to-End Flow

```
1. Run extraction script against LearningPlatform/src/content/
         |
         v
2. Script outputs posts.json with formatted posts + calendar
         |
         v
3. Feed posts.json into existing auto-posting setup
         |
         v
4. Auto-poster publishes to LinkedIn Company Page on schedule
         |
         v
5. For quiz/challenge posts: auto-post follow-up comment next day
         |
         v
6. Weekly: check analytics, note which post types perform best
         |
         v
7. Monthly: re-run extraction if new courses were added
```

The only manual steps are the initial company page setup, occasional engagement with comments and community groups, and periodic review of analytics to adjust the content mix.
