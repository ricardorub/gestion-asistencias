import { AppError } from "@/lib/errors";
import * as repo from "./repository";
import type { CreateCourseDTO, UpdateCourseDTO } from "./schema";

async function assertCodeAvailable(
  teacherId: string,
  code: string,
  excludeId?: string,
) {
  const existing = await repo.findByCode(teacherId, code);
  if (existing && existing.id !== excludeId) {
    throw new AppError("DUPLICATE", "Código duplicado.", {
      code: ["Ya tienes un curso con este código."],
    });
  }
}

/** Verifica propiedad del curso; lanza NOT_FOUND si no pertenece al profesor. */
export async function assertCourseOwned(teacherId: string, courseId: string) {
  const course = await repo.findCourseById(teacherId, courseId);
  if (!course) throw new AppError("NOT_FOUND", "Curso no encontrado.");
  return course;
}

// 1. CREAR CURSO (Nace en PENDING para que el docente lo reciba y acepte)
export async function createCourse(teacherId: string, data: CreateCourseDTO) {
  // Verificamos disponibilidad del código usando el teacherId asignado en el formulario
  await assertCodeAvailable(teacherId, data.code);
  
  // Guardamos el curso en el repositorio agregando el estado por defecto PENDING
  return repo.createCourse(teacherId, {
    ...data,
    status: "PENDING" // <-- Forzamos el estado de espera
  } as any);
}

// 2. MODIFICAR/ASIGNAR CURSO
export async function updateCourse(teacherId: string, data: UpdateCourseDTO) {
  // Eliminamos de forma temporal el assertCourseOwned para permitir que el Admin reasigne profesores
  await assertCodeAvailable(teacherId, data.code, data.id);
  
  // Al actualizar o cambiar de profesor, el curso regresa a PENDING para que el nuevo acepte
  return repo.updateCourse({
    ...data,
    status: "PENDING" // <-- Vuelve a requerir aceptación
  } as any);
}

// 3. ELIMINAR CURSO
export async function deleteCourse(teacherId: string, id: string) {
  const openSessions = await repo.countOpenSessions(id);
  if (openSessions > 0) {
    throw new AppError(
      "CONFLICT",
      "No puedes eliminar un curso con una sesión de asistencia abierta.",
    );
  }

  return repo.softDeleteCourse(id);
}