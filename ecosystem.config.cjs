module.exports = {
  apps: [
    {
      name: "senderi",
      script: "server/dist/index.js",
      cwd: ".",
      max_restarts: 100,
      min_uptime: "10s",
      autorestart: true,
      max_memory_restart: "500M",
      watch: false,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      merge_logs: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};

// Use `pm2 flush` to clear logs
