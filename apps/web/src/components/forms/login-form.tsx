"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/field";
import { buttonStyles } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { validateLogin, validateUsername, validatePassword } from "@/lib/validation/auth";
import { applyFieldError } from "@/lib/validation/form-errors";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";

const gateway = new StaticAuthGateway();

/**
 * LoginForm component.
 * Provides the user interface for authenticating an existing user.
 * It manages validation, displays errors, and communicates with the AuthGateway.
 */
export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const validation = validateLogin(formData);

    setHasSubmitted(true);
    setErrors(validation.errors);
    setGlobalError(undefined);

    if (!validation.success) return;

    setIsSubmitting(true);
    const result = await gateway.signIn(formData);

    if (result.success) {
      router.replace("/dashboard");
    } else {
      setGlobalError(result.error);
      setErrors(result.fieldErrors || {});
      setIsSubmitting(false);
      // Empty password on failure as required by spec §11.1
      const passwordInput = formRef.current?.elements.namedItem("password") as HTMLInputElement;
      if (passwordInput) passwordInput.value = "";
    }
  }, [isSubmitting, router]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasSubmitted) return;
    
    const { name, value } = e.target;
    let error: string | null = null;
    
    if (name === "username") error = validateUsername(value);
    if (name === "password") error = validatePassword(value, true);

    // `applyFieldError` devuelve la misma referencia cuando el error no cambia,
    // por lo que React omite el re-render de los campos intactos.
    setErrors(prev => applyFieldError(prev, name, error));
  }, [hasSubmitted]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h1 text-text">Sistema de Control de Proyectos y Recursos</h1>
        <p className="text-base text-text-muted">
          Accede al sistema para gestionar proyectos, inventario, solicitudes y reportes.
        </p>
      </div>

      <FormAlert errors={errors} globalError={globalError} />

      <form 
        ref={formRef}
        noValidate 
        onSubmit={handleSubmit} 
        aria-busy={isSubmitting}
        className="flex flex-col"
      >
        <div className="flex flex-col gap-4 pb-6 mb-6 border-b border-border">
          <Field
            label="Usuario"
            name="username"
            type="text"
            placeholder="j.rivas"
            autoComplete="username"
            error={errors.username}
            onBlur={handleBlur}
            maxLength={50}
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            onBlur={handleBlur}
            maxLength={100}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonStyles({ variant: "primary", className: "w-full" })}
        >
          {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-sm text-text">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-accent-teal hover:underline focus-visible:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
