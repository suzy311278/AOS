/**
 * Greentryst Redesign Component Library
 *
 * Barrel export for all redesign components. Import from here:
 *   import {  DarkUICard, SectionHeading } from '@/components/redesign';
 *
 * See stitch-output/GREENTRYST_DESIGN_BIBLE.md for the complete design
 * language specification.
 */

export { cn } from '@/components/redesign/lib/cn';

// Primitives
export { CategoryLabel } from './CategoryLabel';
export type { CategoryLabelProps } from './CategoryLabel';

export { SectionHeading } from './SectionHeading';
export type { SectionHeadingProps } from './SectionHeading';

export { RedesignButton } from './RedesignButton';
export type { RedesignButtonProps } from './RedesignButton';

export { StatBadge } from './StatBadge';
export type { StatBadgeProps } from './StatBadge';

export { Stat } from './Stat';
export type { StatProps } from './Stat';

// Section wrappers
export { DarkSection } from './DarkSection';
export type { DarkSectionProps } from './DarkSection';

export { LightSection } from './LightSection';
export type { LightSectionProps } from './LightSection';

// Signature components

export { RedesignFooter } from './RedesignFooter';
export type { RedesignFooterProps } from './RedesignFooter';

export { DarkUICard } from './DarkUICard';
export type { DarkUICardProps } from './DarkUICard';

export { PricingCard } from './PricingCard';
export type { PricingCardProps } from './PricingCard';

// Homepage components
export { Ticker } from './Ticker';
export { TryItDemo } from './TryItDemo';
export type { TryItDemoProps } from './TryItDemo';
export { ActiveShowcase } from './ActiveShowcase';
export { PricingSection } from './PricingSection';
export { ClosingCTA } from './ClosingCTA';

// Course page components
export { CourseRedesignCard } from './CourseRedesignCard';
export { LearningPathShowcase } from './LearningPathShowcase';
export { SourceLogoCycle } from './SourceLogoCycle';
export { CourseDetailHero } from './CourseDetailHero';
export { CourseDetailSidebar } from './CourseDetailSidebar';
export { CourseModuleTimeline } from './CourseModuleTimeline';
export { RelatedLearningPaths } from './RelatedLearningPaths';
export { LessonDetailHero } from './LessonDetailHero';
export { COURSE_OUTCOMES_MAP, DEFAULT_COURSE_OUTCOMES } from './course-outcomes';
export { Logo } from './Logo';
