import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido."),
  password: z.string().min(8, "Mínimo 8 caracteres."),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres para el nombre."),
  email: z.string().email("Correo inválido."),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres."),
});

export type RegisterDTO = z.infer<typeof registerSchema>;

