import type { ReactNode } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

/** Action configuration for {@link EmptyState}. */
type EmptyStateAction = {
  /** Button or link label. */
  label: string;
  /** When provided, renders a `<Link>` instead of a `<button>`. */
  href?: string;
  /** Click handler for button-style actions. */
  onClick?: () => void;
};

/** Heading level used for the empty-state title. */
export type EmptyStateTitleAs = "h2" | "h3" | "p";

/** Props accepted by {@link EmptyState}. */
export type EmptyStateProps = {
  /** Decorative icon (must be `aria-hidden`). */
  icon?: ReactNode;
  /** Primary message heading. */
  title: string;
  /**
   * Element used to render `title`. Defaults to `"h2"`.
   *
   * Use `"p"` or `"h3"` when the empty state is nested inside a section that
   * already exposes an `h2`, so the document outline keeps one section-level
   * heading per region (`docs/design/wireframes_dashboard.md` §8).
   */
  titleAs?: EmptyStateTitleAs;
  /** Supporting explanation text. */
  description?: string;
  /** Optional call-to-action: link or button. */
  action?: EmptyStateAction;
};

/**
 * Generic empty state display for lists with no results.
 *
 * Used for:
 * - "No posts yet" on first visit.
 * - "No results matching filters".
 * - Error states with a retry action.
 *
 * When nested inside a section that already renders an `h2`, pass
 * `titleAs="p"` (or `"h3"`) so the empty state does not introduce a second
 * section-level heading (`docs/design/wireframes_dashboard.md` §8).
 *
 * @param props - Empty state props.
 * @returns A centred card with icon, title, description and optional action.
 */
export function EmptyState({
  icon,
  title,
  titleAs = "h2",
  description,
  action,
}: EmptyStateProps) {
  const titleClassName = "font-display text-h3 text-text";

  const titleElement =
    titleAs === "p" ? (
      <p className={titleClassName}>{title}</p>
    ) : titleAs === "h3" ? (
      <h3 className={titleClassName}>{title}</h3>
    ) : (
      <h2 className={titleClassName}>{title}</h2>
    );

  return (
    <div className="border border-border rounded-lg bg-surface p-10 text-center flex flex-col items-center gap-3">
      {icon && (
        <span className="text-text-muted" aria-hidden="true">
          {icon}
        </span>
      )}

      {titleElement}

      {description && (
        <p className="max-w-sm text-sm text-text-muted">{description}</p>
      )}

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
