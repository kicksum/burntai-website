#!/bin/bash
# Deep debugging and fix for nginx log permission issues

echo "🕵️ DEEP PERMISSION DEBUGGING 🕵️"
echo "================================"

# Check current permissions
echo "📁 Current permissions:"
ls -la /var/www/burntai.com/
ls -la /var/www/burntai.com/logs/
echo ""

# Check SELinux status and context
echo "🔒 SELinux Investigation:"
if command -v getenforce &> /dev/null; then
    echo "SELinux status: $(getenforce)"
    if [ "$(getenforce)" != "Disabled" ]; then
        echo "SELinux context of log directory:"
        ls -laZ /var/www/burntai.com/logs/
        echo ""
        echo "Expected nginx log context should be: httpd_log_t"
        echo "Current context on log files:"
        ls -Z /var/www/burntai.com/logs/*.log 2>/dev/null || echo "Log files don't exist or no context"
    fi
else
    echo "SELinux not found"
fi
echo ""

# Test if nginx user can actually write to the directory
echo "🧪 Testing nginx user write access:"
sudo -u nginx touch /var/www/burntai.com/logs/test.txt 2>&1 || echo "❌ nginx user cannot write to logs directory"
sudo rm -f /var/www/burntai.com/logs/test.txt 2>/dev/null

echo ""
echo "🔧 APPLYING FIXES..."
echo "==================="

# Fix 1: Set proper SELinux context if SELinux is enabled
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    echo "🔒 Fixing SELinux contexts..."
    
    # Set the correct SELinux context for web content and logs
    sudo setsebool -P httpd_can_network_connect 1
    sudo setsebool -P httpd_unified 1
    sudo semanage fcontext -a -t httpd_exec_t "/var/www/burntai.com(/.*)?"
    sudo semanage fcontext -a -t httpd_log_t "/var/www/burntai.com/logs(/.*)?"
    sudo restorecon -Rv /var/www/burntai.com/
    
    echo "✅ SELinux contexts fixed"
fi

# Fix 2: Alternative approach - use system log directory
echo "🔄 Creating alternative configuration with system logs..."

# Backup current config
sudo cp /etc/nginx/conf.d/burntai.com.conf /etc/nginx/conf.d/burntai.com.conf.broken

# Create new config using system log directory
sudo tee /etc/nginx/conf.d/burntai.com.conf > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name burntai.com www.burntai.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl;
    http2 on;
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

    # Security headers
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

    # Security: Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/burntai.com/html;
        allow all;
    }

    # Use system log directory (SELinux-friendly)
    access_log /var/log/nginx/burntai.com_access.log;
    error_log /var/log/nginx/burntai.com_error.log;
}
EOF

echo "✅ Created SELinux-friendly configuration using system logs"

# Fix 3: Ensure proper permissions on web directory
echo "📁 Fixing web directory permissions..."
sudo chown -R nginx:nginx /var/www/burntai.com/html/
sudo chmod -R 755 /var/www/burntai.com/html/
sudo find /var/www/burntai.com/html/ -type f -exec chmod 644 {} \;

# Test configuration
echo "🧪 Testing new configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration test passed!"
    
    # Try to start nginx
    echo "🚀 Starting nginx..."
    sudo systemctl start nginx
    
    if [ $? -eq 0 ]; then
        echo "🎉 SUCCESS! Nginx is running!"
        sudo systemctl enable nginx
        
        # Test the site
        echo "🧪 Testing site accessibility..."
        sleep 2
        curl -I https://burntai.com 2>/dev/null && echo "✅ HTTPS is working!" || echo "⚠️ HTTPS might need a moment"
        
        echo ""
        echo "📊 Final status:"
        sudo systemctl status nginx --no-pager -l
        
    else
        echo "❌ Still failed to start. Let's try one more approach..."
        
        # Nuclear option: minimal config
        echo "🔥 Trying minimal configuration..."
        sudo tee /etc/nginx/conf.d/burntai.com.conf > /dev/null << 'MINIMAL_EOF'
server {
    listen 80;
    server_name burntai.com www.burntai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name burntai.com www.burntai.com;
    root /var/www/burntai.com/html;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/burntai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/burntai.com/privkey.pem;

    location / {
        try_files $uri $uri/ =404;
    }
}
MINIMAL_EOF
        
        sudo nginx -t && sudo systemctl start nginx
        
        if [ $? -eq 0 ]; then
            echo "✅ Minimal config worked! Site is live!"
        else
            echo "❌ Even minimal config failed. Manual intervention needed."
            echo "🔍 Check: sudo journalctl -xeu nginx.service"
        fi
    fi
else
    echo "❌ Configuration test failed!"
    sudo nginx -t
fi

echo ""
echo "🔍 Troubleshooting commands if needed:"
echo "sudo journalctl -xeu nginx.service"
echo "sudo nginx -t"
echo "sudo setenforce 0  # Temporarily disable SELinux for testing"
echo "sudo tail -f /var/log/nginx/error.log"
