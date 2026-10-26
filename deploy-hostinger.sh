#!/usr/bin/env bash
# ==============================================================================
# PropStackly CRM — Hostinger KVM 2 VPS 1-Click Automated Production Deployment
# Target OS: Ubuntu 24.04 LTS / Ubuntu 22.04 LTS (64-bit)
# Hardware: Hostinger KVM 2 (2 vCPU, 8 GB RAM, 100 GB NVMe SSD)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "================================================================================"
echo "      PropStackly CRM — Hostinger KVM 2 Automated Production Deployment         "
echo "================================================================================"
echo -e "${NC}"

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script with sudo or as root.${NC}"
  echo "Usage: sudo bash deploy-hostinger.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_USER="${SUDO_USER:-$(whoami)}"

echo -e "${BLUE}▶ [1/8] Verifying System Requirements & Hostinger Resources...${NC}"
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
CPU_CORES=$(nproc)
echo "Detected RAM: ${TOTAL_RAM_MB} MB"
echo "Detected CPU Cores: ${CPU_CORES}"

if [ "${TOTAL_RAM_MB}" -lt 3500 ]; then
  echo -e "${YELLOW}Warning: Recommended minimum RAM is 4096 MB. Proceeding with caution...${NC}"
fi

# Prompt for Domain & Admin Email
echo ""
echo -e "${YELLOW}--- Domain & SSL Configuration ---${NC}"
read -rp "Enter your production domain name (e.g. app.propstackly.com or yourdomain.com): " APP_DOMAIN
read -rp "Enter admin notification email for SSL renewal & alerts: " ADMIN_EMAIL
read -rp "Enter secure PostgreSQL database password [Press Enter to auto-generate]: " DB_PASSWORD

if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=$(openssl rand -hex 16)
  echo -e "${GREEN}Generated secure DB Password: ${DB_PASSWORD}${NC}"
fi

echo ""
echo -e "${BLUE}▶ [2/8] Updating System Packages & Installing Core Dependencies...${NC}"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl wget git build-essential ufw htop unzip software-properties-common \
  python3 python3-pip python3-venv python3-dev \
  postgresql postgresql-contrib \
  nginx certbot python3-certbot-nginx

# Install Node.js 20 LTS via NodeSource
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
  echo -e "${BLUE}Installing Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"

echo ""
echo -e "${BLUE}▶ [3/8] Setting Up Production PostgreSQL Database...${NC}"
systemctl start postgresql
systemctl enable postgresql

# Create Database and User
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'propstackly_crm'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE propstackly_crm;"

sudo -u postgres psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'propstackly_app') THEN
    CREATE ROLE propstackly_app WITH LOGIN ENCRYPTED PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE propstackly_app WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE propstackly_crm TO propstackly_app;"
sudo -u postgres psql -c "ALTER DATABASE propstackly_crm OWNER TO propstackly_app;"

echo -e "${GREEN}✓ PostgreSQL database 'propstackly_crm' configured successfully.${NC}"

echo ""
echo -e "${BLUE}▶ [4/8] Configuring Python Virtual Environment & Backend...${NC}"
cd "${APP_DIR}/backend"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# Activate and install python dependencies
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/pip install psycopg[binary] gunicorn uvicorn

# Configure backend .env
SECRET_KEY=$(openssl rand -hex 32)
cat <<EOF > .env
PROJECT_NAME="PropStackly CRM API"
VERSION="2.1.0"
API_V1_STR="/api/v1"
ENVIRONMENT="production"
SECRET_KEY="${SECRET_KEY}"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

DATABASE_URL="postgresql+psycopg://propstackly_app:${DB_PASSWORD}@127.0.0.1:5432/propstackly_crm"
BACKEND_CORS_ORIGINS='["https://${APP_DOMAIN}","http://${APP_DOMAIN}"]'

COOKIE_SECURE=True
COOKIE_SAMESITE="lax"
COOKIE_HTTPONLY=True

