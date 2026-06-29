"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { saveCategoriesAction } from "../actions";
import type { GradeSheetCategory } from "../service";
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
import { cn } from "@/lib/utils";

interface FormValues {
  categories: { id?: string; name: string; percentage: number }[];
}

export function CategoriesDialog({
  courseId,
  categories,
  children,
}: {
  courseId: string;
  categories: GradeSheetCategory[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      categories:
        categories.length > 0
          ? categories.map((c) => ({
              id: c.id,
              name: c.name,
              percentage: c.percentage,
            }))
          : [{ name: "", percentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "categories",
  });

  const watched = useWatch({ control, name: "categories" });
  const total = (watched ?? []).reduce(
    (s, c) => s + (Number(c.percentage) || 0),
    0,
  );
  const valid = Math.abs(total - 100) < 0.01;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await saveCategoriesAction({
        courseId,
        categories: values.categories.map((c, i) => ({
          ...c,
          order: i,
        })),
      });
      if (result.ok) {
        toast.success("Evaluaciones guardadas.");
        setOpen(false);
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
        if (o)
          reset({
            categories:
              categories.length > 0
                ? categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    percentage: c.percentage,
                  }))
                : [{ name: "", percentage: 0 }],
          });
      }}
    >
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Configurar evaluaciones
          </DialogTitle>
          <DialogDescription>
            Define las evaluaciones y su peso. Deben sumar 100%.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground/50" />
                <Input
                  placeholder="Ej. Examen Parcial"
                  className="flex-1"
                  {...register(`categories.${i}.name`)}
                />
                <div className="relative w-24">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    max={100}
                    className="pr-6 text-right font-mono tabular-nums"
                    {...register(`categories.${i}.percentage`)}
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => append({ name: "", percentage: 0 })}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar evaluación
          </Button>

          <div className="mt-4 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span
              className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                valid ? "text-present" : "text-destructive",
              )}
            >
              {total.toFixed(2)}% {valid ? "✓" : `(faltan ${(100 - total).toFixed(2)})`}
            </span>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !valid}>
              {isPending && <Spinner data-icon="inline-start" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
