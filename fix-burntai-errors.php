<?php
// fix-burntai-errors.php - Run this to diagnose and fix common issues
// Place in /var/www/burntai.com/html/ and run: php fix-burntai-errors.php

echo "🔧 BurntAI Error Fixer\n";
echo "======================\n\n";

// 1. Check if functions exist in ai-config.php
echo "1. Checking if required functions exist...\n";
$configPath = __DIR__ . '/../config/ai-config.php';

// Create a minimal test version
$testConfig = '<?php
// Minimal test to check if functions exist
if (file_exists("' . $configPath . '")) {
    require_once("' . $configPath . '");
    
    $functions = ["checkRateLimit", "callAI", "getAIUsageStats", "callOpenAIShared", "callAnthropicShared"];
    foreach ($functions as $func) {
        if (function_exists($func)) {
            echo "   ✅ Function $func exists\n";
        } else {
            echo "   ❌ Function $func MISSING\n";
        }
    }
} else {
    echo "   ❌ Config file not found!\n";
}
';

eval($testConfig);

// 2. Test each API endpoint directly
echo "\n2. Testing API endpoints directly...\n";

// Test Neural Wasteland
echo "   Testing Neural Wasteland...\n";
$testData = json_encode(['message' => 'test', 'radiation' => 50]);
$ch = curl_init('http://localhost/api/neural-wasteland.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    echo "   ✅ Neural Wasteland responded with 200\n";
} else {
    echo "   ❌ Neural Wasteland returned HTTP $httpCode\n";
    if (strpos($response, '<') === 0) {
        echo "   ❌ PHP error detected - check PHP error logs\n";
    }
}

// 3. Common fixes
echo "\n3. Applying common fixes...\n";

// Fix 1: Ensure session directory exists and is writable
$sessionPath = '/var/lib/php/session';
if (!is_dir($sessionPath)) {
    echo "   ⚠️  Session directory missing - create with: sudo mkdir -p $sessionPath && sudo chmod 777 $sessionPath\n";
} elseif (!is_writable($sessionPath)) {
    echo "   ⚠️  Session directory not writable - fix with: sudo chmod 777 $sessionPath\n";
} else {
    echo "   ✅ Session directory OK\n";
}

// Fix 2: Check for common PHP errors
echo "\n4. Checking for common issues...\n";
$errorLog = '/var/log/httpd/error_log';
if (file_exists($errorLog)) {
    $lastErrors = shell_exec("tail -20 $errorLog | grep -i 'php\\|error\\|fatal'");
    if ($lastErrors) {
        echo "   Recent PHP errors found:\n";
        echo "   " . str_replace("\n", "\n   ", trim($lastErrors)) . "\n";
    } else {
        echo "   ✅ No recent PHP errors in Apache log\n";
    }
}

// 5. Generate missing functions if needed
echo "\n5. Creating patch file if functions are missing...\n";
$patchFile = __DIR__ . '/ai-config-patch.php';
$patchContent = '<?php
// Add this to the END of your ai-config.php if functions are missing

// Minimal getAIUsageStats if missing
if (!function_exists("getAIUsageStats")) {
    function getAIUsageStats() {
        return ["total_requests" => 0, "by_app" => []];
    }
}

// Minimal checkRateLimit if missing
if (!function_exists("checkRateLimit")) {
    function checkRateLimit($userId = null) {
        // Basic rate limit - always allow for testing
        return ["allowed" => true];
    }
}

// Minimal callAI if missing  
if (!function_exists("callAI")) {
    function callAI($prompt, $userMessage, $appName = "test", $overrides = []) {
        // This is just for testing - replace with real implementation
        return "Test response from AI system";
    }
}
';

file_put_contents($patchFile, $patchContent);
echo "   ✅ Created patch file at: $patchFile\n";
echo "   If functions are missing, append this to your ai-config.php\n";

// 6. Fix htaccess if needed
echo "\n6. Checking .htaccess...\n";
$htaccessPath = __DIR__ . '/.htaccess';
if (!file_exists($htaccessPath)) {
    echo "   ❌ .htaccess missing - creating...\n";
    $htaccess = 'RewriteEngine On

# Handle API routes
RewriteRule ^api/consciousness-fusion$ /api/consciousness-fusion.php [L]

# Force HTTPS (optional)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
';
    file_put_contents($htaccessPath, $htaccess);
    echo "   ✅ Created .htaccess\n";
} else {
    echo "   ✅ .htaccess exists\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "RECOMMENDED FIXES:\n";
echo "1. Check PHP error log: sudo tail -50 /var/log/httpd/error_log\n";
echo "2. Ensure ai-config.php has ALL required functions\n";
echo "3. Test API directly: curl -X POST http://localhost/api/neural-wasteland.php -H 'Content-Type: application/json' -d '{\"message\":\"test\"}'\n";
echo "4. If functions missing, append the patch file to ai-config.php\n";
echo "5. Restart Apache: sudo systemctl restart httpd\n";

// Cleanup
echo "\n⚠️  Delete this file when done: rm " . __FILE__ . "\n";
?>