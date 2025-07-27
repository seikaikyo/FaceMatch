module.exports = {
  apps: [
    {
      name: 'facematch-backend',
      script: 'server.js',
      cwd: '/mnt/c/Users/yoshika/Documents/FaceMatch',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001,
        watch: true
      },
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '200M',
      restart_delay: 2000
    },
    {
      name: 'facematch-frontend',
      script: 'static-server.js',
      cwd: '/mnt/c/Users/yoshika/Documents/FaceMatch',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002,
        watch: true
      },
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '100M',
      restart_delay: 2000
    }
  ]
};