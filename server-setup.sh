#!/bin/bash

# Hetzner Server Setup Script
# Run this ONCE on your Hetzner server to set everything up

echo "🔧 Setting up Octopus Tech on Hetzner Server..."

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python 3.11+
apt install -y python3 python3-pip python3-venv

# Install Nginx
apt install -y nginx

# Install PM2 for process management
npm install -g pm2

# Create deployment directory
mkdir -p /var/www/octopustech/frontend
mkdir -p /var/www/octopustech/backend

# Create Python virtual environment
cd /var/www/octopustech/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Set permissions
chown -R www-data:www-data /var/www/octopustech
chmod -R 755 /var/www/octopustech

# Create systemd service for backend
cat > /etc/systemd/system/octopustech-api.service << EOF
[Unit]
Description=Octopus Tech API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/octopustech/backend
Environment="PATH=/var/www/octopustech/backend/venv/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/var/www/octopustech/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable octopustech-api
systemctl start octopustech-api

# Setup Nginx configuration with performance optimizations
cat > /etc/nginx/sites-available/octopustech << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;  # Replace with your domain later

    # Gzip compression - CRITICAL for performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        application/font-woff
        application/font-woff2;

    # Increase client body size for file uploads
    client_max_body_size 10M;

    # Frontend
    location / {
        root /var/www/octopustech/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # Cache control for HTML
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static assets with aggressive caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        root /var/www/octopustech/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # Enable compression
        gzip_static on;
    }

    # Compressed files (gz, br)
    location ~* \.(js|css)\.(gz|br)$ {
        root /var/www/octopustech/frontend;
        gzip_static on;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Cache API responses
        proxy_cache_valid 200 5m;
    }

    # API Documentation
    location /api/docs {
        proxy_pass http://localhost:8000/api/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/octopustech /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Setup firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS in Namecheap:"
echo "   - A Record: @ → 91.99.78.37"
echo "   - A Record: www → 91.99.78.37"
echo "2. Wait 5-30 minutes for DNS propagation"
echo "3. Run: bash setup-dns-ssl.sh (or follow DNS_AND_SSL_SETUP.md)"
echo "4. Deploy your code using deploy-all.bat"

