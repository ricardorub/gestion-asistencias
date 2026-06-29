"use client";

import { useEffect, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useSetQuery } from "@/hooks/use-set-query";
import { CourseFormDialog } from "./course-form-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CoursesToolbar({ q }: { q?: string }) {
  const setQuery = useSetQuery();
  const [search, setSearch] = useState(q ?? "");

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
          placeholder="Buscar cursos por nombre o código…"
          className="pl-9"
        />
      </div>

      <CourseFormDialog>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Nuevo curso
        </Button>
      </CourseFormDialog>
    </div>
  );
}
