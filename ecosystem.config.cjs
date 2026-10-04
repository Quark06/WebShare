module.exports = {
  apps: [
    {
      name: "webshare",
      cwd: __dirname,
      script: "server/server.ts",
      interpreter: process.execPath,
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
  ],
};
