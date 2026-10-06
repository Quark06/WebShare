# Deployment

Requires Node.js 24+, npm and Git. Run the following commands on Linux. Choose either PM2 or Docker.

## PM2 deployment

```bash
git clone https://github.com/Quark06/WebShare.git
cd WebShare
cp .env.example .env
npm ci --include=dev
```

Edit `.env`. When using Nginx, set:

```dotenv
HOST=127.0.0.1
PORT=8080
```

Build and start:

```bash
npm run build
npm run pm2
```

Open `http://127.0.0.1:8080`. Check status, view logs or stop the service:

```bash
npm exec -- pm2 status
npm exec -- pm2 logs webshare --lines 50
npm exec -- pm2 stop webshare
```

Start on boot:

```bash
npm exec -- pm2 startup
# Run the sudo command printed above, then save:
npm exec -- pm2 save
```

## Domain and HTTPS

Point your domain's DNS records to the server and allow ports 80 and 443. Install Nginx on Ubuntu / Debian:

```bash
sudo apt update
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/webshare`, replacing the example domain:

```nginx
map $http_upgrade $webshare_connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name watch.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $webshare_connection_upgrade;
        proxy_read_timeout 300s;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/webshare /etc/nginx/sites-enabled/webshare
sudo nginx -t && sudo systemctl reload nginx
```

Install Certbot using its [installation guide](https://certbot.eff.org/instructions), then request an HTTPS certificate:

```bash
sudo certbot --nginx -d watch.example.com
```

Camera access and screen sharing require HTTPS.

## Docker deployment

Install [Docker Engine](https://docs.docker.com/engine/install/), clone the repository and copy `.env.example` to `.env`. Run from the project directory:

```bash
docker build -t webshare:local .
docker run -d \
  --name webshare \
  --restart unless-stopped \
  --env-file .env \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -p 127.0.0.1:8080:8080 \
  webshare:local
```

Use the Nginx configuration above. Pass `VITE_` settings at build time using `docker build --build-arg KEY=VALUE -t webshare:local .`.

## Updates

For PM2 deployments, run on a clean `master` branch:

```bash
npm run deploy
```

For Docker deployments:

```bash
git pull --ff-only origin master
docker build -t webshare:local .
docker stop webshare
docker rm webshare
```

Run the `docker run` command above again. Include the same `--build-arg` values when rebuilding. Without a database, rooms are lost on restart.
