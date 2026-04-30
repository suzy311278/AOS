/**
 * Barrel export for ArmorInnovate components.
 *
 * Always import from `@/components/armor` rather than the individual files
 * so the public surface stays curated.
 */

export { TerminalBanner } from './TerminalBanner';
export type { TerminalBannerProps } from './TerminalBanner';

export { HmiCard } from './HmiCard';
export type { HmiCardProps, HmiStatus } from './HmiCard';

export { ArmorNav } from './ArmorNav';
export type { ArmorNavProps } from './ArmorNav';

export { ArmorFooter } from './ArmorFooter';

export { SurpriseMe } from './SurpriseMe';
export type { SurpriseMeProps } from './SurpriseMe';

export {
  IconPLC,
  IconHMI,
  IconActuator,
  IconSensor,
  IconRTU,
  IconModbus,
  IconSubstation,
  IconShield,
  IconTerminal,
  IconNetwork,
  IconVuln,
} from './ScadaIcons';
