"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { registerSchema, type RegisterDTO } from "../schema";
import { registerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDTO>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterDTO) {
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.ok) {
        setIsSuccess(true);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <h3 className="font-display font-bold text-lg text-foreground">¡Solicitud Enviada!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tu cuenta ha sido creada correctamente en estado pendiente. Un administrador revisará y aprobará tu acceso en breve.
        </p>
        <Button onClick={() => router.push("/login")} className="w-full mt-2">
          Ir al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Juan Pérez"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="profesor@demo.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        {formError && (
          <FieldError role="alert">{formError}</FieldError>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <UserPlusIcon data-icon="inline-start" />
          )}
          Registrarse
        </Button>
      </FieldGroup>
    </form>
  );
}
