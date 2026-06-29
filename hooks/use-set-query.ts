"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Actualiza los searchParams de la URL. Pasar `null`/`""` elimina la clave.
 * Conserva el resto de parámetros existentes.
 *
 * La identidad del callback es estable (no depende de searchParams) para no
 * provocar bucles cuando se usa dentro de un useEffect.
 */
export function useSetQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mantenemos los params actuales en un ref para no recrear el callback.
  const paramsRef = useRef(searchParams);
  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);

  return useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(paramsRef.current.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
}
