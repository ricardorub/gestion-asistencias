/**
 * Promedio ponderado. Pondera SOLO las evaluaciones ya calificadas
 * (re-normaliza los pesos), para mostrar un promedio parcial coherente
 * durante el ciclo. Función pura, sin dependencias: usable en cliente y
 * servidor, y testeable sin BD.
 */
export function weightedAverage(
  rows: { percentage: number; score: number | null }[],
): number | null {
  const graded = rows.filter((r) => r.score !== null);
  if (graded.length === 0) return null;
  const weightSum = graded.reduce((s, r) => s + r.percentage, 0);
  if (weightSum === 0) return null;
  const acc = graded.reduce((s, r) => s + (r.score as number) * r.percentage, 0);
  return Math.round((acc / weightSum) * 100) / 100;
}
