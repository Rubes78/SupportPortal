module.exports = {
  apps: [
    {
      name: 'support-portal',
      script: './node_modules/.bin/next',
      args: 'dev --hostname 0.0.0.0 --port 3001',
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: '3001',
      },
    },
  ],
}
