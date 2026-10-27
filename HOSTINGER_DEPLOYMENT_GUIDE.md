# 🚀 Bakasur Ka Food Tour - Hostinger Deployment Guide

This guide walks you step-by-step through deploying this Next.js full-stack application on **Hostinger** (hPanel Node.js Web Hosting, Cloud Hosting, or Hostinger VPS).

---

## 🔒 1. Pre-Deployment Security Check (Completed)

Before creating the deployment zip, the following security checks were strictly enforced:
- [x] **No sensitive environment files included**: `.env`, `.env.local`, `.env.production` were completely excluded from the zip archive.
- [x] **No bulky development directories**: `node_modules`, `.git`, `scratch/` (test scripts), `scripts/` (image processing utilities), and local build caches (`.next`, `.tsbuildinfo`) were excluded to ensure a fast, clean, and secure deployment.
- [x] **Template configuration prepared**: A sanitized [.env.example](file:///.env.example) is included with all required environment keys.
- [x] **Database schemas prepared**: Clean, secure [schema.sql](file:///schema.sql) and [schema_1.sql](file:///schema_1.sql) are included without hardcoded secrets.
- [x] **Custom server entry point**: [server.js](file:///server.js) is provided for Hostinger Node.js Application Manager compatibility.

---

## 🗄️ 2. Step 1: Create and Configure MySQL Database on Hostinger

1. Log into your **Hostinger hPanel**.
2. Go to **Databases** -> **MySQL Databases**.
3. Create a new database:
   - **Database Name**: e.g., `u123456789_bakasur`
   - **Database Username**: e.g., `u123456789_admin`
   - **Password**: Enter a strong password (save this safely).
4. Click **Create**.
5. Once created, click **Enter phpMyAdmin** next to your new database.
6. In phpMyAdmin, click the **Import** tab at the top.
7. Click **Choose File**, select `schema.sql` (or `schema_1.sql`), and click **Go** (or **Import** at the bottom).
8. Your tables (`restaurants`, `dishes`, `categories`, `locations`, `campaign_sessions`, etc.) will be created and seeded.

---

## 📦 3. Step 2: Upload Files to Hostinger

### Option A: Using Hostinger File Manager
1. In hPanel, go to **Files** -> **File Manager**.
2. Navigate to your application root directory (e.g., `public_html` or your subdomain folder).
3. Upload `bakasur-food-tour-hostinger.zip`.
4. Right-click the uploaded `.zip` file and select **Extract**.
5. Delete the `.zip` file after extraction to save disk space.

### Option B: Using SSH / SCP / SFTP
```bash
# Upload via SCP to your server
scp bakasur-food-tour-hostinger.zip user@your-server-ip:/path/to/app/

# On the server:
unzip bakasur-food-tour-hostinger.zip
```

---

## ⚙️ 4. Step 3: Configure Environment Variables (.env)

On your Hostinger server (via File Manager or Terminal/SSH):
1. In the project root, create a file named `.env`.
2. Copy the template from `.env.example` and paste your production credentials:

```ini
# Hostinger MySQL Database Credentials
# On Hostinger shared/cloud hosting, host is usually 'localhost' or '127.0.0.1'
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=u123456789_admin
MYSQL_PASSWORD=YourStrongDatabasePasswordHere
MYSQL_DATABASE=u123456789_bakasur

# App Domain URL (with https://)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Admin Dashboard Authentication (Set your own secure credentials!)
ADMIN_USERNAME=your_admin_name
ADMIN_PASSWORD=your_strong_admin_password
# Optional: long random string used to sign admin session cookies
ADMIN_SESSION_SECRET=

# Optional: Google Places API Key (leave empty if not using)
GOOGLE_PLACES_API_KEY=

# Optional: Apify Swiggy Actor Token (leave empty if not using)
APIFY_TOKEN=
APIFY_SWIGGY_ACTOR=thirdwatch/swiggy-scraper
```

> ⚠️ **IMPORTANT**: Never commit or share your `.env` file! Always ensure `ADMIN_PASSWORD` is changed from the default.
>
> 🔐 **Admin security:** In production there is **no default admin password**. Admin login stays disabled until `ADMIN_PASSWORD` is set. Every `/api/admin/*` endpoint (participants export, CRUD, seed) requires a signed, expiring admin session cookie. Changing `ADMIN_PASSWORD` (or `ADMIN_SESSION_SECRET`) logs out all existing admin sessions.
>
> 🚫 **Never** prefix a secret with `NEXT_PUBLIC_`. Those variables are bundled into the browser JavaScript and become public.

---

## 🚀 5. Step 4: Install Dependencies & Run the App

### Scenario A: Hostinger Cloud / Web Hosting (hPanel Node.js Selector)
1. Go to **Advanced** -> **Node.js** in hPanel.
2. Select:
   - **Node.js version**: `20.x` or `18.x`
   - **Application mode**: `Production`
   - **Application root**: Path where files were extracted (e.g. `public_html` or subfolder)
   - **Application URL**: Your domain or subdomain
   - **Application startup file**: `server.js`
3. Click **Create** / **Save**.
4. Open the **Terminal** or SSH into Hostinger, navigate to your app directory, and run:
   ```bash
   npm install --omit=dev
   npm run build
   ```
5. Click **Restart** in the Node.js selector in hPanel.

---

### Scenario B: Hostinger VPS (Ubuntu / Debian with PM2 & Nginx)
1. SSH into your VPS:
   ```bash
   ssh root@your-server-ip
   cd /var/www/bakasur
   ```
2. Install Node.js (if not already installed, Node 20 recommended):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Install production dependencies and build:
   ```bash
   npm install --omit=dev
   npm run build
   ```
4. Start with PM2 process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "bakasur"
   pm2 save
   pm2 startup
   ```
5. Set up Nginx reverse proxy (standard proxy pass to `http://127.0.0.1:3000`) and SSL:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔍 6. Post-Deployment Verification Checklist

- [ ] Visit `https://yourdomain.com/` - Verify home page and interactive cards load.
- [ ] Test Location & Search - Verify restaurants and dishes populate.
- [ ] Visit `https://yourdomain.com/admin/login` - Verify admin authentication with credentials defined in `.env`.
- [ ] Check Database Connectivity - Verify restaurants and dishes queries return results from MySQL.
- [ ] Inspect SSL (HTTPS) certificate to ensure all assets load securely.