EMAILS_FROM_EMAIL="noreply@${APP_DOMAIN}"
EMAILS_FROM_NAME="PropStackly CRM Security"
FRONTEND_URL="https://${APP_DOMAIN}"
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=15
EOF

# Ensure upload directory exists
mkdir -p uploads/properties
chown -R "${CURRENT_USER}:${CURRENT_USER}" uploads

# Run Database Migrations
echo "Applying database schema & migrations..."
PYTHONPATH=. ./venv/bin/python -c "
from app.core.database import init_db_schema
init_db_schema()
print('✓ Database schema tables created.')
"

echo ""
echo -e "${BLUE}▶ [5/8] Creating Systemd Service for FastAPI Backend...${NC}"
cat <<EOF > /etc/systemd/system/propstackly-backend.service
[Unit]
Description=PropStackly Real Estate CRM FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${APP_DIR}/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --access-logfile - --error-logfile -
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable propstackly-backend
systemctl restart propstackly-backend

echo ""
echo -e "${BLUE}▶ [6/8] Building & Starting Next.js Production Frontend with PM2...${NC}"
cd "${APP_DIR}"

# Install frontend dependencies and build
npm ci --legacy-peer-deps || npm install
npm run build

# Start Next.js with PM2 under the deploy user
sudo -u "${CURRENT_USER}" pm2 delete propstackly-frontend 2>/dev/null || true
sudo -u "${CURRENT_USER}" pm2 start npm --name "propstackly-frontend" -- start -- -p 3000
sudo -u "${CURRENT_USER}" pm2 save

# Setup PM2 startup script on reboot
env PATH=$PATH:/usr/bin pm2 startup systemd -u "${CURRENT_USER}" --hp "/home/${CURRENT_USER}" 2>/dev/null || true

echo ""
echo -e "${BLUE}▶ [7/8] Configuring Nginx Reverse Proxy & Real-Time Stream Buffering...${NC}"
cat <<EOF > /etc/nginx/sites-available/propstackly
server {
    listen 80;
    server_name ${APP_DOMAIN};

    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Static Property Uploads
    location /uploads/ {
        alias ${APP_DIR}/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Real-Time SSE Stream (Disable Buffering)
    location /api/v1/notifications/stream {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # FastAPI REST Endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Next.js Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/propstackly /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Firewall Setup
echo -e "${BLUE}Configuring UFW Firewall (SSH, HTTP, HTTPS)...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo -e "${BLUE}▶ [8/8] Automated SSL Certificate Provisioning (Let's Encrypt)...${NC}"
echo "Attempting to issue automatic SSL certificate via Certbot for ${APP_DOMAIN}..."
if certbot --nginx -d "${APP_DOMAIN}" --non-interactive --agree-tos --email "${ADMIN_EMAIL}" --redirect; then
  echo -e "${GREEN}✓ SSL Certificate issued successfully! HTTPS is now active.${NC}"
else
  echo -e "${YELLOW}Warning: Automatic SSL check failed. If your DNS A-record hasn't propagated yet, run:${NC}"
  echo -e "  sudo certbot --nginx -d ${APP_DOMAIN}"
fi

echo ""
echo -e "${GREEN}================================================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! PropStackly CRM is LIVE on Hostinger KVM 2!                ${NC}"
echo -e "${GREEN}================================================================================${NC}"
echo ""
echo "Website URL:          https://${APP_DOMAIN}"
echo "API Documentation:    https://${APP_DOMAIN}/docs"
echo "Database:             PostgreSQL (localhost:5432/propstackly_crm)"
echo "Backend Service:      systemctl status propstackly-backend"
echo "Frontend Service:     pm2 status"
echo "3-Day Free Trial:     Active on all new agencies (72h countdown banner)"
echo ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "1. Change the default admin password (admin@propstackly.com) inside the CRM settings."
echo "2. Save your DB password in a safe place: ${DB_PASSWORD}"
echo "3. Test creating a lead, plot map, and advancing a deal."
echo ""
EOF
