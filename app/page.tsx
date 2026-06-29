"use client";

import Link from "next/link";
import Image from "next/image";
import {
  GraduationCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ShieldCheckIcon,
  AwardIcon,
  UsersIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand";
import gotitasImg from "@/public/gotitas-del-saber.png";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight leading-none text-primary">
                Gotitas del Saber
              </span>
              
            </div>
          </div>

          

          <div>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98]"
            >
              Portal Docente
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-4 lg:pt-6 pb-16 lg:pb-24">
          {/* Subtle background graphics */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0 2.25rem, var(--primary) 2.25rem 2.3125rem)",
            }}
          />
          <div className="mx-auto max-w-6xl px-6">
            {/* Panoramic Image Showcase on TOP */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all duration-300 hover:shadow-primary/5">
              <div className="relative aspect-[21/9] w-full min-h-[200px] md:min-h-[380px]">
                <Image
                  src={gotitasImg}
                  alt="Sede Gotitas del Saber"
                  fill
                  priority
                  className="object-cover object-[center_35%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Institución Educativa Gotitas del Saber
                    </h3>
                  </div>
                  <p className="max-w-md text-sm text-muted-foreground/90 leading-relaxed">
                    Infraestructura moderna diseñada especialmente para potenciar el aprendizaje, la comodidad y el desarrollo integral de todos nuestros alumnos.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Text Grid Below Image */}
            <div className="mt-12 text-center lg:text-left">
              <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                <div className="space-y-6 lg:col-span-8">
                  <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl leading-[1.05]">
                    Formando el futuro con{" "}
                    <span className="marker-highlight">educación y valores.</span>
                  </h1>
                  <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                    En la Institución Educativa Gotitas del Saber brindamos una formación integral potenciando el talento y la curiosidad de cada estudiante.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS / FEATURES */}
        <section id="beneficios" className="py-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Nuestras Fortalezas
              </h2>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: "Valores Cívicos y Morales",
                  desc: "Educación centrada en el respeto, la solidaridad, la disciplina y la responsabilidad cívica.",
                },
                {
                  icon: AwardIcon,
                  title: "Docentes Calificados",
                  desc: "Un equipo de educadores comprometido, capacitado y con vocación de servicio.",
                },
                {
                  icon: UsersIcon,
                  title: "Atención Semipersonalizada",
                  desc: "Grupos reducidos para garantizar un seguimiento personalizado del aprendizaje y la conducta.",
                },
                {
                  icon: GraduationCapIcon,
                  title: "Herramientas Digitales",
                  desc: "Acceso al portal docente y control digital de asistencias para mantener a los padres al tanto.",
                },
                {
                  icon: MapPinIcon,
                  title: "Ubicación Céntrica",
                  desc: "Instalaciones seguras y de fácil acceso en la ciudad de Lima.",
                },
                {
                  icon: BookOpenIcon,
                  title: "Talleres Formativos",
                  desc: "Reforzamiento pedagógico y talleres que complementan las horas curriculares estándar.",
                },
              ].map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground mb-4">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, transparent 0 2.25rem, currentColor 2.25rem 2.3125rem)",
            }}
          />
          <div className="mx-auto max-w-4xl px-6 text-center relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              ¿Listo para formar parte de Gotitas del Saber?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              Contáctanos hoy mismo para obtener información sobre el proceso de admisiones, visitas guiadas y traslados.
            </p>
            <div className="mt-8 flex justify-center">
              
            </div>
          </div>
        </section>

        {/* CONTACT / LOCATION */}
        <section id="contacto" className="bg-card py-20 border-t border-border/40">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Informes */}
              <div className="space-y-6">
                <div>
                  <p className="eyebrow text-marker!">Atención y Admisión</p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary">
                    Ponte en contacto
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Nuestro equipo administrativo está listo para responder tus dudas sobre costos, vacantes y requisitos de matrícula.
                  </p>
                </div>

                <div className="space-y-4 font-sans">
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <MapPinIcon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Dirección</p>
                      <p className="text-sm text-muted-foreground">Av. Las Gotitas 123, San Miguel, Lima, Perú</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <PhoneIcon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Teléfono de Informes</p>
                      <p className="text-sm text-muted-foreground">+51 1 555-0199 / +51 999 888 777</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <MailIcon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Correo Electrónico</p>
                      <p className="text-sm text-muted-foreground">informes@gotitasdelsaber.edu.pe</p>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-card py-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground text-center md:text-left">
          <div className="flex items-center gap-2">
            <BrandMark className="size-6" />
            <span className="font-display font-bold text-foreground">Gotitas del Saber</span>
          </div>
          <p>© 2026 I.E. Gotitas del Saber. Todos los derechos reservados. Lima, Perú.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors font-medium">
              Acceso Profesores
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
