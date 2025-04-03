module.exports = {
  apps: [{
    name: 'price-updates',
    script: 'src/scripts/scheduledPriceUpdates.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/price-updates-error.log',
    out_file: 'logs/price-updates-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
} 