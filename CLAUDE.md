# CLAUDE.md — Directrices del proyecto LemAPP

Guía obligatoria para cualquier sesión de Claude Code en este repositorio.
**Léela completa antes de tocar código.**

---

## 1. Arquitectura

- **Monorepo de carpetas independientes** con un único repositorio git en la raíz.
  - `backend/` → API en **NestJS**.
  - `frontend/` → SPA en **Angular 21**.
- **No es un workspace pnpm**: cada carpeta gestiona sus propias dependencias.
- Trabaja cada lado por separado:
  - `pnpm -C backend <cmd>`
  - `pnpm -C frontend <cmd>`

## 2. Gestor de paquetes — REGLA ESTRICTA

- ✅ **USA `pnpm` SIEMPRE** para todo (instalar, ejecutar, scripts, binarios efímeros con `pnpm dlx`).
- 🚫 **PROHIBIDO usar `npm` o `npx`.** El proyecto fuerza pnpm (`.npmrc` con `engine-strict`, `packageManager: pnpm@11.x`). Mezclar npm rompe el lockfile y las builds aprobadas.
- Para correr comandos en una subcarpeta usa `pnpm -C <dir>` en lugar de `cd`.

## 3. Frontend (`frontend/`)

- **Angular 21**, 100% **standalone components** (sin NgModules).
- **Estilos**: **Tailwind CSS v4** (`@import "tailwindcss";`, sin `tailwind.config.js`) + plugin `tailwindcss-primeui` para colores `surface-*`/`primary-*`.
- **Componentes UI**: **PrimeNG 21** en **modo styled** con preset **Aura** (`@primeuix/themes`), configurado vía `providePrimeNG(...)` en `app.config.ts`. **Nunca** importes los CSS monolíticos antiguos.
- **Reactividad**: usa **signals** y control flow `@if` / `@for`.
- **Naming flat de Angular 21**: archivos sin sufijo `.component`/`.service` (ej. `login.ts`, `auth.ts`, clases `Login`, `Auth`). Respeta esta convención.
- **HTTP**: `provideHttpClient(withFetch(), withInterceptors([jwtInterceptor]))`.

## 4. Backend (`backend/`)

- **NestJS 11** + **Prisma 7 (ORM)** + **PostgreSQL**.
- Validación global con `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`): los DTOs no aceptan campos extra.
- Corre en el puerto **3000** (sin prefijo global de rutas).
- El backend **ya funciona**: no lo reestructures ni rompas sin una razón explícita del usuario.

## 5. Seguridad

- **Autenticación JWT** + **control de roles (RBAC)**: guard JWT global + `@Roles()` / `RolesGuard`. Rutas públicas marcadas con `@Public()`.
- **CORS** restringido al origen del frontend (`http://localhost:4200`), nunca `*`.
- Frontend blindado: `authGuard`/`guestGuard` en rutas + `jwtInterceptor` (añade `Bearer` y desloga ante 401, excepto en `/auth/login`).
- 🔐 **Nunca** subas secretos: `.env` está en `.gitignore`; usa `.env.example` para plantillas.

## 6. Verificación

- Frontend: `pnpm -C frontend exec ng build` debe compilar sin errores.
- Backend: `pnpm -C backend build` / `pnpm -C backend test`.
