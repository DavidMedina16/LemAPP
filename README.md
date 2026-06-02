# LemAPP

**SaaS de gestión integral para firmas contables.**

LemAPP centraliza la operación diaria de una firma o despacho contable: administración
**multi-empresa**, gestión de **tareas**, **facturación** (con notificaciones por
**WhatsApp**) y un esquema de **roles** (administradora / secretaria) que delimita qué
puede hacer cada persona.

> El objetivo es que una contadora deje de saltar entre hojas de cálculo, chats y
> carpetas: una sola plataforma para sus empresas clientes, su equipo y su facturación.

---

## 🧩 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 21 (standalone), Tailwind CSS v4, PrimeNG 21 (styled / Aura) |
| **Backend** | NestJS 11, Prisma ORM 7 |
| **Base de datos** | PostgreSQL |
| **Autenticación** | JWT + control de roles (RBAC) |
| **Gestor de paquetes** | pnpm (uso estricto — `npm` está prohibido) |
| **Arquitectura** | Monorepo (`backend/` + `frontend/`), un solo repositorio git |

---

## 📦 Estructura del repositorio

```
LemAPP/
├── backend/     # API NestJS + Prisma + PostgreSQL (JWT, RBAC)
├── frontend/    # SPA Angular 21 + Tailwind v4 + PrimeNG
├── CLAUDE.md    # Directrices arquitectónicas del proyecto
└── README.md
```

---

## 🚦 Estado Actual del Proyecto

**Backend — blindado y funcional** ✅
- Módulos: autenticación, usuarios, empresas (companies), facturación (invoices).
- Seguridad: **JWT** con guard global + **RBAC** (roles `administradora` / `secretaria`).
- Validación estricta de entrada (`ValidationPipe` con whitelist) y CORS restringido.
- Esquema y migraciones con Prisma + datos de ejemplo vía seed.

**Frontend — login + cascarón del panel** ✅
- **Login** con formulario reactivo (PrimeNG) conectado al backend.
- **Protección de rutas**: `authGuard` / `guestGuard` + **interceptor JWT** (añade el
  `Bearer token` y cierra sesión automáticamente ante un 401).
- **Cascarón del Dashboard** con sidebar de navegación (Inicio, Empresas, Tareas,
  Facturación) y `<router-outlet>` para las pantallas hijas.

**Siguiente** 🔜 — Construir las pantallas hijas del dashboard (Empresas, Tareas,
Facturación) consumiendo los módulos del backend.

---

## 🚀 Cómo empezar

### Prerrequisitos
- **Node.js** y **pnpm** instalados (`npm install -g pnpm` solo para obtener pnpm; a
  partir de ahí, **siempre pnpm**).
- Una instancia de **PostgreSQL** en ejecución.

### 1. Configurar el backend
```bash
cd backend
cp .env.example .env          # y completa DATABASE_URL, JWT_SECRET, etc.
pnpm install
pnpm db:seed                  # crea roles y usuarios de ejemplo
```

### 2. Configurar el frontend
```bash
cd frontend
pnpm install
```

### 3. Levantar la aplicación (en dos terminales separadas)

**Terminal 1 — Backend** (queda en `http://localhost:3000`):
```bash
cd backend && pnpm start:dev
```

**Terminal 2 — Frontend** (queda en `http://localhost:4200`):
```bash
cd frontend && pnpm start
```

Abre **http://localhost:4200** e inicia sesión.

### Credenciales de prueba (del seed)
| Rol | Correo | Contraseña |
|---|---|---|
| Administradora | `developer03@pops.com.co` | `Admin1234*` |
| Secretaria | `secretaria@lemapp.test` | `Secret1234*` |

---

## 📐 Convenciones

Las reglas de arquitectura, estilo y seguridad del proyecto están en
[`CLAUDE.md`](./CLAUDE.md). En resumen: **pnpm siempre**, componentes standalone +
signals en el frontend, y no romper el backend que ya funciona.
