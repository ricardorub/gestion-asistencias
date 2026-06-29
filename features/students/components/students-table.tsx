"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useSetQuery } from "@/hooks/use-set-query";
import {
  DOCUMENT_TYPE_LABELS,
  STUDENT_STATUS_LABELS,
  type CreateStudentDTO,
} from "../schema";
import { StudentRowActions } from "./student-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudentRow = CreateStudentDTO & {
  id: string;
  createdAt: Date;
};

const columnHelper = createColumnHelper<StudentRow>();

const dateFmt = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function StudentsTable({
  items,
  total,
  page,
  pageSize,
  sortBy,
  sortDir,
}: {
  items: StudentRow[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}) {
  const setQuery = useSetQuery();

  function toggleSort(field: string) {
    const dir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
    setQuery({ sortBy: field, sortDir: dir });
  }

  function SortHeader({ field, label }: { field: string; label: string }) {
    const active = sortBy === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ChevronsUpDownIcon className="size-3.5 opacity-40" />
        )}
      </button>
    );
  }

  const columns = [
    columnHelper.accessor("code", {
      header: () => <SortHeader field="code" label="Código" />,
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: "fullName",
      header: () => <SortHeader field="name" label="Alumno" />,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <span className="font-medium">
            {s.paternalName} {s.maternalName ?? ""}, {s.name}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "document",
      header: "Documento",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            <span className="font-mono">{s.documentNumber}</span>{" "}
            <span className="text-xs">
              ({DOCUMENT_TYPE_LABELS[s.documentType]})
            </span>
          </span>
        );
      },
    }),
    columnHelper.accessor("email", {
      header: "Correo",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge
            variant="secondary"
            className={cn(
              "font-medium",
              status === "ACTIVE"
                ? "bg-present/15 text-present"
                : "bg-muted text-muted-foreground",
            )}
          >
            {STUDENT_STATUS_LABELS[status]}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: () => <SortHeader field="createdAt" label="Alta" />,
      cell: (info) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {dateFmt.format(new Date(info.getValue()))}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex justify-end">
            <StudentRowActions
              student={{
                ...s,
                fullName: `${s.paternalName}, ${s.name}`,
              }}
            />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No hay alumnos que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {from}–{to} de <span className="font-medium">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setQuery({ page: page - 1 })}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setQuery({ page: page + 1 })}
          >
            Siguiente
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
