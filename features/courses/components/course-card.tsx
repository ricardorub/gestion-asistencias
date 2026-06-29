"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { deleteCourseAction } from "../actions";
import { CourseFormDialog, type CourseInitial } from "./course-form-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface CourseCardData extends CourseInitial {
  enrolledCount: number;
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteCourseAction(course.id);
      if (result.ok) {
        toast.success("Curso eliminado.");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="group relative transition-colors hover:border-ring/40">
      <CardHeader>
        <CardTitle className="font-display text-lg">
          <Link
            href={`/cursos/${course.id}`}
            className="after:absolute after:inset-0"
          >
            {course.name}
          </Link>
        </CardTitle>
        <div className="absolute right-3 top-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
                >
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <PencilIcon data-icon="inline-start" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon data-icon="inline-start" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="min-h-10">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {course.description || "Sin descripción."}
        </p>
      </CardContent>
      <CardFooter>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <UsersIcon className="size-4" />
          <span className="font-mono tabular-nums">{course.enrolledCount}</span>
          {course.enrolledCount === 1 ? "alumno" : "alumnos"}
        </span>
      </CardFooter>

      <CourseFormDialog
        initial={course}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              ¿Eliminar {course.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El curso se ocultará de tus listas. Sus registros históricos se
              conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isPending}
            >
              {isPending && <Spinner data-icon="inline-start" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
