module.exports = {
  apps: [
    {
      name: 'facematch-backend',
      script: 'dist/app.js',
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
        watch: false
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
      script: 'serve',
      args: '-s client/build -l 3000',
      cwd: '/mnt/c/Users/yoshika/Documents/FaceMatch',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production'
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