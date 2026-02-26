
# Barber Shop — Web Profesional + Panel Admin Completo

## Visión General
Página web de barbería con estilo **urbano/street** (fondos oscuros, tipografía bold, acentos de color vibrante tipo neón o lima, formas geométricas) conectada a un backend Spring Boot externo. Dos áreas: landing pública para clientes y panel de administración protegido con JWT.

---

## Parte 1 — Landing Pública (lo que ven los clientes)

### Hero Section
- Imagen/video de fondo a pantalla completa con overlay oscuro
- Nombre "Barber Shop" en tipografía bold grande
- Botón CTA prominente: "Reservá tu turno"
- Animaciones de entrada suaves

### Sección de Servicios
- Tarjetas con nombre, precio, duración y descripción
- Datos traídos desde `GET /api/public/services`
- Diseño tipo grid con hover effects llamativos

### Galería de Trabajos
- Grid/masonry de imágenes desde `GET /api/public/gallery`
- Lightbox al hacer click en una imagen
- Filtro por categoría si hay categorías disponibles

### Sistema de Reserva de Turnos
- Flujo paso a paso: elegir servicio → elegir fecha → elegir horario disponible → datos del cliente → confirmar
- Consulta horarios ocupados con `GET /api/public/appointments/occupied`
- Envío del turno con `POST /api/public/appointments`
- Feedback visual claro de confirmación o error

### Sección de Ubicación / Contacto
- Información de contacto y mapa placeholder
- Links a redes sociales

### Navegación
- Navbar sticky con scroll suave a cada sección
- Menú hamburguesa en mobile

---

## Parte 2 — Panel de Administración

### Login
- Formulario email/password → `POST /api/auth/login`
- Token JWT almacenado y enviado en headers
- Ruta protegida: redirige a login si no hay sesión

### Dashboard Principal (Métricas)
- Cards con métricas de `GET /api/admin/metrics/overview` (turnos totales, pendientes, completados, clientes únicos, servicio popular)
- Gráficos de ingresos con Recharts desde `GET /api/admin/metrics/income`
- Desglose por servicio y entradas manuales
- Filtro por mes

### Gestión de Turnos
- Tabla/lista de turnos desde `GET /api/admin/appointments`
- Filtro por mes, paginación
- Cambiar estado (PENDING → CONFIRMED → COMPLETED / CANCELLED) con `PATCH .../status`
- Editar y eliminar turnos
- Sección de turnos pendientes estancados (`stale-pending`)

### Gestión de Clientes
- Tabla de clientes con total de citas y última visita
- Editar y eliminar clientes
- Función de fusionar clientes duplicados

### Gestión de Servicios
- CRUD completo de servicios (nombre, precio, duración, descripción, activo/inactivo)

### Gestión de Galería
- CRUD de imágenes con upload a Cloudinary (firma desde `/upload-signature`)
- Ordenamiento por sortOrder, toggle activo/inactivo

### Ingresos Manuales
- Crear, editar y eliminar entradas de ingreso manual
- Integrado en la vista de métricas

---

## Configuración Técnica
- URL base del backend configurable via variable de entorno (`.env` con `VITE_API_BASE_URL`)
- Cliente HTTP centralizado con interceptor para JWT
- Manejo global de errores (400, 422, 429)
- React Query para cache y estado del servidor
- Diseño 100% responsive
