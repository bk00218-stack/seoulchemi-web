module.exports = {
  apps: [{
    name: 'mobile-glass',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: 'C:/Users/User/clawd/mobile-glass',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
