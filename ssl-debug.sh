#!/bin/bash
# BurntAI SSL Certificate Debugging Script
# Let's find out why Let's Encrypt can't reach our server

echo "🔥 BURNTAI SSL DEBUGGING PROTOCOL 🔥"
echo "====================================="

# Check 1: Verify DNS resolution
echo "📡 CHECKING DNS RESOLUTION..."
echo "Your server IP: $(curl -s ifconfig.me)"
echo "burntai.com resolves to: $(nslookup burntai.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')"
echo "www.burntai.com resolves to: $(nslookup www.burntai.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')"
echo ""

# Check 2: Test if domain points to this server
echo "🎯 TESTING DOMAIN CONNECTIVITY..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(nslookup burntai.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')

if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
    echo "✅ DNS correctly points to this server"
else
    echo "❌ DNS MISMATCH! Domain points to $DOMAIN_IP but server is $SERVER_IP"
    echo "   Fix this in your domain registrar before continuing!"
fi
echo ""

# Check 3: Firewall status
echo "🛡️ CHECKING FIREWALL STATUS..."
sudo firewall-cmd --list-services
echo "HTTP allowed: $(sudo firewall-cmd --query-service=http && echo "YES" || echo "NO")"
echo "HTTPS allowed: $(sudo firewall-cmd --query-service=https && echo "YES" || echo "NO")"
echo ""

# Check 4: Nginx status and configuration
echo "🌐 CHECKING NGINX STATUS..."
echo "Nginx status: $(systemctl is-active nginx)"
echo "Nginx config test: $(sudo nginx -t 2>&1)"
echo ""

# Check 5: Test HTTP accessibility
echo "🧪 TESTING HTTP ACCESSIBILITY..."
curl -I http://burntai.com/ 2>/dev/null | head -1 || echo "❌ Can't reach http://burntai.com"
curl -I http://www.burntai.com/ 2>/dev/null | head -1 || echo "❌ Can't reach http://www.burntai.com"
echo ""

# Check 6: Test .well-known directory access
echo "📁 TESTING ACME CHALLENGE DIRECTORY..."
if [ -d "/var/www/burntai.com/html/.well-known" ]; then
    echo "✅ .well-known directory exists"
else
    echo "❌ .well-known directory missing - creating it..."
    sudo mkdir -p /var/www/burntai.com/html/.well-known/acme-challenge
    sudo chown -R nginx:nginx /var/www/burntai.com/html/.well-known
    sudo chmod -R 755 /var/www/burntai.com/html/.well-known
    echo "✅ Created .well-known directory"
fi

# Create a test file
echo "test" | sudo tee /var/www/burntai.com/html/.well-known/acme-challenge/test > /dev/null
echo "Testing ACME challenge accessibility..."
curl -s http://burntai.com/.well-known/acme-challenge/test || echo "❌ Can't access ACME challenge directory"
sudo rm -f /var/www/burntai.com/html/.well-known/acme-challenge/test
echo ""

# Check 7: SELinux status (common issue)
echo "🔒 CHECKING SELINUX STATUS..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    echo "SELinux status: $SELINUX_STATUS"
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "⚠️  SELinux is enforcing - this might block certbot"
        echo "   Checking if httpd_exec_tmp is allowed..."
        sudo setsebool -P httpd_exec_tmp 1 2>/dev/null || echo "   Failed to set httpd_exec_tmp"
    fi
else
    echo "SELinux not found (probably fine)"
fi
echo ""

# Check 8: Port connectivity from outside
echo "🌍 TESTING EXTERNAL CONNECTIVITY..."
echo "Testing if port 80 is reachable from outside..."
timeout 10 bash -c "</dev/tcp/$(curl -s ifconfig.me)/80" && echo "✅ Port 80 is open" || echo "❌ Port 80 is not reachable from outside"
echo ""

echo "🔧 DIAGNOSTIC SUMMARY"
echo "==================="
echo "If you see any ❌ above, fix those issues first!"
echo ""
echo "Most common fixes:"
echo "1. DNS not pointing to server - update A records in domain registrar"
echo "2. Firewall blocking HTTP - run: sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload"
echo "3. Cloud provider firewall - check your cloud provider's security groups/firewall"
echo "4. ISP blocking port 80 - some ISPs block this for residential IPs"
echo ""
echo "After fixing issues, retry with:"
echo "sudo certbot --nginx -d burntai.com -d www.burntai.com"
