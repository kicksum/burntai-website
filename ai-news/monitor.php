<?php
/**
 * BurntAI News Proxy Monitor
 * Real-time health check dashboard
 */

header('Content-Type: text/html; charset=UTF-8');

$cacheDir = __DIR__ . '/cache/';
$cacheFile = $cacheDir . 'news_data.json';
$logFile = $cacheDir . 'monitor.log';

// Get cache stats
$cacheExists = file_exists($cacheFile);
$cacheAge = $cacheExists ? (time() - filemtime($cacheFile)) : null;
$cacheSize = $cacheExists ? filesize($cacheFile) : 0;
$cacheData = $cacheExists ? json_decode(file_get_contents($cacheFile), true) : null;

// System info
$phpVersion = PHP_VERSION;
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
$memoryUsage = memory_get_usage(true);
$memoryPeak = memory_get_peak_usage(true);

// Function to format bytes
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB');
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . ' ' . $units[$pow];
}

// Function to format time ago
function timeAgo($seconds) {
    if ($seconds < 60) return $seconds . ' seconds';
    if ($seconds < 3600) return round($seconds / 60) . ' minutes';
    if ($seconds < 86400) return round($seconds / 3600) . ' hours';
    return round($seconds / 86400) . ' days';
}

// Log monitor access
file_put_contents($logFile, date('c') . " - Monitor accessed from " . $_SERVER['REMOTE_ADDR'] . "\n", FILE_APPEND);
?>
<!DOCTYPE html>
<html>
<head>
    <title>BurntAI News Monitor</title>
    <meta http-equiv="refresh" content="30">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #2d3748;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .pulse {
            display: inline-block;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        .card h2 {
            margin-bottom: 15px;
            font-size: 1.3em;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px;
            background: #f7fafc;
            border-radius: 6px;
            transition: background 0.2s ease;
        }
        .metric:hover {
            background: #edf2f7;
        }
        .metric-label {
            color: #718096;
            font-weight: 500;
        }
        .metric-value {
            font-weight: 600;
        }
        /* Status colors - professional and readable */
        .status-good { color: #48bb78; }
        .status-warning { color: #ed8936; }
        .status-error { color: #f56565; }
        .status-info { color: #4299e1; }
        
        .refresh-info {
            text-align: center;
            margin-top: 20px;
            color: white;
            font-size: 0.9em;
            opacity: 0.9;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .btn {
            flex: 1;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .terminal-log {
            background: #2d3748;
            border: 2px solid #4a5568;
            color: #a0aec0;
            padding: 15px;
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
        }
        .blink {
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        /* Success badge */
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #fed7d7; color: #742a2a; }
        .badge-error { background: #fed7d7; color: #742a2a; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔬 BURNTAI NEWS MONITOR <span class="blink">●</span></h1>
        
        <div class="grid">
            <!-- Cache Status -->
            <div class="card">
                <h2>📦 Cache Status</h2>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="metric-value <?php echo $cacheExists ? 'status-good' : 'status-error'; ?>">
                        <?php echo $cacheExists ? '✅ ACTIVE' : '❌ MISSING'; ?>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Age:</span>
                    <span class="metric-value <?php 
                        if (!$cacheAge) echo 'status-error';
                        elseif ($cacheAge > 600) echo 'status-warning';
                        else echo 'status-good';
                    ?>">
                        <?php echo $cacheAge ? timeAgo($cacheAge) . ' ago' : 'N/A'; ?>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Size:</span>
                    <span class="metric-value status-info"><?php echo formatBytes($cacheSize); ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Update:</span>
                    <span class="metric-value status-info" style="font-size: 0.9em;">
                        <?php echo $cacheExists ? date('Y-m-d H:i:s', filemtime($cacheFile)) : 'Never'; ?>
                    </span>
                </div>
            </div>
            
            <!-- News Sources -->
            <div class="card">
                <h2>📰 News Sources</h2>
                <?php if ($cacheData && isset($cacheData['items'])): ?>
                    <?php foreach ($cacheData['items'] as $provider => $data): ?>
                        <div class="metric">
                            <span class="metric-label"><?php echo ucfirst($provider); ?>:</span>
                            <span class="metric-value status-good">
                                <?php echo count($data['articles'] ?? []); ?> articles
                            </span>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="metric">
                        <span class="metric-value status-error">No data available</span>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- System Info -->
            <div class="card">
                <h2>⚙️ System Info</h2>
                <div class="metric">
                    <span class="metric-label">PHP Version:</span>
                    <span class="metric-value status-info"><?php echo $phpVersion; ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Server:</span>
                    <span class="metric-value status-info" style="font-size: 0.85em;"><?php echo $serverSoftware; ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory:</span>
                    <span class="metric-value status-info"><?php echo formatBytes($memoryUsage); ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Peak Memory:</span>
                    <span class="metric-value status-info"><?php echo formatBytes($memoryPeak); ?></span>
                </div>
            </div>
            
            <!-- Health Checks -->
            <div class="card">
                <h2>🏥 Health Checks</h2>
                <div class="metric">
                    <span class="metric-label">cURL:</span>
                    <span class="metric-value <?php echo function_exists('curl_init') ? 'status-good' : 'status-error'; ?>">
                        <?php echo function_exists('curl_init') ? '✅ Enabled' : '❌ Disabled'; ?>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">JSON:</span>
                    <span class="metric-value <?php echo function_exists('json_encode') ? 'status-good' : 'status-error'; ?>">
                        <?php echo function_exists('json_encode') ? '✅ Enabled' : '❌ Disabled'; ?>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">SimpleXML:</span>
                    <span class="metric-value <?php echo function_exists('simplexml_load_string') ? 'status-good' : 'status-error'; ?>">
                        <?php echo function_exists('simplexml_load_string') ? '✅ Enabled' : '❌ Disabled'; ?>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cache Dir:</span>
                    <span class="metric-value <?php echo is_writable($cacheDir) ? 'status-good' : 'status-error'; ?>">
                        <?php echo is_writable($cacheDir) ? '✅ Writable' : '❌ Read-only'; ?>
                    </span>
                </div>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="card">
            <h2>🎮 Actions</h2>
            <div class="action-buttons">
                <a href="news_proxy.php" target="_blank" class="btn">View Raw JSON</a>
                <a href="news_proxy.php?force=1" target="_blank" class="btn">Force Refresh</a>
                <a href="test.php" class="btn">Run Tests</a>
                <button onclick="clearCache()" class="btn">Clear Cache</button>
            </div>
        </div>
        
        <!-- Recent Log -->
        <div class="card" style="margin-top: 20px;">
            <h2>📋 Recent Activity</h2>
            <div class="terminal-log">
<?php
// Show last 10 lines of monitor log
if (file_exists($logFile)) {
    $lines = file($logFile);
    $recent = array_slice($lines, -10);
    foreach ($recent as $line) {
        echo htmlspecialchars($line);
    }
} else {
    echo "No activity logged yet.\n";
}
?>
            </div>
        </div>
        
        <div class="refresh-info">
            ⏱️ Page auto-refreshes every 30 seconds | Last refresh: <?php echo date('H:i:s'); ?>
        </div>
    </div>
    
    <script>
        function clearCache() {
            if (confirm('Clear all cached news data?')) {
                fetch('news_proxy.php?force=1')
                    .then(response => response.json())
                    .then(data => {
                        alert('✅ Cache cleared and refreshed!');
                        location.reload();
                    })
                    .catch(error => {
                        alert('❌ Error: ' + error.message);
                    });
            }
        }
        
        // Visual feedback for auto-refresh
        let countdown = 30;
        setInterval(() => {
            countdown--;
            if (countdown <= 0) countdown = 30;
        }, 1000);
    </script>
</body>
</html>
