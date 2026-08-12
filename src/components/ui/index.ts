/**
 * Design-system entry point.
 *
 * Pages import from here so there is exactly one place a header, button,
 * card, badge or stat tile can come from.
 */
export { PageHeader, type PageHeaderProps, type PageHeaderStat } from './page-header';
export { StatCard, type StatCardProps } from './stat-card';
export { Button, buttonVariants } from './button';
export { Badge, badgeVariants } from './badge';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from './card';
export { TONE_SURFACE, TONE_INK, TONE_FILL, TONE_BADGE, type Tone } from './tone';
