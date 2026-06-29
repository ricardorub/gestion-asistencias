import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Brand, BrandMark } from "@/components/brand";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 2.25rem, currentColor 2.25rem 2.3125rem)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-marker text-primary">
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
              <path
                d="M5 12.5l4 4 10-10.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Registro
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-marker!">Asistencias y notas</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Crea tu cuenta de profesor{" "}
            <span className="text-marker">en segundos.</span>
          </h1>
          <p className="mt-4 text-pretty text-primary-foreground/70">
            Tus alumnos marcan asistencia con un código temporal. Tú llevas el
            control de cursos, notas y métricas desde un solo lugar.
          </p>
        </div>

        <p className="relative font-mono text-xs text-primary-foreground/50">
          Hecho para profesores de academias, institutos y colegios.
        </p>
      </aside>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Brand />
          </div>

          <BrandMark className="mb-5 hidden lg:inline-flex" />
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Crea tu cuenta
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa tus datos para registrarte como profesor.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
