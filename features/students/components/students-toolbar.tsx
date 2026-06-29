"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, FileUpIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useSetQuery } from "@/hooks/use-set-query";
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS } from "../schema";
import { StudentFormDialog } from "./student-form-dialog";
import { ImportStudentsDialog } from "./import-students-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "ALL";

const STATUS_FILTER_LABELS: Record<string, string> = {
  [ALL]: "Todos los estados",
  ...STUDENT_STATUS_LABELS,
};

export function StudentsToolbar({
  q,
  status,
}: {
  q?: string;
  status?: string;
}) {
  const setQuery = useSetQuery();
  const [search, setSearch] = useState(q ?? "");

  // Enlace de exportación que respeta los filtros activos.
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (status) exportParams.set("status", status);
  const exportHref = `/api/export/students${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  // Debounce de la búsqueda → actualiza la URL (reinicia a página 1).
  // Solo navega si el texto difiere del parámetro actual, para no recargar
  // de más ni entrar en bucles.
  useEffect(() => {
    if (search === (q ?? "")) return;
    const t = setTimeout(() => {
      setQuery({ q: search || null, page: null });
    }, 350);
    return () => clearTimeout(t);
  }, [search, q, setQuery]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o documento…"
          className="pl-9"
        />
      </div>

      <Select
        items={STATUS_FILTER_LABELS}
        value={status ?? ALL}
        onValueChange={(v) =>
          setQuery({ status: v === ALL ? null : v, page: null })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {STUDENT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STUDENT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <ImportStudentsDialog>
          <Button variant="outline">
            <FileUpIcon data-icon="inline-start" />
            Importar
          </Button>
        </ImportStudentsDialog>

        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={exportHref} />}
        >
          <DownloadIcon data-icon="inline-start" />
          Exportar
        </Button>

        <StudentFormDialog>
          <Button>
            <PlusIcon data-icon="inline-start" />
            Nuevo alumno
          </Button>
        </StudentFormDialog>
      </div>
    </div>
  );
}
