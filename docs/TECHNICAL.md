# Konexa CV Parser - Documentación Técnica

## Arquitectura del Sistema
El sistema es un **monorepo** compuesto por dos piezas fundamentales:
- **Backend (NestJS)**: Proveedor de la API REST, conexión a Base de Datos (PostgreSQL), inyección de dependencias, y orquestación de servicios externos (OpenAI, Teamtailor).
- **Frontend (React + Vite + TypeScript)**: Cliente de usuario final que interactúa con el backend para la gestión visual de currículums.

## Requisitos Previos
- Node.js v18 o superior.
- PostgreSQL en funcionamiento.
- PM2 (para entorno de producción).
- Cuenta de OpenAI (para API de procesamiento de lenguaje natural).
- Token de la API de Teamtailor (Región NA).

## Variables de Entorno (`.env`)
Se requiere un archivo `.env` en la raíz del backend con los siguientes parámetros:

```env
# Server Ports
PORT=3001
FRONTEND_PORT=5173

# URLs de Producción (Obligatorios en la nube)
# FRONTEND_URL indica a NestJS qué dominio debe aceptar en los permisos CORS y hacia dónde redirigir tras el Login.
FRONTEND_URL=https://cv.tudominio.com

# Fundamental para asegurar que PostgreSQL y NodeJS sincronicen correctamente fechas/horas
TZ=UTC

# Base de Datos (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/konexacv

# Auth y Seguridad
JWT_SECRET=tu_clave_secreta_super_segura
ADMIN_PASSWORD=contraseña_fuerte_para_admin

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Teamtailor
# Para la región norteamericana (api.na.teamtailor.com)
TEAMTAILOR_API_TOKEN=Bearer tu_token_aqui
```

## Variables de Entorno del Frontend (`frontend/.env`)
El frontend necesita saber la URL pública del backend para realizar las peticiones HTTP. Esta variable se inyecta en tiempo de compilación. Debes crear un archivo `.env` dentro de la carpeta `frontend/`:

```env
VITE_API_URL=https://api.tudominio.com/api
```

## Despliegue en Producción
El sistema está configurado para correr usando **PM2** y **Traefik** como proxy reverso para la capa SSL/TLS.

### Pasos de despliegue:
1. Descarga el repositorio al servidor.
2. Ejecuta `npm run install:all` para instalar automáticamente las dependencias raíz, de backend y de frontend.
3. Configura tu archivo `.env` en la raíz (usando `.env.example` como base).
4. Configura tu archivo `.env` dentro de `frontend/` (usando `frontend/.env.example` como base).
5. Ejecuta `npm run build:all` en la raíz (Compila Backend y Frontend).
6. Ejecuta `pm2 start ecosystem.config.js --env production` (Arranca ambos servicios mediante PM2).

### Rotación de Logs
Se recomienda instalar `pm2-logrotate` en el servidor host:
`pm2 install pm2-logrotate`
Esto evitará que los logs del motor de procesamiento inunden el almacenamiento de la máquina.

## Integración con Teamtailor
El servicio interactúa con la v1 de la API (`api.na.teamtailor.com`) en la versión de cabecera `20240404`. 
La búsqueda global utiliza una estrategia híbrida:
- Busca ID directo.
- Busca mediante `filter[email]` si existe el carácter `@`.
- Busca mediante `filter[phone]` si existen numéricos largos o el carácter `+`.
- Busca mediante memoria local en el Backend: Descarga los últimos ~210 candidatos en paralelo para búsquedas por nombres (debido a limitaciones técnicas nativas de la API de Teamtailor), aplicando filtros locales con un caché en RAM de 5 minutos (300,000 ms).
