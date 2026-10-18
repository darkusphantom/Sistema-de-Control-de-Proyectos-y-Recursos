"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/field";
import { buttonStyles } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { 
  validateRegister, 
  validateName, 
  validateEmail, 
  validatePassword, 
  validateConfirmPassword 
} from "@/lib/validation/auth";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";

const gateway = new StaticAuthGateway();

/**
 * RegisterForm component.
 * Provides the user interface for registering a new user account.
 * It handles validation of fields, confirmation of password, and communication with the AuthGateway.
 */
export function RegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const validation = validateRegister(formData);

    setHasSubmitted(true);
    setErrors(validation.errors);
    setGlobalError(undefined);

    if (!validation.success) return;

    setIsSubmitting(true);
    const result = await gateway.signUp(formData);

    if (result.success) {
      router.replace("/dashboard");
    } else {
      setGlobalError(result.error);
      setErrors(result.fieldErrors || {});
      setIsSubmitting(false);
      // In register, we conserve all written values including password, per design spec §11.1
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasSubmitted) return;
    
    const { name, value } = e.target;
    let error: string | null = null;
    
    if (name === "given-name") error = validateName(value, false);
    if (name === "family-name") error = validateName(value, true);
    if (name === "email") error = validateEmail(value);
    if (name === "new-password") error = validatePassword(value, false);
    if (name === "confirm-password") {
      const password = formRef.current?.elements.namedItem("new-password") as HTMLInputElement;
      error = validateConfirmPassword(password?.value || "", value);
    }

    setErrors(prev => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h1 text-text">Crear cuenta</h1>
        <p className="text-base text-text-muted">
          Regístrate para publicar y consultar información de la facultad.
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
            label="Nombre"
            name="given-name"
            type="text"
            placeholder="María"
            autoComplete="given-name"
            error={errors["given-name"]}
            onBlur={handleBlur}
            maxLength={100}
          />
          <Field
            label="Apellido"
            name="family-name"
            type="text"
            placeholder="Rivas"
            autoComplete="family-name"
            error={errors["family-name"]}
            onBlur={handleBlur}
            maxLength={100}
          />
          <Field
            label="Correo"
            name="email"
            type="email"
            inputMode="email"
            placeholder="nombre@correo.com"
            autoComplete="email"
            error={errors.email}
            onBlur={handleBlur}
            maxLength={254}
          />
          <Field
            label="Contraseña"
            name="new-password"
            type="password"
            autoComplete="new-password"
            helpText="Mínimo 8 caracteres."
            error={errors["new-password"]}
            onBlur={handleBlur}
            maxLength={100}
          />
          <Field
            label="Confirmar contraseña"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            error={errors["confirm-password"]}
            onBlur={handleBlur}
            maxLength={100}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonStyles({ variant: "primary", className: "w-full" })}
        >
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-text-muted text-center">
        Al registrarte se te asignará el rol de Coordinador de Proyecto
      </p>

      <p className="text-center text-sm text-text">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-accent-teal hover:underline focus-visible:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
