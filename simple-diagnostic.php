<?php
// simple-diagnostic.php - Quick diagnostic for BurntAI
// Run: php simple-diagnostic.php

echo "\n🔍 BurntAI Quick Diagnostic\n";
echo "===========================\n\n";

// 1. Check config file
echo "1. Checking config file...\n";
$configPath = realpath(__DIR__ . '/../config/ai-config.php');
if (file_exists($configPath)) {
    echo "   ✅ Found: $configPath\n";
    $configContent = file_get_contents($configPath);
    $configSize = filesize($configPath);
    echo "   📏 Size: $configSize bytes\n";
    
    // Check if it has functions or just config
    if (strpos($configContent, 'function checkRateLimit') !== false) {
        echo "   ✅ Contains checkRateLimit function\n";
    } else {
        echo "   ❌ Missing checkRateLimit function\n";
    }
    
    if (strpos($configContent, 'function callAI') !== false) {
        echo "   ✅ Contains callAI function\n";
    } else {
        echo "   ❌ Missing callAI function\n";
    }
    
    if ($configSize < 1000) {
        echo "   ⚠️  Config file seems too small - probably missing functions\n";
    }
} else {
    echo "   ❌ Config not found at: $configPath\n";
}

// 2. Test a simple API call
echo "\n2. Testing Neural Wasteland API...\n";
$testUrl = 'http://localhost/api/neural-wasteland.php';
$testData = json_encode(['message' => 'test']);

$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "   HTTP Code: $httpCode\n";
if ($error) {
    echo "   CURL Error: $error\n";
}

if ($httpCode == 500) {
    echo "   ❌ Server error (500) - PHP is crashing\n";
    
    // Try to parse error from response
    if (strpos($response, 'Fatal error') !== false) {
        preg_match('/Fatal error: (.+?) in/', $response, $matches);
        if (isset($matches[1])) {
            echo "   Error: " . $matches[1] . "\n";
        }
    }
    
    if (strpos($response, 'Call to undefined function') !== false) {
        echo "   ❌ Missing function error detected\n";
        echo "   Your ai-config.php is incomplete!\n";
    }
}

// Check nginx error log
echo "\n3. Checking nginx error log...\n";
$nginxLogs = [
    '/var/log/nginx/error.log',
    '/var/log/nginx/burntai.com.error.log'
];

foreach ($nginxLogs as $logPath) {
    if (file_exists($logPath)) {
        echo "   Found log: $logPath\n";
        $lastErrors = shell_exec("tail -10 $logPath | grep -i 'php\\|error\\|fatal' 2>/dev/null");
        if ($lastErrors) {
            echo "   Recent errors:\n   " . str_replace("\n", "\n   ", trim($lastErrors)) . "\n";
        }
        break;
    }
}

// 3. Show solution
echo "\n📋 DIAGNOSIS COMPLETE\n";
echo "====================\n";

if ($httpCode == 500 || strpos($response, 'Call to undefined function') !== false) {
    echo "\n❌ PROBLEM: Your ai-config.php file is incomplete.\n";
    echo "It's missing the required functions.\n\n";
    echo "✅ SOLUTION: You need the COMPLETE ai-config.php file.\n";
    echo "The file should be about 7-10KB and contain:\n";
    echo "- \$AI_CONFIG array (configuration)\n";
    echo "- checkRateLimit() function\n";
    echo "- callAI() function\n";
    echo "- callOpenAIShared() function\n";
    echo "- callAnthropicShared() function\n";
    echo "- getAIUsageStats() function\n";
    echo "- logAIRequest() function\n\n";
    echo "Your current file probably only has the \$AI_CONFIG array.\n";
} else {
    echo "\n✅ API seems to be responding\n";
}

echo "\n💡 Quick fix: Replace your ai-config.php with the complete version.\n";
?>
