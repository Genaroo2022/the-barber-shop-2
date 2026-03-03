# The Barber Shop 2

Proyecto de barbería con frontend React (estilos actuales conservados) y backend NestJS.

## Contexto operativo

- Este proyecto es administrado por una sola persona (owner único) y se ejecuta en una sola computadora.
- Aunque el contexto sea unipersonal, los cambios deben mantener criterios de seguridad (secretos, autenticación, validación y hardening) para evitar exposiciones accidentales.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: NestJS (estable) + TypeORM + PostgreSQL + JWT

## Funcionalidades

- Reserva pública de turnos
- Horarios ocupados reactivos (`/api/public/appointments/occupied`)
- Catálogo de servicios público y admin
- Galería pública y admin
- Subida múltiple y borrado múltiple de imágenes en `Admin > Galería`
- Resolución de colisiones de número de foto en galería con confirmación de intercambio
- Login admin con Google (Firebase ID token) y lista blanca de administradores autorizados
- Cierre de sesión automático cuando un administrador es desactivado en `Admin > Accesos`
- Gestión admin de turnos, clientes, ingresos manuales y métricas
- Gestión de accesos admin (alta/baja/activación de administradores autorizados)
- Merge de clientes por teléfono
- Detección de turnos pendientes estancados
- Webhook WhatsApp (verificación + recepción)
- Endpoint de health liviano (`/api/health`)
- Bloqueo de turnos en fecha/hora pasada (frontend + backend)
- Confirmación de borrado con modal (sin `window.confirm`)
- Validaciones de formularios en público y admin
- Redirección automática a WhatsApp al confirmar turno (si `VITE_WHATSAPP_BOOKING_PHONE` está configurado)

## Estructura

- `src/`: frontend
- `backend/`: backend NestJS

## Arranque rápido con Docker

```powershell
Copy-Item .env.docker.example .env
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Detener:

```powershell
docker compose down
```

## Docker para desarrollo (hot reload)

Para ver cambios automáticamente sin rebuild por cada edición:

```powershell
Copy-Item .env.docker.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Este modo monta el código como volumen y usa:
- Frontend: `vite dev` con watch/polling
- Backend: `nest start --watch`

Detener:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Ejecutar frontend

```powershell
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Ejecutar backend (NestJS)

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

Backend: `http://localhost:8080`

## Variables frontend

En `.env` (raíz):

```env
VITE_API_BASE_URL="http://192.168.1.15:8080"
VITE_LOGIN_PATH="/admin/login"
VITE_ADMIN_PATH="/admin"
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_APP_ID=""
VITE_WHATSAPP_BOOKING_PHONE=""
```

## Variables backend

Base en `backend/.env.example`.

Claves mínimas recomendadas:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `FIREBASE_PROJECT_ID` (para validar el ID token)
- `FIREBASE_WEB_API_KEY` (Web API Key del proyecto Firebase)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER`

Requisitos de seguridad aplicados:

- `JWT_SECRET` ahora es obligatorio, debe tener al menos 32 caracteres y no puede usar valores débiles/default.
- `BOOTSTRAP_ADMIN_ENABLED` queda en `false` por defecto.
- Si se habilita bootstrap admin, `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` son obligatorios.
- `BOOTSTRAP_ADMIN_PASSWORD` debe tener al menos 12 caracteres.

## Notas

- El backend corre migraciones SQL automáticamente al iniciar.
- Se conserva lo ya hecho en frontend y sus estilos; los cambios fueron solo de funcionalidad/comportamiento.
- Archivos Docker agregados: `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile.frontend`, `backend/Dockerfile`, `.env.docker.example`.

## Acceso admin y red local

- Login admin: `http://localhost:5173/admin/login`
- Login del panel: solo Google (Firebase popup)
- Solo ingresan cuentas Google que estén autorizadas como administradores activos en `Admin > Accesos`
- Acceso desde celular en la misma red:
  - Frontend: `http://192.168.1.15:5173`
  - Admin login: `http://192.168.1.15:5173/admin/login`

## Cambios recientes (marzo 2026)

- Navbar público sin enlace visible a Admin.
- Botón de marca en navbar con scroll al inicio.
- Ajuste visual del hero para evitar corte del título por navbar fijo.
- Menú hamburguesa móvil con área táctil amplia por item (fila completa).
- Redireccionamiento de navbar móvil corregido para secciones `Servicios` y `Contacto` con anclaje consistente en distintas pantallas.
- En Admin > Turnos, filtro de pendientes estancados cambiado a selector intuitivo por minutos.
- Manejo de errores de borrado:
  - Si cliente/servicio tiene turnos asociados, backend devuelve mensaje claro (400).
  - Frontend muestra toast descriptivo y modal de confirmación.
- En Admin (`Dashboard`, `Turnos`, `Clientes`, `Ingresos`) se eliminó el scroll horizontal en móvil.
- Selectores de mes en Admin estandarizados para mostrar mes/año completo sin recortes.
- Login admin UI simplificado a Google-only (sin inputs de usuario/contraseña).
- Nuevo módulo `Admin > Accesos` para gestionar administradores autorizados.
- Autorización Firebase endurecida: solo emails verificados y presentes en `admin_users` activos.
- Si un admin es desactivado en `Accesos`, su sesión activa queda invalidada y se redirige al login.
- Subida de galería con firma Cloudinary + fallback seguro por backend si falla la subida directa.
- `Admin > Galería` ahora permite subir múltiples imágenes de una sola vez.
- `Admin > Galería` ahora permite eliminar múltiples imágenes seleccionadas.
- En Galería, al repetir `Número de foto`, se muestra confirmación y se intercambian posiciones para evitar duplicados lógicos.
- Mejor legibilidad tipográfica en títulos de modales del panel admin sin cambiar la estética general.
- En `+ Ingreso manual`, los campos `Monto del servicio` y `Propina` ahora tienen etiquetas explícitas.

