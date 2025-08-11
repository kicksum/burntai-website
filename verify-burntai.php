<?php
// verify-burntai.php - Place in /var/www/burntai.com/html/
// Access at: https://burntai.com/verify-burntai.php

header('Content-Type: text/plain');

echo "BurntAI Installation Verification\n";
echo "=================================\n\n";

// Check config file
echo "1. Checking configuration file...\n";
$configPath = __DIR__ . '/../config/ai-config.php';
if (file_exists($configPath)) {
    echo "   ✅ Config file exists at: $configPath\n";
    
    // Try to load it
    try {
        require_once($configPath);
        if (isset($AI_CONFIG)) {
            echo "   ✅ Config loaded successfully\n";
            echo "   ✅ Provider set to: " . $AI_CONFIG['provider'] . "\n";
            
            // Check API keys (show only partial for security)
            $openaiKey = $AI_CONFIG['openai']['api_key'] ?? '';
            if (strpos($openaiKey, 'sk-') === 0) {
                echo "   ✅ OpenAI API key configured (sk-...)\n";
            } else {
                echo "   ⚠️  OpenAI API key not properly configured\n";
            }
        } else {
            echo "   ❌ Config loaded but \$AI_CONFIG not found\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Error loading config: " . $e->getMessage() . "\n";
    }
} else {
    echo "   ❌ Config file NOT found at: $configPath\n";
}

// Check directories
echo "\n2. Checking directories...\n";
$dirs = [
    'API' => __DIR__ . '/api',
    'JS' => __DIR__ . '/js',
    'Cache' => __DIR__ . '/cache',
    'Logs' => __DIR__ . '/logs'
];

foreach ($dirs as $name => $path) {
    if (is_dir($path)) {
        echo "   ✅ $name directory exists\n";
        if (is_writable($path)) {
            echo "      ✅ $name directory is writable\n";
        } else {
            echo "      ❌ $name directory is NOT writable\n";
        }
    } else {
        echo "   ❌ $name directory NOT found at: $path\n";
    }
}

// Check API files
echo "\n3. Checking API endpoints...\n";
$apiFiles = [
    'consciousness-fusion.php',
    'neural-wasteland.php',
    'intel-feed.php'
];

foreach ($apiFiles as $file) {
    $path = __DIR__ . '/api/' . $file;
    if (file_exists($path)) {
        echo "   ✅ $file exists\n";
    } else {
        echo "   ❌ $file NOT found\n";
    }
}

// Check JS module
echo "\n4. Checking JavaScript module...\n";
$jsPath = __DIR__ . '/js/burntai-ai.js';
if (file_exists($jsPath)) {
    echo "   ✅ burntai-ai.js exists\n";
    echo "   ✅ Size: " . filesize($jsPath) . " bytes\n";
} else {
    echo "   ❌ burntai-ai.js NOT found\n";
}

// Check environment variables
echo "\n5. Checking environment variables...\n";
$openaiEnv = getenv('OPENAI_API_KEY');
$providerEnv = getenv('AI_PROVIDER');

if ($openaiEnv) {
    echo "   ✅ OPENAI_API_KEY is set in environment\n";
} else {
    echo "   ⚠️  OPENAI_API_KEY not found in environment\n";
}

if ($providerEnv) {
    echo "   ✅ AI_PROVIDER is set to: $providerEnv\n";
} else {
    echo "   ⚠️  AI_PROVIDER not set in environment\n";
}

// Check PHP extensions
echo "\n6. Checking PHP extensions...\n";
$required = ['curl', 'json', 'session'];
foreach ($required as $ext) {
    if (extension_loaded($ext)) {
        echo "   ✅ $ext extension loaded\n";
    } else {
        echo "   ❌ $ext extension NOT loaded\n";
    }
}

// Try a test API call
echo "\n7. Testing API connectivity...\n";
echo "   (Run ai-test.html for comprehensive testing)\n";

// Summary
echo "\n" . str_repeat("=", 40) . "\n";
echo "SUMMARY: ";
$configOk = file_exists($configPath);
$dirsOk = is_dir(__DIR__ . '/api') && is_dir(__DIR__ . '/js');
$writableOk = is_writable(__DIR__ . '/cache') && is_writable(__DIR__ . '/logs');

if ($configOk && $dirsOk && $writableOk) {
    echo "✅ Basic setup looks good!\n";
    echo "\nNext: Visit https://burntai.com/ai-test.html for full system test\n";
} else {
    echo "❌ Setup issues detected\n";
    echo "\nPlease fix the issues above and try again.\n";
}

// Security note
echo "\n⚠️  Security: Delete this file after verification!\n";
?>