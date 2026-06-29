"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { DownloadIcon, FileUpIcon } from "lucide-react";
import { toast } from "sonner";
import { importStudentsAction } from "../actions";
import type { ImportReport } from "../service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ImportStudentsDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<ImportReport | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setReport(null);
    startTransition(async () => {
      const result = await importStudentsAction(formData);
      if (result.ok) {
        setReport(result.data);
        formRef.current?.reset();
        if (result.data.created > 0) {
          toast.success(`${result.data.created} alumno(s) importado(s).`);
        }
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.errors.length} fila(s) con problemas.`);
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setReport(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Importar alumnos</DialogTitle>
          <DialogDescription>
            Sube un archivo .xlsx con tus alumnos. Descarga la plantilla para
            conocer el formato exacto.
          </DialogDescription>
        </DialogHeader>

        <a
          href="/api/templates/students"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <DownloadIcon className="size-4" />
          Descargar plantilla
        </a>

        <form ref={formRef} onSubmit={onSubmit} className="mt-2">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
          />

          {report && (
            <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p>
                <span className="font-mono font-semibold tabular-nums text-[var(--present)]">
                  {report.created}
                </span>{" "}
                creados de {report.total} ·{" "}
                <span className="font-mono tabular-nums">
                  {report.errors.length}
                </span>{" "}
                con problemas
              </p>
              {report.errors.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {report.errors.map((err) => (
                    <li
                      key={err.row}
                      className="flex gap-2 text-xs text-muted-foreground"
                    >
                      <span className="font-mono text-destructive">
                        Fila {err.row}
                      </span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {report ? "Cerrar" : "Cancelar"}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <FileUpIcon data-icon="inline-start" />
              )}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
