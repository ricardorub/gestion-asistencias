"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCourseSchema,
  type CreateCourseInput,
  type CreateCourseDTO,
} from "../schema";
import { createCourseAction, updateCourseAction } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { nanoid } from "nanoid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CourseInitial extends CreateCourseDTO {
  id: string;
}

function parseCourseName(fullName: string) {
  const match = fullName.match(/^(.*?)\s*-\s*(1°|2°|3°|4°|5°)\s*Grado\s*-\s*Sección\s+(A|B)$/i);
  if (match) {
    return {
      baseName: match[1],
      grade: `${match[2]} Grado` as "1° Grado" | "2° Grado" | "3° Grado" | "4° Grado" | "5° Grado",
      section: match[3].toUpperCase() as "A" | "B",
    };
  }
  return {
    baseName: fullName,
    grade: "1° Grado" as "1° Grado" | "2° Grado" | "3° Grado" | "4° Grado" | "5° Grado",
    section: "A" as "A" | "B",
  };
}

export function CourseFormDialog({
  initial,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  initial?: CourseInitial;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initial;

  const parsed = initial ? parseCourseName(initial.name) : { baseName: "", grade: "1° Grado" as const, section: "A" as const };
  const [section, setSection] = useState<"A" | "B">(parsed.section);
  const [grade, setGrade] = useState<"1° Grado" | "2° Grado" | "3° Grado" | "4° Grado" | "5° Grado">(parsed.grade);

  // Sync state if initial changes (e.g. when opening edit dialog)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    if (initial) {
      const p = parseCourseName(initial.name);
      setSection(p.section);
      setGrade(p.grade);
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateCourseInput, unknown, CreateCourseDTO>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: initial
      ? { ...initial, name: parsed.baseName, description: initial.description ?? "" }
      : {
          code: `C-${nanoid(6).toUpperCase()}`,
          name: "Matemática",
          description: "",
          passingGrade: 11,
        },
  });

  function onSubmit(values: CreateCourseDTO) {
    const combinedName = `${values.name.trim()} - ${grade} - Sección ${section}`;
    const submissionValues = { ...values, name: combinedName };

    startTransition(async () => {
      const result = isEdit
        ? await updateCourseAction({ ...submissionValues, id: initial.id })
        : await createCourseAction(submissionValues);

      if (result.ok) {
        toast.success(isEdit ? "Curso actualizado." : "Curso creado.");
        setOpen(false);
        if (!isEdit) {
          reset({
            code: `C-${nanoid(6).toUpperCase()}`,
            name: "Matemática",
            description: "",
            passingGrade: 11,
          });
          setSection("A");
          setGrade("1° Grado");
        }
      } else {
        if (result.fieldErrors?.code?.[0]) {
          setError("code", { message: result.fieldErrors.code[0] });
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Editar curso" : "Nuevo curso"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del curso."
              : "Crea un curso para matricular alumnos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <input type="hidden" {...register("code")} />

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel>Curso</FieldLabel>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <Select
                        items={{
                          Matemática: "Matemática",
                          Lenguaje: "Lenguaje",
                          Historia: "Historia",
                          Geografía: "Geografía",
                        }}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matemática">Matemática</SelectItem>
                          <SelectItem value="Lenguaje">Lenguaje</SelectItem>
                          <SelectItem value="Historia">Historia</SelectItem>
                          <SelectItem value="Geografía">Geografía</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={errors.name ? [errors.name] : undefined} />
                </Field>
              </div>

              <div>
                <Field>
                  <FieldLabel>Grado</FieldLabel>
                  <Select
                    items={{
                      "1° Grado": "1° Grado",
                      "2° Grado": "2° Grado",
                      "3° Grado": "3° Grado",
                      "4° Grado": "4° Grado",
                      "5° Grado": "5° Grado",
                    }}
                    value={grade}
                    onValueChange={(v) => setGrade((v as any) ?? "1° Grado")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1° Grado">1°</SelectItem>
                      <SelectItem value="2° Grado">2°</SelectItem>
                      <SelectItem value="3° Grado">3°</SelectItem>
                      <SelectItem value="4° Grado">4°</SelectItem>
                      <SelectItem value="5° Grado">5°</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div>
                <Field>
                  <FieldLabel>Sección</FieldLabel>
                  <Select
                    items={{ A: "Sección A", B: "Sección B" }}
                    value={section}
                    onValueChange={(v) => setSection((v as "A" | "B") ?? "A")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <Field data-invalid={!!errors.passingGrade}>
              <FieldLabel htmlFor="passingGrade">
                Nota mínima aprobatoria
              </FieldLabel>
              <Input
                id="passingGrade"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                max={20}
                className="w-28 font-mono tabular-nums"
                aria-invalid={!!errors.passingGrade}
                {...register("passingGrade")}
              />
              <FieldDescription>
                Escala 0–20 (ej. 10.5, 11, 12 según tu institución).
              </FieldDescription>
              <FieldError
                errors={errors.passingGrade ? [errors.passingGrade] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              {isEdit ? "Guardar cambios" : "Crear curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
