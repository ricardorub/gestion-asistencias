import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Brand, BrandMark } from "@/components/brand";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
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
            Pasa lista y registra notas{" "}
            <span className="text-marker">sin papeleo.</span>
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
            Inicia sesión
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa con tu cuenta de profesor para continuar.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>

          <p className="mt-6 rounded-md border border-dashed border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
            Demo · profesor@demo.com · password123
          </p>
        </div>
      </div>
    </main>
  );
}
