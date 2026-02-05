module.exports = {
  apps: [
    {
      name: 'lens-choice',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      cwd: 'C:/Users/User/clawd/mobile-glass',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'print-server',
      script: 'scripts/print-server.js',
      cwd: 'C:/Users/User/clawd/mobile-glass',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
