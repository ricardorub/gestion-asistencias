# Gestor de Asistencias y Notas 🎓

Sistema web integral desarrollado para la gestión académica de profesores y administradores. Permite administrar cursos, estudiantes, matrículas, registro automatizado y manual de asistencias mediante códigos temporales, evaluación continua (notas por ponderación) y generación de reportes.

---

## 🚀 ¿Para qué sirve el programa?

El programa soluciona la gestión docente diaria simplificando y automatizando tareas clave:

- **Gestión de Estudiantes y Cursos:** Permite registrar estudiantes (con tipo y número de documento, nombres y apellidos) y vincularlos a múltiples cursos mediante matrículas.
- **Toma de Asistencia Automatizada y Manual:** Los profesores pueden aperturar sesiones de asistencia temporales que generan un código de acceso único. Los alumnos pueden registrar su asistencia desde una interfaz pública ingresando dicho código, o el profesor puede registrarla manualmente (Presente, Ausente, Tardanza).
- **Control de Evaluaciones y Calificaciones:** Definición de categorías de notas con ponderaciones personalizadas (porcentajes que suman 100%) por cada curso. Registro y cálculo automático de promedios ponderados.
- **Auditoría y Reportes:** Exportación de reportes académicos a Excel y registro de acciones del sistema (Audit Logs) para garantizar la trazabilidad.
- **Roles y Aprobación de Usuarios:** Sistema de usuarios con roles (`TEACHER` y `ADMIN`) y estado de aprobación de cuenta (`PENDING`, `APPROVED`, `REJECTED`).

---

## 🔄 Flujo del Sistema

El sistema opera mediante un flujo de trabajo estructurado en 6 etapas secuenciales:

1. **Registro y Aprobación de Accesos (Usuarios y Roles):**
   - El docente se registra en la plataforma y su cuenta entra automáticamente en estado pendiente (`PENDING`).
   - Un usuario Administrador (`ADMIN`) revisa la solicitud y aprueba (`APPROVED`) o rechaza (`REJECTED`) el acceso.
   - Una vez aprobada, el docente puede iniciar sesión y acceder a su panel de gestión académica.

2. **Configuración de Carga Académica (Cursos y Alumnos):**
   - El profesor crea sus asignaturas (cursos) especificando código, nombre y nota mínima de aprobación.
   - Registra a los estudiantes ingresando sus datos personales, tipo de documento (DNI, CE, Pasaporte) y número de identificación.

3. **Matrícula y Vinculación:**
   - El profesor realiza la matrícula asociando formalmente a los alumnos registrados con sus respectivos cursos asignados.

4. **Dinámica y Registro de Asistencias:**
   - **Apertura:** Al iniciar la clase, el docente crea una Sesión de Asistencia con un código único y un tiempo de expiración determinado.
   - **Registro Autónomo:** Los alumnos ingresan desde el portal público, digitan el código de la sesión y su documento para marcar su presencia (`PRESENT`).
   - **Control Manual:** En tiempo real, el profesor puede supervisar el registro y modificar o agregar estados manualmente (`ABSENT` o `LATE`).

5. **Evaluación y Registro de Calificaciones:**
   - El docente configura la estructura de evaluación definiendo categorías con porcentajes ponderados (cuya suma debe ser 100%).
   - Registra las notas individuales y el sistema calcula de forma automática el promedio final ponderado y el estado de aprobación del alumno.

6. **Consolidación de Datos y Exportación de Reportes:**
   - Tanto docentes como administradores pueden visualizar métricas y gráficos en el Dashboard.
   - Se pueden exportar reportes detallados de asistencia y calificaciones a archivos de Excel (`.xlsx`).

---

## 🛠️ Stack Tecnológico

### **Frontend & Framework**
- **[Next.js 16 (App Router)](https://nextjs.org/):** Framework principal React con Server Components, Server Actions y enrutamiento optimizado.
- **[React 19](https://react.dev/):** Biblioteca para la construcción de interfaces de usuario.
- **[Tailwind CSS v4](https://tailwindcss.com/):** Framework CSS utilitario de última generación.
- **[shadcn/ui](https://ui.shadcn.com/) & [Base UI](https://base-ui.com/):** Componentes UI accesibles y personalizables.
- **[Lucide React](https://lucide.dev/):** Iconografía moderna y ligera.
- **[Recharts](https://recharts.org/):** Visualización de datos y gráficos estadísticos en el Dashboard.

### **Backend, Base de Datos & Autenticación**
- **[PostgreSQL](https://www.postgresql.org/):** Base de datos relacional robusta.
- **[Prisma ORM 7](https://www.prisma.io/):** ORM tipado para la gestión de modelos, migraciones y consultas relacionales (`@prisma/client`, `@prisma/adapter-pg`).
- **[NextAuth.js v5 (Auth.js)](https://authjs.dev/):** Gestión de autenticación segura basada en sesiones/JWT.
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js):** Encriptación de contraseñas.
- **[Zod](https://zod.dev/):** Validación de esquemas de datos en cliente y servidor.

### **Gestión de Estado, Tablas y Utilidades**
- **[TanStack React Query v5](https://tanstack.com/query):** Manejo asíncrono de estado, caché y re-validación de datos.
- **[TanStack React Table v8](https://tanstack.com/table):** Construcción de tablas de datos avanzadas con ordenamiento y paginación.
- **[ExcelJS](https://github.com/exceljs/exceljs):** Lectura y generación de reportes descargables en formato `.xlsx`.
- **[Resend](https://resend.com/):** Infraestructura de envío de correos electrónicos transaccionales.
- **[Cloudinary](https://cloudinary.com/):** Gestión y almacenamiento de medios/archivos en la nube.
- **[Sonner](https://sonner.emilkowal.ski/):** Notificaciones toast fluidas para feedback al usuario.

---

## 🛠️ Comandos Principales

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:migrate

# Ejecutar seed de prueba
npm run db:seed

# Abrir Prisma Studio (Explorador GUI de DB)
npm run db:studio
```
