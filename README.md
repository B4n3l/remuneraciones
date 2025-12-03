# Sistema de Liquidación de Remuneraciones

Sistema web para la gestión y cálculo de liquidaciones de sueldo para empresas chilenas, con soporte multi-empresa y cálculos automáticos según la legislación laboral chilena.

## 🚀 Características

- **Multi-tenant:** Un usuario puede gestionar múltiples empresas
- **Autenticación:** Sistema de login seguro con NextAuth v5
- **Roles:** SuperAdmin y Usuario
- **Gestión de Empresas:** CRUD completo de empresas
- **Gestión de Trabajadores:** Registro de empleados con datos contractuales
- **Liquidaciones Automáticas:** Cálculo automático de:
  - AFP (pensiones)
  - Salud (Fonasa/Isapre)
  - Seguro de Cesantía
  - Impuesto Único
  - Gratificación Legal
  - Bonos y descuentos

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (vía Supabase)
- **ORM:** Prisma 5.22
- **Autenticación:** NextAuth v5
- **PDF:** @react-pdf/renderer
- **Validación:** Zod
- **Forms:** React Hook Form

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- PostgreSQL (local o Supabase)

## 🔧 Instalación Local

1. **Clonar el repositorio e instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env.local`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-aqui"
```

3. **Generar el cliente de Prisma:**

```bash
npx prisma generate
```

4. **Ejecutar migraciones:**

```bash
npx prisma migrate dev --name init
```

5. **Poblar datos iniciales (AFPs, valores UF/UTM, tabla de impuestos):**

```bash
npx prisma db seed
```

6. **Iniciar el servidor de desarrollo:**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Base de Datos

### Crear tu primer usuario SuperAdmin

Después de ejecutar las migraciones:

1. Regístrate normalmente en `/register`
2. Conéctate a tu base de datos (ej: Supabase SQL Editor)
3. Ejecuta:

```sql
UPDATE "User" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'tu-email@example.com';
```

## 🚢 Deployment en Vercel + Supabase

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings → Database y copia la Connection String (Transaction mode)
3. Guarda la URL de conexión para usar como `DATABASE_URL`

### 2. Configurar Vercel

1. Importa el proyecto en [Vercel](https://vercel.com)
2. Configura las variables de entorno:
   - `DATABASE_URL`: Tu connection string de Supabase
   - `NEXTAUTH_URL`: Tu URL de Vercel (ej: `https://tu-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Genera uno con `openssl rand -base64 32`

3. Deploy el proyecto

### 3. Ejecutar Migraciones en Producción

En tu terminal local:

```bash
# Establecer DATABASE_URL apuntando a Supabase producción
export DATABASE_URL="postgresql://..."

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales
npx prisma db seed
```

### 4. Crear SuperAdmin

Regístrate en la app y luego ejecuta el SQL en Supabase:

```sql
UPDATE "User" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'tu-email@example.com';
```

## 📁 Estructura del Proyecto

```
remuneraciones/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # NextAuth endpoints
│   │   └── companies/    # Company CRUD
│   ├── dashboard/        # Dashboard pages
│   │   ├── empresas/     # Company management
│   │   ├── trabajadores/ # Worker management
│   │   ├── liquidaciones/# Payroll management
│   │   ├── configuracion/# Configuration
│   │   └── admin/        # Super admin panel
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── db.ts            # Prisma client
│   └── payroll/         # Payroll calculation engine
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── types/               # TypeScript types
└── middleware.ts        # Route protection
```

## 💡 Uso

1. **Registrar una empresa:**
   - Ve a "Empresas" → "Nueva Empresa"
   - Ingresa RUT, Razón Social, Dirección y Comuna

2. **Agregar trabajadores:**
   - Selecciona una empresa
   - Ve a "Trabajadores" → "Nuevo Trabajador"
   - Completa datos personales, contractuales y de remuneración

3. **Crear liquidación:**
   - Ve a "Liquidaciones" → "Nueva Liquidación"
   - Selecciona período y empresa
   - Ingresa horas extra, bonos, descuentos
   - Click en "Calcular" para ver preview
   - Click en "Liquidar" para finalizar

4. **Generar PDF:**
   - En la liquidación finalizada, click en "Descargar PDF"

## 🔮 Pendientes (Fase 2)

- [ ] **Automatic UF/UTM Updates:** Integrar API mindicador.cl
- [ ] **Libro de Remuneraciones:** Reporte mensual consolidado
- [ ] **Email Notifications:** Envío automático de liquidaciones
- [ ] **Módulo de Trabajadores completo:** CRUD con todos los campos
- [ ] **Módulo de Liquidaciones completo:** Interfaz de cálculo y gestión
- [ ] **Configuración de AFP:** CRUD de administración
- [ ] **Configuración de Valores del Sistema:** Gestión de UF/UTM/Sueldo Mínimo
- [ ] **PDF Generation:** Implementación completa del template

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 🤝 Soporte

Para soporte, contactar al administrador del sistema.
