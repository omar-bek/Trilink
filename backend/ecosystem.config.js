/**
 * PM2 Ecosystem Configuration
 * Production process manager configuration
 */

module.exports = {
  apps: [
    {
      name: 'trilink-backend',
      script: './dist/server.js',
      instances: 2, // عدد الـ instances (استخدم 'max' لاستخدام جميع الـ CPUs)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto restart settings
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Health monitoring
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
