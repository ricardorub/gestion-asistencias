"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createStudentSchema,
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  type CreateStudentInput,
  type CreateStudentDTO,
} from "../schema";
import { createStudentAction, updateStudentAction } from "../actions";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface StudentInitial extends CreateStudentDTO {
  id: string;
}

const EMPTY: CreateStudentInput = {
  name: "",
  paternalName: "",
  maternalName: "",
  email: "",
  phone: "",
  status: "ACTIVE",
};

export function StudentFormDialog({
  initial,
  children,
  open: controlledOpen,
  onOpenChange,
  enrollInCourseId,
}: {
  initial?: StudentInitial;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enrollInCourseId?: string;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateStudentInput, unknown, CreateStudentDTO>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: initial
      ? { ...initial, maternalName: initial.maternalName ?? "", email: initial.email ?? "", phone: initial.phone ?? "" }
      : { ...EMPTY, enrollInCourseId },
  });

  // Sync default values when enrollInCourseId changes
  useEffect(() => {
    if (enrollInCourseId && !isEdit) {
      reset({ ...EMPTY, enrollInCourseId });
    }
  }, [enrollInCourseId, isEdit, reset]);

  function onSubmit(values: CreateStudentDTO) {
    startTransition(async () => {
      const result = isEdit
        ? await updateStudentAction({ ...values, id: initial.id })
        : await createStudentAction(values);

      if (result.ok) {
        toast.success(isEdit ? "Alumno actualizado." : "Alumno creado.");
        setOpen(false);
        router.refresh();
        if (!isEdit) reset({ ...EMPTY, enrollInCourseId });
      } else {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof CreateStudentInput, {
                message: messages[0],
              });
            }
          }
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Editar alumno" : "Nuevo alumno"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del alumno."
              : "Registra un alumno en tu lista."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register("enrollInCourseId")} />
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.status}>
              <FieldLabel>Estado</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    items={STUDENT_STATUS_LABELS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STUDENT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nombres</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>

            <Field data-invalid={!!errors.paternalName}>
              <FieldLabel htmlFor="paternalName">Apellido paterno</FieldLabel>
              <Input
                id="paternalName"
                aria-invalid={!!errors.paternalName}
                {...register("paternalName")}
              />
              <FieldError
                errors={errors.paternalName ? [errors.paternalName] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="maternalName">Apellido materno</FieldLabel>
              <Input id="maternalName" {...register("maternalName")} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <Input id="phone" className="font-mono" {...register("phone")} />
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
              {isEdit ? "Guardar cambios" : "Crear alumno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
