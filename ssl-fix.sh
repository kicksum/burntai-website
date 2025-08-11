#!/bin/bash
# Fix nginx permissions and configure SSL

echo "🔥 FIXING NGINX PERMISSIONS & CONFIGURING SSL 🔥"
echo "================================================="

# Fix the immediate permission issue
echo "📁 Fixing log directory permissions..."
sudo mkdir -p /var/www/burntai.com/logs
sudo chown -R nginx:nginx /var/www/burntai.com
sudo chmod -R 755 /var/www/burntai.com
sudo chmod 755 /var/www/burntai.com/logs

# Create the log files with proper permissions
sudo touch /var/www/burntai.com/logs/access.log
sudo touch /var/www/burntai.com/logs/error.log
sudo chown nginx:nginx /var/www/burntai.com/logs/*.log
sudo chmod 644 /var/www/burntai.com/logs/*.log

echo "✅ Fixed permissions!"

# Check if SSL certificate exists
if [ -f "/etc/letsencrypt/live/burntai.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found!"
    
    # Create the SSL-enabled nginx configuration
    echo "⚙️ Creating SSL-enabled nginx configuration..."
    
    # Backup the current config
    sudo cp /etc/nginx/conf.d/burntai.com.conf /etc/nginx/conf.d/burntai.com.conf.backup
    
    # Create the new SSL configuration
    sudo tee /etc/nginx/conf.d/burntai.com.conf > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name burntai.com www.burntai.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name burntai.com www.burntai.com;
    root /var/www/burntai.com/html;
    index index.html index.htm;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/burntai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/burntai.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers (enhanced for HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors 'none';" always;

    # Hide Nginx version
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Security: Block access to hidden files and sensitive locations
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(wp-admin|wp-login|admin|administrator) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block common exploit attempts
    location ~* \.(php|asp|aspx|jsp)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/burntai.com/html;
        allow all;
    }

    # Log files
    access_log /var/www/burntai.com/logs/access.log;
    error_log /var/www/burntai.com/logs/error.log;
}
EOF

    echo "✅ SSL configuration created!"
else
    echo "❌ SSL certificate not found!"
    exit 1
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid!"
    
    # Start nginx
    echo "🚀 Starting nginx..."
    sudo systemctl start nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx started successfully!"
        
        # Enable nginx to start on boot
        sudo systemctl enable nginx
        
        # Check status
        echo "📊 Nginx status:"
        sudo systemctl status nginx --no-pager
        
        echo ""
        echo "🎉 SUCCESS! Your site should now be available at:"
        echo "🔒 https://burntai.com"
        echo "🔒 https://www.burntai.com"
        echo ""
        echo "HTTP traffic will automatically redirect to HTTPS!"
        
    else
        echo "❌ Failed to start nginx. Checking logs..."
        sudo journalctl -xeu nginx.service --no-pager
    fi
else
    echo "❌ Nginx configuration has errors. Please check the output above."
fi

# Set up automatic SSL renewal
echo "🔄 Setting up automatic SSL renewal..."
sudo crontab -l 2>/dev/null | grep -v "certbot renew" | sudo crontab -
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "✅ Automatic SSL renewal configured!"

# Final test
echo "🧪 Testing HTTPS connectivity..."
sleep 2
curl -I https://burntai.com 2>/dev/null | head -1 || echo "⚠️  HTTPS test failed - might need a moment to start"

echo ""
echo "🔥 DEPLOYMENT COMPLETE! Welcome to the encrypted wasteland! 🔥"
