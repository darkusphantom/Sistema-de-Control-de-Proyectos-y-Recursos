import { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangleIcon } from "./icons";

export interface FormAlertProps {
  /** Map of field names to error messages. */
  errors: Record<string, string>;
  /** Optional server or global error message not tied to a specific field. */
  globalError?: string;
  className?: string;
}

/**
 * Summary box for form errors.
 * 
 * - Rendered when there are 2+ field errors OR a global error.
 * - Uses `role="alert"` and automatically receives focus via `tabIndex={-1}`.
 * - Each item is a button that moves focus to the corresponding field when clicked.
 * - Wrapped in `React.memo`: it only re-renders when `errors`/`globalError`
 *   actually change, not on every unrelated form state change.
 */
export const FormAlert = memo(function FormAlert({ errors, globalError, className }: FormAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  
  const entries = Object.entries(errors);
  const totalErrors = entries.length + (globalError ? 1 : 0);

  useEffect(() => {
    if (totalErrors > 0 && alertRef.current) {
      alertRef.current.focus();
    }
  }, [totalErrors]);

  // Design spec says summary box appears on 2+ field errors or if there's a global error (like invalid credentials).
  // Single field errors are handled exclusively inline.
  if (totalErrors === 0 || (totalErrors === 1 && !globalError)) {
    return null;
  }

  const focusField = (fieldName: string) => {
    const input = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    input?.focus();
  };

  return (
    <div
      ref={alertRef}
      role="alert"
      tabIndex={-1}
      className={cn(
        "rounded-md border border-danger bg-danger/10 p-4 text-danger focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2 font-medium">
        <AlertTriangleIcon className="shrink-0" />
        <span>Corrije los siguientes errores:</span>
      </div>
      <ul className="list-disc pl-8 space-y-1 text-sm">
        {globalError && <li>{globalError}</li>}
        {entries.map(([field, msg]) => (
          <li key={field}>
            <button
              type="button"
              onClick={() => focusField(field)}
              className="hover:underline focus:outline-none focus:underline text-left"
            >
              {msg}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
