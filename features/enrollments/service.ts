import { AppError } from "@/lib/errors";
import { assertCourseOwned } from "@/features/courses/service";
import * as repo from "./repository";

export async function enrollStudents(
  teacherId: string,
  courseId: string,
  studentIds: string[],
) {
  await assertCourseOwned(teacherId, courseId);

  // Solo matriculamos alumnos que pertenecen al profesor.
  const ownedIds = await repo.filterOwnedStudentIds(teacherId, studentIds);
  if (ownedIds.length === 0) {
    throw new AppError("VALIDATION", "Ningún alumno válido para matricular.");
  }

  const result = await repo.enrollMany(courseId, ownedIds);
  return { enrolled: result.count };
}

export async function removeStudent(
  teacherId: string,
  courseId: string,
  studentId: string,
) {
  await assertCourseOwned(teacherId, courseId);
  await repo.removeEnrollment(courseId, studentId);
}

export async function getEnrolledStudents(
  teacherId: string,
  courseId: string,
) {
  await assertCourseOwned(teacherId, courseId);
  return repo.listEnrolledStudents(courseId);
}

export async function getAvailableStudents(
  teacherId: string,
  courseId: string,
  q?: string,
) {
  await assertCourseOwned(teacherId, courseId);
  return repo.listAvailableStudents(teacherId, courseId, q);
}
