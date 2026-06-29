"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getAvailableStudentsAction,
  enrollStudentsAction,
  type AvailableStudent,
} from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function EnrollDialog({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [available, setAvailable] = useState<AvailableStudent[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carga alumnos disponibles (con búsqueda con debounce) mientras está abierto.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const result = await getAvailableStudentsAction(courseId, search || undefined);
      if (cancelled) return;
      if (result.ok) setAvailable(result.data);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, search, courseId]);

  function reset() {
    setSearch("");
    setSelected(new Set());
    setAvailable([]);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === available.length
        ? new Set()
        : new Set(available.map((s) => s.id)),
    );
  }

  function onEnroll() {
    startTransition(async () => {
      const result = await enrollStudentsAction({
        courseId,
        studentIds: [...selected],
      });
      if (result.ok) {
        toast.success(
          `${result.data.enrolled} ${result.data.enrolled === 1 ? "alumno matriculado" : "alumnos matriculados"}.`,
        );
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon data-icon="inline-start" />
            Asignar alumnos
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Asignar alumnos</DialogTitle>
          <DialogDescription>
            Selecciona los alumnos a matricular en este curso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alumno…"
              className="pl-9"
            />
          </div>

          {available.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="self-start text-sm text-muted-foreground hover:text-foreground"
            >
              {selected.size === available.length
                ? "Quitar selección"
                : "Seleccionar todos"}
            </button>
          )}

          <ScrollArea className="h-64 rounded-md border">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            ) : available.length === 0 ? (
              <Empty className="h-64">
                <EmptyHeader>
                  <EmptyTitle className="text-sm font-normal text-muted-foreground">
                    No hay alumnos disponibles.
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {available.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/40">
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">
                          {s.fullName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {s.code}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={selected.size === 0 || isPending}
            onClick={onEnroll}
          >
            {isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <PlusIcon data-icon="inline-start" />
            )}
            Matricular {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
