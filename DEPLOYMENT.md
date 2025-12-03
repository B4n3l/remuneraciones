# 🚀 Guía de Deployment - Vercel + Supabase

## Paso 1: Configurar Supabase

1. **Crear proyecto:**
   - Ve a https://supabase.com
   - Click en "New Project"
   - Nombre: `remuneraciones` (o el que prefieras)
   - Database Password: **Guarda esta contraseña** ⚠️
   - Region: Selecciona la más cercana (Brasil para Chile)
   - Click "Create new project"

2. **Obtener Connection String:**
   - En tu proyecto, ve a **Settings** → **Database**
   - Scroll hasta "Connection string"
   - Selecciona **"Transaction"** mode (no Session)
   - Copia el connection string, se ve así:
     ```
     postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```
   - Reemplaza `[YOUR-PASSWORD]` con la contraseña que guardaste

---

## Paso 2: Configurar Vercel

1. **Importar proyecto:**
   - Ve a https://vercel.com
   - Click "Add New" → "Project"
   - Importa desde Git (GitHub, GitLab, etc.)
   - Si no has subido el código a Git aún, primero necesitas hacerlo:

### Subir a GitHub (si aún no lo has hecho):

```bash
cd /Users/adolfo/Documents/dev/remuneraciones

# Inicializar git (si no está ya inicializado)
git init

# Agregar archivos
git add .
git commit -m "Initial commit - Sistema de Remuneraciones"

# Crear repositorio en GitHub y conectar
# (usa GitHub Desktop o la web de GitHub para crear el repo)
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

2. **Configurar variables de entorno en Vercel:**
   
   Durante el import, o en **Settings** → **Environment Variables**, agrega:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Tu connection string de Supabase |
   | `NEXTAUTH_URL` | `https://tu-app.vercel.app` (Vercel te lo da después del deploy) |
   | `NEXTAUTH_SECRET` | Genera uno con el comando de abajo |

   **Generar NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

3. **Deploy inicial:**
   - Click "Deploy"
   - Espera a que termine (2-3 minutos)
   - Copia la URL de tu app (ej: `https://remuneraciones-xxxx.vercel.app`)
   - **Actualiza** la variable `NEXTAUTH_URL` con esa URL
   - Redeploy si es necesario

---

## Paso 3: Ejecutar Migraciones en Supabase

**Desde tu terminal local:**

```bash
cd /Users/adolfo/Documents/dev/remuneraciones

# Configurar DATABASE_URL temporalmente (reemplaza con tu connection string)
export DATABASE_URL="postgresql://postgres.xxxxx:TU-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Ejecutar migraciones (crear tablas)
npx prisma migrate deploy

# Poblar datos iniciales (AFPs, UF, UTM, impuestos)
npx prisma db seed
```

---

## Paso 4: Crear tu Usuario SuperAdmin

1. **Registrarte en la app:**
   - Ve a tu URL de Vercel: `https://tu-app.vercel.app/register`
   - Regístrate con tu email y contraseña

2. **Cambiar rol a SuperAdmin:**
   - Ve a Supabase → **SQL Editor**
   - Ejecuta este SQL (reemplaza con tu email):
   
   ```sql
   UPDATE "User" 
   SET role = 'SUPER_ADMIN' 
   WHERE email = 'tu@email.com';
   ```

3. **Verificar:**
   - Logout y login de nuevo
   - Deberías ver el menú "Admin" en el sidebar

---

## Paso 5: Probar el Sistema

✅ Login funciona  
✅ Dashboard muestra estadísticas  
✅ Puedes crear una empresa nueva  
✅ Empresa aparece en la lista  

---

## 🔧 Troubleshooting

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correctamente configurada en Vercel
- Asegúrate de usar el connection string en modo "Transaction"
- Verifica que la contraseña sea correcta

### Error: "Invalid credentials" al login
- Verifica que `NEXTAUTH_SECRET` esté configurado
- Verifica que `NEXTAUTH_URL` sea tu URL de Vercel (no localhost)

### Error: Redirecciones o sesión no funciona
- Update `NEXTAUTH_URL` a tu URL real de Vercel
- Redeploy la aplicación

### Migraciones fallan
- Verifica que el connection string sea correcto
- Asegúrate de estar en el directorio del proyecto
- Verifica que Prisma esté instalado: `npm install`

---

## 📝 Comandos Útiles

```bash
# Ver logs de Vercel
vercel logs

# Forzar redeploy
git commit --allow-empty -m "Trigger redeploy"
git push

# Ver estado de la base de datos
npx prisma studio
```

---

## 🎯 Siguiente: Desarrollo Local

Una vez funcionando en producción, para desarrollo local:

1. Crea archivo `.env.local`:
   ```bash
   DATABASE_URL="postgresql://localhost:5432/remuneraciones"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="tu-secret-local"
   ```

2. O usa la misma DB de Supabase:
   ```bash
   DATABASE_URL="<tu-supabase-connection-string>"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<mismo-secret-de-vercel>"
   ```

3. Iniciar desarrollo:
   ```bash
   npm run dev
   ```

---

¡Listo! Tu sistema de remuneraciones estará funcionando en producción 🚀
