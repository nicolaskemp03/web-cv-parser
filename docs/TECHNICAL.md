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
# Configuración Base
PORT=3001
NODE_ENV=production
# Fundamental para asegurar que PostgreSQL y NodeJS sincronicen correctamente fechas/horas
TZ=UTC

# Base de Datos (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASS=password
DB_NAME=web_cv_parser

# Auth y Seguridad
JWT_SECRET=tu_clave_secreta_super_segura
ADMIN_PASSWORD=contraseña_fuerte_para_admin

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Teamtailor
# Para la región norteamericana (api.na.teamtailor.com)
TEAMTAILOR_API_TOKEN=Bearer tu_token_aqui
```

## Despliegue en Producción
El sistema está configurado para correr usando **PM2** y **Traefik** como proxy reverso para la capa SSL/TLS.

### Pasos de despliegue:
1. `npm run build:all` en la raíz (Compila Backend y Frontend).
2. `pm2 start ecosystem.config.js --env production` (Arranca ambos servicios, Backend en 3001, Frontend usando `serve` en 5173).

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
