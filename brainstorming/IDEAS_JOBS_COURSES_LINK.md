# Idea: Link Jobs and Courses Bidirectionally

**Date:** 2026-03-22
**Status:** Idea (not started)

## Context

We currently have two independent features:
1. **Courses** with structured lessons across sustainability topics (ESG, climate science, carbon markets, etc.)
2. **Jobs directory** (`/jobs`) powered by a daily-updated Excel file with sustainability job postings, categorized by profile, country, company type, etc.

These two features exist in isolation today.

## The Idea

Create a bidirectional link between jobs and courses:

### Jobs to Courses (demand to supply)
- Analyze skill requirements across job postings (extracted from job descriptions, skills fields, domain context)
- Map those skills to existing courses on the platform
- On each job listing, show: "Prepare for this role" with recommended courses
- Surface skill gaps where we don't yet have courses (content roadmap signal)

### Courses to Jobs (supply to demand)
- On each course page, show: "Jobs you can target after this course" with live job counts
- Give learners a concrete career motivation tied to what they're studying
- As the job database updates daily, these counts and listings stay fresh

### Skills Intelligence Layer
- Build a skills taxonomy extracted from the job postings (what skills are in demand right now)
- Track trends over time (which skills are growing, which are declining)
- Identify where current course content already covers in-demand skills
- Highlight gaps where new courses or lessons would have the most career impact

### Dynamic Signals
- The job database updates almost daily, so we get a continuous feed of:
  - Where demand is shifting geographically and by sector
  - Which new skills are emerging
  - Which profiles are hiring the most
- This data can inform both the learner experience and our content roadmap

## Open Questions

- How to extract and normalize skills from unstructured job descriptions?
- Should the mapping be manual (curated) or automated (NLP/embedding similarity)?
- Where to surface this on the UI (course pages, job listings, dashboard, dedicated "career paths" page)?
- How granular should the mapping be (course level vs. module level vs. lesson level)?
- Could we build a "career readiness score" for each learner based on completed courses vs. target job requirements?

## Potential Implementation Phases

1. **Manual mapping** of top job profiles to existing courses (quick win, validate the concept)
2. **Skills extraction** from job postings (automated, build the taxonomy)
3. **Course tagging** with skills they teach
4. **UI integration** on both job listings and course pages
5. **Trend dashboard** showing skill demand over time
