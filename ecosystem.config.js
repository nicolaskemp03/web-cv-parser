module.exports = {
  apps: [
    {
      name: 'konexa-cv-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: './backend',
      env_production: {
        NODE_ENV: 'production'
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
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
