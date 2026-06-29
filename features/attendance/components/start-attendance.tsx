"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon } from "lucide-react";
import { toast } from "sonner";
import { openSessionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TTL_OPTIONS: Record<string, string> = {
  "5": "5 minutos",
  "10": "10 minutos",
  "15": "15 minutos",
  "30": "30 minutos",
  "60": "1 hora",
};

export function StartAttendance({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [ttl, setTtl] = useState("15");
  const [isPending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const result = await openSessionAction({
        courseId,
        ttlMinutes: Number(ttl),
      });
      if (result.ok) {
        toast.success("Asistencia iniciada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={TTL_OPTIONS}
        value={ttl}
        onValueChange={(v) => setTtl(v ?? "15")}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TTL_OPTIONS).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={start} disabled={isPending}>
        {isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        Iniciar asistencia
      </Button>
    </div>
  );
}
