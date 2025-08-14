<?php
/**
 * Environment and API Key Tester
 * Tests .env loading and validates API keys
 */

// Load environment variables
function loadEnv($path = __DIR__ . '/.env') {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) continue;
        
        // Skip lines without =
        if (strpos($line, '=') === false) continue;
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // Remove quotes if present
        $value = trim($value, '"\'');
        
        // ALWAYS set the value (no conditions!)
        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
    return true;
}

$envLoaded = loadEnv();

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>BurntAI API Key Tester</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #1a1a2e; 
            color: #eee; 
            padding: 20px;
            line-height: 1.6;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        .test-section {
            background: rgba(255,255,255,0.05);
            border: 1px solid #444;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .success { color: #4CAF50; font-weight: bold; }
        .error { color: #f44336; font-weight: bold; }
        .warning { color: #ff9800; font-weight: bold; }
        .info { color: #2196F3; }
        .key-display { 
            background: #000; 
            padding: 10px; 
            border-radius: 4px; 
            font-size: 0.9em;
            word-break: break-all;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #45a049; }
        .result-box {
            background: #000;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        pre { margin: 0; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔑 BurntAI API Key & Environment Tester</h1>
        
        <!-- Environment File Check -->
        <div class="test-section">
            <h2>1. Environment File Status</h2>
            <?php if ($envLoaded): ?>
                <p class="success">✅ .env file loaded successfully</p>
                <p>Path: <?php echo __DIR__ . '/.env'; ?></p>
            <?php else: ?>
                <p class="error">❌ .env file not found</p>
                <p>Expected at: <?php echo __DIR__ . '/.env'; ?></p>
            <?php endif; ?>
        </div>
        
        <!-- API Keys Status -->
        <div class="test-section">
            <h2>2. API Keys Detection</h2>
            <?php
            $openai_key = getenv('OPENAI_API_KEY');
            $anthropic_key = getenv('ANTHROPIC_API_KEY');
            $newsapi_key = getenv('NEWSAPI_KEY');
            
            // OpenAI
            echo "<h3>OpenAI API Key:</h3>";
            if ($openai_key) {
                $masked = substr($openai_key, 0, 7) . '...' . substr($openai_key, -4);
                echo "<p class='success'>✅ Detected</p>";
                echo "<div class='key-display'>$masked</div>";
                
                // Check key format
                if (strpos($openai_key, 'sk-proj-') === 0) {
                    echo "<p class='info'>Format: Project Key (New format)</p>";
                } elseif (strpos($openai_key, 'sk-') === 0) {
                    echo "<p class='info'>Format: Standard Key</p>";
                } else {
                    echo "<p class='warning'>⚠️ Unusual key format</p>";
                }
            } else {
                echo "<p class='error'>❌ Not found</p>";
            }
            
            // Anthropic
            echo "<h3>Anthropic API Key:</h3>";
            if ($anthropic_key) {
                $masked = substr($anthropic_key, 0, 10) . '...' . substr($anthropic_key, -4);
                echo "<p class='success'>✅ Detected</p>";
                echo "<div class='key-display'>$masked</div>";
                
                if (strpos($anthropic_key, 'sk-ant-') === 0) {
                    echo "<p class='info'>Format: Valid Anthropic key</p>";
                } else {
                    echo "<p class='warning'>⚠️ Unusual key format</p>";
                }
            } else {
                echo "<p class='error'>❌ Not found</p>";
            }
            
            // NewsAPI
            echo "<h3>NewsAPI Key:</h3>";
            if ($newsapi_key) {
                $masked = substr($newsapi_key, 0, 4) . '...' . substr($newsapi_key, -4);
                echo "<p class='success'>✅ Detected</p>";
                echo "<div class='key-display'>$masked</div>";
            } else {
                echo "<p class='warning'>⚠️ Not found (optional)</p>";
            }
            ?>
        </div>
        
        <!-- Live API Tests -->
        <div class="test-section">
            <h2>3. Live API Tests</h2>
            <p>Click to test each API with your keys:</p>
            
            <button onclick="testOpenAI()">Test OpenAI API</button>
            <button onclick="testAnthropic()">Test Anthropic API</button>
            <button onclick="testNewsAPI()">Test NewsAPI</button>
            <button onclick="testNewsProxy()">Test Full News Proxy</button>
            
            <div id="test-result" class="result-box" style="display:none;"></div>
        </div>
        
        <!-- Configuration -->
        <div class="test-section">
            <h2>4. Configuration Settings</h2>
            <?php
            echo "<p>Cache Time: <span class='info'>" . (getenv('CACHE_TIME') ?: '300') . " seconds</span></p>";
            echo "<p>Debug Mode: <span class='info'>" . (getenv('DEBUG_MODE') === 'true' ? 'Enabled' : 'Disabled') . "</span></p>";
            echo "<p>Environment: <span class='info'>" . (getenv('APP_ENV') ?: 'production') . "</span></p>";
            ?>
        </div>
        
        <!-- File Permissions -->
        <div class="test-section">
            <h2>5. File Permissions</h2>
            <?php
            $cache_dir = __DIR__ . '/cache/';
            $htaccess = __DIR__ . '/.htaccess';
            
            echo "<p>Cache Directory: ";
            if (is_writable($cache_dir)) {
                echo "<span class='success'>✅ Writable</span></p>";
            } else {
                echo "<span class='error'>❌ Not writable</span></p>";
            }
            
            echo "<p>.htaccess: ";
            if (file_exists($htaccess)) {
                echo "<span class='success'>✅ Exists (security enabled)</span></p>";
            } else {
                echo "<span class='warning'>⚠️ Not found (security not configured)</span></p>";
            }
            ?>
        </div>
        
        <!-- Quick Debug -->
        <div class="test-section">
            <h2>6. Quick Debug Commands</h2>
            <div class="key-display">
# Test news proxy with debug
curl "<?php echo 'http://' . $_SERVER['HTTP_HOST']; ?>/ai-news/news_proxy.php?debug=1"

# Force refresh
curl "<?php echo 'http://' . $_SERVER['HTTP_HOST']; ?>/ai-news/news_proxy.php?force=1"

# Check cache
ls -la <?php echo $cache_dir; ?>
            </div>
        </div>
    </div>
    
    <script>
        const resultDiv = document.getElementById('test-result');
        
        function showResult(content, isError = false) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<pre style="color: ${isError ? '#f44336' : '#4CAF50'}">${content}</pre>`;
        }
        
        async function testOpenAI() {
            showResult('Testing OpenAI API...');
            try {
                const response = await fetch('test-api.php?api=openai');
                const data = await response.text();
                showResult(data);
            } catch (error) {
                showResult('Error: ' + error.message, true);
            }
        }
        
        async function testAnthropic() {
            showResult('Testing Anthropic API...');
            try {
                const response = await fetch('test-api.php?api=anthropic');
                const data = await response.text();
                showResult(data);
            } catch (error) {
                showResult('Error: ' + error.message, true);
            }
        }
        
        async function testNewsAPI() {
            showResult('Testing NewsAPI...');
            try {
                const response = await fetch('test-api.php?api=newsapi');
                const data = await response.text();
                showResult(data);
            } catch (error) {
                showResult('Error: ' + error.message, true);
            }
        }
        
        async function testNewsProxy() {
            showResult('Testing Full News Proxy...');
            try {
                const response = await fetch('news_proxy.php?debug=1');
                const data = await response.json();
                showResult(JSON.stringify(data, null, 2));
            } catch (error) {
                showResult('Error: ' + error.message, true);
            }
        }
    </script>
</body>
</html>
