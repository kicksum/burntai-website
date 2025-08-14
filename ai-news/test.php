<?php
/**
 * Test file to verify PHP news proxy is working
 */

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>BurntAI News Proxy Test</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            padding: 20px; 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #e8f1f5;
            line-height: 1.6;
        }
        h1 {
            color: #ffffff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .test { 
            margin: 20px 0; 
            padding: 20px; 
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .test h2 {
            color: #64b5f6;
            margin-top: 0;
            font-size: 1.3em;
        }
        .pass { 
            background: rgba(76, 175, 80, 0.15); 
            border-color: #4CAF50;
        }
        .fail { 
            background: rgba(244, 67, 54, 0.15); 
            border-color: #f44336;
        }
        pre { 
            white-space: pre-wrap; 
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 0.9em;
        }
        button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 12px 24px; 
            cursor: pointer; 
            font-weight: 600;
            border-radius: 5px;
            margin: 5px;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        /* Status colors - more readable */
        .status-good { color: #4CAF50; font-weight: bold; }
        .status-bad { color: #f44336; font-weight: bold; }
        .status-info { color: #64b5f6; }
        /* Result display */
        #result {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            max-height: 500px;
            overflow-y: auto;
        }
        .info-text {
            color: #b3d9ff;
            font-size: 0.95em;
        }
        /* Better JSON display */
        .json-display {
            background: #1a1a2e;
            color: #eee;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <h1>🔬 BurntAI News Proxy Test Suite</h1>
    
    <div class="test">
        <h2>1. PHP Configuration</h2>
        <div class="info-text">
        <?php
        echo "PHP Version: <span class='status-info'>" . PHP_VERSION . "</span><br>";
        echo "cURL: " . (function_exists('curl_init') ? '<span class="status-good">✅ Enabled</span>' : '<span class="status-bad">❌ Disabled</span>') . "<br>";
        echo "JSON: " . (function_exists('json_encode') ? '<span class="status-good">✅ Enabled</span>' : '<span class="status-bad">❌ Disabled</span>') . "<br>";
        echo "SimpleXML: " . (function_exists('simplexml_load_string') ? '<span class="status-good">✅ Enabled</span>' : '<span class="status-bad">❌ Disabled</span>') . "<br>";
        ?>
        </div>
    </div>
    
    <div class="test">
        <h2>2. Cache Directory</h2>
        <div class="info-text">
        <?php
        $cacheDir = __DIR__ . '/cache/';
        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        echo "Cache Directory: <span class='status-info'>" . $cacheDir . "</span><br>";
        echo "Writable: " . (is_writable($cacheDir) ? '<span class="status-good">✅ Yes</span>' : '<span class="status-bad">❌ No</span>') . "<br>";
        
        // Test write
        $testFile = $cacheDir . 'test.txt';
        $written = file_put_contents($testFile, 'test');
        echo "Write Test: " . ($written !== false ? '<span class="status-good">✅ Success</span>' : '<span class="status-bad">❌ Failed</span>') . "<br>";
        if ($written !== false) {
            unlink($testFile);
        }
        ?>
        </div>
    </div>
    
    <div class="test">
        <h2>3. Test News Proxy</h2>
        <button onclick="testProxy()">Test News Endpoint</button>
        <button onclick="testProxy(true)">Force Refresh</button>
        <div id="result"></div>
    </div>
    
    <div class="test">
        <h2>4. Direct cURL Test</h2>
        <div class="info-text">
        <?php
        $testUrl = 'https://api.github.com';
        $ch = curl_init($testUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_USERAGENT, 'BurntAI-Test/1.0');
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "Test URL: <span class='status-info'>$testUrl</span><br>";
        echo "Response: " . ($httpCode === 200 ? "<span class='status-good'>✅ HTTP $httpCode</span>" : "<span class='status-bad'>❌ HTTP $httpCode</span>") . "<br>";
        echo "Content: " . (strlen($response) > 0 ? "<span class='status-good'>✅ " . strlen($response) . " bytes received</span>" : "<span class='status-bad'>❌ Empty response</span>") . "<br>";
        ?>
        </div>
    </div>

    <script>
        async function testProxy(force = false) {
            const result = document.getElementById('result');
            result.innerHTML = '<div style="color: #ffd93d; padding: 10px;">⏳ Testing endpoint...</div>';
            
            try {
                const url = 'news_proxy.php' + (force ? '?force=1' : '');
                const response = await fetch(url);
                const data = await response.json();
                
                let html = '<div class="' + (response.ok ? 'pass' : 'fail') + '" style="padding: 15px; margin-top: 10px; border-radius: 5px;">';
                html += '<strong>Status:</strong> <span class="' + (response.ok ? 'status-good' : 'status-bad') + '">' + response.status + '</span><br>';
                html += '<strong>Response:</strong><br>';
                html += '<div class="json-display"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
                html += '</div>';
                
                result.innerHTML = html;
                
                // Check for specific providers
                if (data.items) {
                    let providers = Object.keys(data.items);
                    console.log('✅ Found providers:', providers);
                }
                
            } catch (error) {
                result.innerHTML = '<div class="fail" style="padding: 15px; margin-top: 10px; border-radius: 5px;"><span class="status-bad">❌ Error:</span> ' + error.message + '</div>';
            }
        }
        
        // Auto-test on load
        window.addEventListener('load', () => {
            console.log('🔬 Test page loaded. Click buttons to test the news proxy.');
        });
    </script>
</body>
</html>
