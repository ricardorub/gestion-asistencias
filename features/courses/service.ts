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

export async function createCourse(teacherId: string, data: CreateCourseDTO) {
  await assertCodeAvailable(teacherId, data.code);
  return repo.createCourse(teacherId, data);
}

export async function updateCourse(teacherId: string, data: UpdateCourseDTO) {
  await assertCourseOwned(teacherId, data.id);
  await assertCodeAvailable(teacherId, data.code, data.id);
  return repo.updateCourse(data);
}

export async function deleteCourse(teacherId: string, id: string) {
  await assertCourseOwned(teacherId, id);

  const openSessions = await repo.countOpenSessions(id);
  if (openSessions > 0) {
    throw new AppError(
      "CONFLICT",
      "No puedes eliminar un curso con una sesión de asistencia abierta.",
    );
  }

  return repo.softDeleteCourse(id);
}
