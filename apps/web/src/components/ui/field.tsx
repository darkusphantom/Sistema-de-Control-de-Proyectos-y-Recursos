import { forwardRef, memo, InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangleIcon } from "./icons";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** The text label for the field. */
  label: string;
  /** Optional help text displayed below the field. */
  helpText?: string;
  /** Error message displayed when validation fails. */
  error?: string;
}

/**
 * Reusable form field container.
 * 
 * - Ensures accessible `<label>` and `<input>` linkage.
 * - Manages `aria-describedby` dynamically based on help text and error presence.
 * - Renders errors with the required `<AlertTriangleIcon>` and `--danger` styling.
 * - Uses `--text-muted` for the base border (WCAG 1.4.11 contrast compliance).
 * - Wrapped in `React.memo`: with stable props (primitive values and handlers
 *   memoized in the parent form) the field skips re-rendering when another
 *   field's error changes.
 */
export const Field = memo(
  forwardRef<HTMLInputElement, FieldProps>(
    ({ label, helpText, error, className, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
      const id = useId();
      const helpId = `${id}-help`;
      const errorId = `${id}-error`;

      const describedBy = [
        error ? errorId : undefined,
        helpText ? helpId : undefined,
        ariaDescribedBy
      ]
        .filter(Boolean)
        .join(" ") || undefined;

      return (
        <div className={cn("flex flex-col gap-1.5", className)}>
          <label htmlFor={id} className="text-base font-medium text-text">
            {label}
          </label>
          
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              "min-h-11 rounded-md border bg-surface px-3 py-2 text-base text-text transition-colors",
              "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              error ? "border-danger" : "border-text-muted",
            )}
            {...props}
          />

          {error && (
            <p id={errorId} className="flex items-center gap-1.5 text-sm text-danger">
              <AlertTriangleIcon className="shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {helpText && !error && (
            <p id={helpId} className="text-sm text-text-muted">
              {helpText}
            </p>
          )}
        </div>
      );
    },
  ),
);

Field.displayName = "Field";
