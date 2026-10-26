# Hostinger KVM 2 VPS Deployment & 3-Day Free Trial Guide

This guide walks you through deploying **PropStackly Real Estate CRM** on a **Hostinger KVM 2 VPS** and running the **3-Day Free Trial** business model to convert Pakistani real estate agencies into paying subscribers.

---

## 1. Purchasing the Hostinger KVM 2 VPS

### Recommended Specifications:
- **Plan**: Hostinger KVM 2 (2 vCPU Cores, 8 GB RAM, 100 GB NVMe Storage, 2 TB Bandwidth).
- **Location**: Choose **Mumbai (India)** or **Singapore** in Hostinger's panel for the lowest latency (~25–45ms ping to Islamabad, Lahore, Karachi).
- **Operating System**: Select **Ubuntu 24.04 LTS (64-bit)**.

---

## 2. Point Your Domain Name to Your Hostinger VPS

In your domain registrar (Hostinger, Namecheap, GoDaddy, Cloudflare):
1. Find your **Hostinger VPS Dedicated IPv4 Address** (e.g. `195.35.x.x`) in the Hostinger VPS dashboard.
2. Add an **A Record**:
   - **Type**: `A`
   - **Host / Name**: `app` (for `app.yourdomain.com`) or `@` (for root domain `yourdomain.com`)
   - **Points to / Value**: `Your_Hostinger_VPS_IP`
   - **TTL**: Automatic or 300 seconds

---

## 3. Upload Code to Hostinger VPS & Run 1-Click Deployment

### Step A: Connect to your VPS via SSH
Open your terminal and connect:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### Step B: Copy the Code to the Server
You can either upload the clean zip archive from your Mac:
```bash
# From your Mac terminal:
scp propstackly-crm-clean.zip root@YOUR_HOSTINGER_VPS_IP:/var/www/
```

Or clone your repository on the VPS:
```bash
# On the VPS:
mkdir -p /var/www/propstackly && cd /var/www/propstackly
unzip /var/www/propstackly-crm-clean.zip
```

### Step C: Execute the Automated Setup Script
```bash
cd /var/www/propstackly
sudo bash deploy-hostinger.sh
```

### What `deploy-hostinger.sh` automatically does:
1. Installs Node.js 20 LTS, Python 3, PostgreSQL 16, Nginx, Certbot, and PM2.
2. Creates the PostgreSQL production database `propstackly_crm` and user `propstackly_app`.
3. Creates a Python virtual environment and installs all backend dependencies.
4. Generates a cryptographically secure 64-character `SECRET_KEY`.
5. Compiles and builds the Next.js production frontend.
6. Sets up the `propstackly-backend` systemd service with Gunicorn (4 workers).
7. Sets up PM2 for the Next.js frontend with auto-restart on server reboot.
8. Configures Nginx with reverse proxy and unbuffered SSE stream support.
9. Automatically provisions a **free Let's Encrypt SSL certificate** with auto-renewal.

---

## 4. How the 3-Day Free Trial Works

PropStackly includes a built-in **3-Day Free Trial & Subscription Licensing Engine**:

### Trial Lifecycle:
1. **New Agency Registration**:
   - Whenever a client agency is created or signs up, their `subscription_status` is automatically set to `"trial"`.
   - Their `trial_ends_at` timestamp is set to **exactly 72 hours from creation**.
2. **Dashboard Countdown Badge**:
   - In the top navigation bar, consultants and agency owners see an active badge:
     `⏳ Trial: 2d 14h Left` with an **Upgrade** button.
   - When under 24 hours remain, the badge turns amber and highlights urgency.
3. **Graceful Trial Expiration (72 Hours Later)**:
   - When the 72-hour trial concludes, the agency status becomes expired:
     - **Data is NOT deleted**: Clients can still log in and view their previously entered leads, properties, and notes. This builds trust and prevents data loss panic.
     - **Write Operations Locked**: Attempting to create new leads, deals, or properties returns `HTTP 402 Payment Required` and displays the **Agency Upgrade Modal**.
     - A sticky top banner alerts them: *"3-Day Free Trial Concluded: New lead & deal creation is paused. Activate your license to continue."*
4. **Pakistani IBFT & WhatsApp Payment Modal**:
   - Clicking **Upgrade** or **Activate** opens the modal featuring:
     - **3 Pricing Tiers**: Starter (PKR 15,000/mo or PKR 144,000/yr), Growth (PKR 28,000/mo), Enterprise (PKR 55,000/mo).
     - **Bank Account Details (Meezan Bank IBFT / Raast)** with 1-click copy for Account Number and IBAN.
     - **1-Click WhatsApp Sales Button**: Pre-fills a WhatsApp message with their agency name and selected plan so they can send you their payment screenshot.
     - **Reference Code Input**: They can submit their IBFT transaction reference.
5. **Instant Admin / Owner Controls**:
   - In **Settings ➔ Agency License & Subscription Plan**, the agency owner has options to:
     - **Restart 3-Day Trial**: Gives them another 72 hours with 1 click (great for sales negotiations).
     - **Instant Pro Activation**: Activates full 12-month Pro access upon confirming payment.

---

## 5. Post-Deployment Checklist

1. **Verify Live Application**:
   Visit `https://app.yourdomain.com` in your browser. Verify the green padlock SSL icon.
2. **Change Default Credentials**:
   Sign in with `admin@propstackly.com` / `Admin123!` and change your password in **Settings ➔ Account Security**.
3. **Verify Service Health**:
   ```bash
   # Check backend daemon
   sudo systemctl status propstackly-backend

   # Check frontend daemon
   pm2 status

   # Check Nginx status
   sudo systemctl status nginx
   ```
4. **Setup Automated Database Backup (Daily Cron)**:
   Add a simple daily backup to `/etc/cron.daily/backup-propstackly`:
   ```bash
   sudo nano /etc/cron.daily/backup-propstackly
   ```
   Paste:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/var/backups/propstackly"
   mkdir -p $BACKUP_DIR
   sudo -u postgres pg_dump propstackly_crm | gzip > "$BACKUP_DIR/db-$(date +\%Y\%m\%d).sql.gz"
   find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete
   ```
   Make it executable:
   ```bash
   sudo chmod +x /etc/cron.daily/backup-propstackly
   ```

---

## 6. Useful Server Commands

| Action | Command |
| :--- | :--- |
| Restart Backend API | `sudo systemctl restart propstackly-backend` |
| View Backend Logs | `sudo journalctl -u propstackly-backend -f` |
| Restart Frontend | `pm2 restart propstackly-frontend` |
| View Frontend Logs | `pm2 logs propstackly-frontend` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Check Server Resource Usage | `htop` |
