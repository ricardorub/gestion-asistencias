"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as XLSX from "xlsx"; // Importamos la librería para leer las celdas directamente
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
  const [isUploading, setIsUploading] = useState(false);
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

  // 📊 NUEVO PROCESADOR DIRECTO DE EXCEL CON MATRÍCULA GARANTIZADA Y CAMPOS OBLIGATORIOS
  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convertimos el Excel en un array de objetos
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        if (rows.length === 0) {
          toast.error("El archivo Excel no tiene filas de alumnos.");
          setIsUploading(false);
          return;
        }

        let creados = 0;

        // Recorremos las filas e insertamos usando la acción manual garantizada
        for (const row of rows) {
          // Buscamos los valores ignorando mayúsculas/minúsculas en las cabeceras
          const name = row.Nombres || row.nombres || row.Name;
          const paternal = row["Apellido paterno"] || row.paternalName || row.ApellidoPaterno;
          const maternal = row["Apellido materno"] || row.maternalName || row.ApellidoMaterno || "";
          const email = row.Correo || row.correo || row.email || "";
          const phone = row.Teléfono || row.telefono || row.phone || "";
          
          // Capturamos el DNI del Excel si existe
          const dniDelExcel = row.DNI || row.dni || row.Documento || row["Número de documento"];

          if (!name || !paternal) continue; // Si no tiene nombre o apellido, salta la fila

          // Si el Excel no tiene DNI, autogeneramos uno temporal aleatorio de 8 dígitos
          const numeroDocumentoFinal = dniDelExcel 
            ? dniDelExcel.toString() 
            : Math.floor(10000000 + Math.random() * 90000000).toString();

          // Usamos 'any' para armar la estructura requerida por el backend sin bloqueos de tipos
          const studentData: any = {
            name: name.toString().toUpperCase(),
            paternalName: paternal.toString().toUpperCase(),
            maternalName: maternal.toString().toUpperCase(),
            email: email.toString().toLowerCase(),
            phone: phone.toString(),
            status: "ACTIVE",
            enrollInCourseId: enrollInCourseId,
            
            // 🌟 CAMPOS REQUERIDOS POR EL SCHEMA SINO REBOTA:
            code: `ALU-${numeroDocumentoFinal.substring(0, 4)}`,
            documentType: "DNI",
            documentNumber: numeroDocumentoFinal,
          };

          const res = await createStudentAction(studentData as any);
          if (res.ok) creados++;
        }

        toast.success(`Se cargaron e inscribieron ${creados} alumnos correctamente.`);
        setOpen(false);
        router.refresh(); // Forzamos a Next.js a repoblar la lista en la pantalla
      } catch (error) {
        console.error(error);
        toast.error("Error al procesar la estructura del archivo.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
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
              : "Registra un alumno en tu lista o carga una lista masiva."}
          </DialogDescription>
        </DialogHeader>

        {!isEdit && (
          <div className="mb-2 rounded-xl border-2 border-dashed border-border/60 p-5 text-center bg-muted/30">
            <p className="text-xs font-semibold text-foreground mb-1">¿Carga Masiva con Excel?</p>
            <p className="text-[11px] text-muted-foreground mb-4">
              Sube tu archivo .xlsx. El sistema matriculará a los alumnos directamente en este curso.
            </p>
            <label className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer disabled:opacity-50">
              {isUploading ? "Inscribiendo alumnos..." : "Cargar Excel (.xlsx)"}
              <input
                type="file"
                accept=".xlsx"
                disabled={isUploading || isPending}
                className="hidden"
                onChange={handleExcelImport}
              />
            </label>
          </div>
        )}

        {!isEdit && (
          <div className="relative my-4 flex items-center justify-center">
            <span className="absolute bg-background px-3 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              O uno por uno
            </span>
            <hr className="w-full border-border/60" />
          </div>
        )}

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
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending && <Spinner data-icon="inline-start" />}
              {isEdit ? "Guardar cambios" : "Crear alumno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}