const fs = require('fs');
const path = require('path');

// Leer variables de entorno de forma nativa sin requerir paquetes externos (evita Error MODULE_NOT_FOUND)
let envConfig = {};
try {
  const envFile = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) envConfig[match[1]] = match[2].trim();
  });
} catch (e) {}

const backendPort = process.env.PORT || envConfig.PORT || 3001;
const frontendPort = process.env.FRONTEND_PORT || envConfig.FRONTEND_PORT || 5173;

module.exports = {
  apps: [
    {
      name: 'konexa-cv-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: './backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: backendPort
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'konexa-cv-frontend',
      script: 'npm',
      args: 'run start',
      cwd: './frontend',
      env_production: {
        NODE_ENV: 'production',
        PORT: frontendPort
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
