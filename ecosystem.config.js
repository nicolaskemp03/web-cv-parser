require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'konexa-cv-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: './backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001
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
        PORT: process.env.FRONTEND_PORT || 5173
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
