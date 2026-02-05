-- ============================================
-- Portal de Clientes - Migración de Roles y Documentos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Actualizar el enum UserRole
-- NOTA: En PostgreSQL, no se puede simplemente renombrar valores de enum
-- Primero creamos el nuevo tipo, migramos los datos, y eliminamos el viejo

-- Crear nuevo enum con los valores correctos
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'CONTADOR', 'CLIENTE');

-- Actualizar la columna role: USER -> CONTADOR
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" 
  USING (CASE "role"::text 
    WHEN 'USER' THEN 'CONTADOR'::"UserRole_new"
    WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"UserRole_new"
    ELSE 'CONTADOR'::"UserRole_new"
  END);

-- Eliminar el enum viejo y renombrar el nuevo
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Actualizar el default
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CONTADOR'::"UserRole";

-- ============================================
-- 2. Crear tabla de Categorías de Documentos
-- ============================================

CREATE TABLE "CategoriaDocumento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaDocumento_pkey" PRIMARY KEY ("id")
);

-- Índice único para nombre
CREATE UNIQUE INDEX "CategoriaDocumento_nombre_key" ON "CategoriaDocumento"("nombre");

-- ============================================
-- 3. Crear tabla de Documentos de Cliente
-- ============================================

CREATE TABLE "DocumentoCliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "periodo" TEXT,
    "empresaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoCliente_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "DocumentoCliente" ADD CONSTRAINT "DocumentoCliente_empresaId_fkey" 
    FOREIGN KEY ("empresaId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentoCliente" ADD CONSTRAINT "DocumentoCliente_categoriaId_fkey" 
    FOREIGN KEY ("categoriaId") REFERENCES "CategoriaDocumento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoCliente" ADD CONSTRAINT "DocumentoCliente_subidoPorId_fkey" 
    FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Índices para búsqueda eficiente
CREATE INDEX "DocumentoCliente_empresaId_categoriaId_idx" ON "DocumentoCliente"("empresaId", "categoriaId");
CREATE INDEX "DocumentoCliente_empresaId_idx" ON "DocumentoCliente"("empresaId");
CREATE INDEX "DocumentoCliente_categoriaId_idx" ON "DocumentoCliente"("categoriaId");

-- ============================================
-- 4. Insertar categorías por defecto
-- ============================================

INSERT INTO "CategoriaDocumento" ("id", "nombre", "descripcion", "orden") VALUES
    ('cat_liquidaciones', 'Liquidaciones', 'Liquidaciones de sueldo mensuales', 1),
    ('cat_f29', 'F29', 'Formulario 29 - IVA mensual', 2),
    ('cat_f22', 'F22', 'Declaración anual de renta', 3),
    ('cat_balances', 'Balances', 'Balances contables', 4),
    ('cat_certificados', 'Certificados', 'Certificados laborales, AFP, etc.', 5),
    ('cat_contratos', 'Contratos', 'Contratos de trabajo', 6),
    ('cat_otros', 'Otros', 'Documentos varios', 99);

-- ============================================
-- Listo! Verifica que todo se creó correctamente:
-- SELECT * FROM "CategoriaDocumento";
-- ============================================
