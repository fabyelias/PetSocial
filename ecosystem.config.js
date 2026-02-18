module.exports = {
  apps: [
    {
      name: 'petsocial-web',
      cwd: '/var/www/petsocial/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
