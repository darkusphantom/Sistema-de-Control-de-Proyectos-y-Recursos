import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Semantic colour tone for a badge.
 *
 * All tones share the same `--surface-muted` background so they can coexist
 * on a card without competing surfaces. Only the text colour varies, which
 * keeps contrast ratios above WCAG AA on both light and dark themes
 * (`docs/design/wireframes_feed.md` §8.2).
 */
export type BadgeTone =
  | "neutral"
  | "category"
  | "success"
  | "muted"
  | "warning"
  | "danger";

/** Props accepted by {@link Badge}. */
export type BadgeProps = {
  /** Semantic colour tone. */
  tone: BadgeTone;
  /** Badge label (always visible text — never colour alone). */
  children: ReactNode;
  /** Optional icon rendered before the label. Must be `aria-hidden`. */
  icon?: ReactNode;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  category: "text-primary",
  success: "text-success",
  muted: "text-text-muted",
  warning: "text-warning",
  neutral: "text-text-muted",
  danger: "text-danger",
};

/**
 * Small inline badge for category, type and visibility state labels.
 *
 * Design rules (`docs/design/wireframes_feed.md` §6.8):
 * - Background is always `--surface-muted`; only the text colour changes.
 * - The badge never conveys state by colour alone (SC 1.4.1): a text label
 *   is always present alongside any icon.
 *
 * @param props - Badge props.
 * @returns The badge span element.
 */
export function Badge({ tone, children, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-surface-muted px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}
