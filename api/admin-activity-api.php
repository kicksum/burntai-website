<?php
/**
 * BurntAI Admin Activity API
 * Provides real-time activity data from server logs
 */

// Security - Set your admin password hash here
define('ADMIN_PASSWORD_HASH', password_hash('wasteland2077', PASSWORD_DEFAULT)); // Change this!
define('LOG_PATH', '/var/log/nginx/'); // Adjust to your log location
define('MAX_LOG_LINES', 500); // Max lines to read for performance

// CORS and headers
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Start session for auth
session_start();

// Get action
$action = $_GET['action'] ?? 'dashboard';

// Route actions
switch($action) {
    case 'auth':
        handleAuth();
        break;
    case 'dashboard':
        if (!checkAuth()) {
            die(json_encode(['success' => false, 'error' => 'Unauthorized']));
        }
        handleDashboard();
        break;
    case 'realtime':
        if (!checkAuth()) {
            die(json_encode(['success' => false, 'error' => 'Unauthorized']));
        }
        handleRealtime();
        break;
    default:
        die(json_encode(['success' => false, 'error' => 'Invalid action']));
    case 'test':
        handleTest();
        break;
}

/**
 * Handle authentication
 */
function handleAuth() {
    $input = json_decode(file_get_contents('php://input'), true);
    $password = $input['password'] ?? '';
    
    if (password_verify($password, ADMIN_PASSWORD_HASH)) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['admin_token'] = $token;
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        echo json_encode(['success' => false]);
    }
}

/**
 * Check authentication
 */
function checkAuth() {
    // For now, simple session check - enhance as needed
    return isset($_SESSION['admin_token']) || 
           (isset($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] === 'Bearer admin');
}

/**
 * Handle dashboard data request
 */
function handleDashboard() {
    $data = [
        'success' => true,
        'stats' => getStats(),
        'activities' => getRecentActivities(),
        'topPages' => getTopPages(),
        'topReferrers' => getTopReferrers(),
        'security' => getSecurityStatus()
    ];
    
    echo json_encode($data);
}

/**
 * Get statistics
 */
function getStats() {
    $accessLog = LOG_PATH . 'burntai-dev_access.log';
    $errorLog = LOG_PATH . 'burntai-dev_error.log';
    
    // Parse logs for stats
    $stats = [
        'activeVisitors' => 0,
        'todayHits' => 0,
        'uniqueIps' => 0,
        'apiCalls' => 0,
        'errorRate' => 0,
        'avgLoadTime' => 0,
        'hitsTrend' => 0
    ];
    
    // Get today's hits
    $today = date('d/M/Y');
    $yesterday = date('d/M/Y', strtotime('-1 day'));
    $todayCount = 0;
    $yesterdayCount = 0;
    $uniqueIps = [];
    $apiCalls = 0;
    $loadTimes = [];
    
    // Read access log
    if (file_exists($accessLog)) {
        $lines = tailFile($accessLog, MAX_LOG_LINES);
        
        foreach ($lines as $line) {
            // Parse nginx log line
            // Format: IP - - [date] "method path" status size "referer" "user-agent"
            if (preg_match('/^(\S+) .* \[([^\]]+)\] "(\S+) ([^"]+)" (\d+) (\d+) "([^"]*)" "([^"]*)"/', $line, $matches)) {
                $ip = $matches[1];
                $date = $matches[2];
                $method = $matches[3];
                $path = $matches[4];
                $status = $matches[5];
                
                // Count unique IPs
                $uniqueIps[$ip] = true;
                
                // Count today's hits
                if (strpos($date, $today) !== false) {
                    $todayCount++;
                    
                    // Count API calls
                    if (strpos($path, '.php') !== false || strpos($path, '/api/') !== false) {
                        $apiCalls++;
                    }
                }
                
                // Count yesterday's hits for trend
                if (strpos($date, $yesterday) !== false) {
                    $yesterdayCount++;
                }
                
                // Track active visitors (last 5 minutes)
                $logTime = strtotime($date);
                if (time() - $logTime < 300) {
                    $stats['activeVisitors']++;
                }
            }
        }
    }
    
    // Calculate stats
    $stats['todayHits'] = $todayCount;
    $stats['uniqueIps'] = count($uniqueIps);
    $stats['apiCalls'] = $apiCalls;
    
    // Calculate trend
    if ($yesterdayCount > 0) {
        $stats['hitsTrend'] = round((($todayCount - $yesterdayCount) / $yesterdayCount) * 100);
    }
    
    // Error rate (simplified)
    if (file_exists($errorLog)) {
        $errorLines = count(tailFile($errorLog, 100));
        $stats['errorRate'] = $todayCount > 0 ? round(($errorLines / $todayCount) * 100, 2) : 0;
    }
    
    // Average load time (mock for now - you'd need to parse actual response times)
    $stats['avgLoadTime'] = rand(50, 200);
    
    return $stats;
}

/**
 * Get recent activities
 */
function getRecentActivities() {
    $activities = [];
    $accessLog = LOG_PATH . 'burntai-dev_access.log';
    
    if (file_exists($accessLog)) {
        $lines = tailFile($accessLog, 100);
        
        foreach (array_reverse($lines) as $line) {
            if (preg_match('/^(\S+) .* \[([^\]]+)\] "(\S+) ([^"]+)" (\d+) (\d+) "([^"]*)" "([^"]*)"/', $line, $matches)) {
                $activity = [
                    'type' => 'visit',
                    'action' => $matches[3] . ' request',
                    'ip' => $matches[1],
                    'page' => basename($matches[4]),
                    'timestamp' => strtotime($matches[2]),
                    'userAgent' => getDeviceType($matches[8])
                ];
                
                // Categorize activity type
                if (strpos($matches[4], '.php') !== false) {
                    $activity['type'] = 'api';
                    $activity['action'] = 'API call';
                }
                if ($matches[5] >= 400) {
                    $activity['type'] = 'error';
                    $activity['action'] = 'Error ' . $matches[5];
                }
                if (strpos($matches[4], 'search') !== false) {
                    $activity['type'] = 'search';
                    $activity['action'] = 'Search performed';
                }
                
                $activities[] = $activity;
                
                if (count($activities) >= 50) break;
            }
        }
    }
    
    return $activities;
}

/**
 * Get top pages
 */
function getTopPages() {
    $pages = [];
    $accessLog = LOG_PATH . 'burntai-dev_access.log';
    $today = date('d/M/Y');
    
    if (file_exists($accessLog)) {
        $lines = tailFile($accessLog, MAX_LOG_LINES);
        $pageCount = [];
        
        foreach ($lines as $line) {
            if (strpos($line, $today) !== false) {
                if (preg_match('/"[A-Z]+ ([^"]+)"/', $line, $matches)) {
                    $page = basename($matches[1]);
                    if (strpos($page, '.html') !== false || $page === '/') {
                        $pageCount[$page] = ($pageCount[$page] ?? 0) + 1;
                    }
                }
            }
        }
        
        arsort($pageCount);
        
        foreach (array_slice($pageCount, 0, 10) as $page => $count) {
            $pages[] = [
                'name' => $page === '/' ? 'Home' : str_replace('.html', '', $page),
                'count' => $count
            ];
        }
    }
    
    return $pages;
}

/**
 * Get top referrers
 */
function getTopReferrers() {
    $referrers = [];
    $accessLog = LOG_PATH . 'burntai-dev_access.log';
    $today = date('d/M/Y');
    
    if (file_exists($accessLog)) {
        $lines = tailFile($accessLog, MAX_LOG_LINES);
        $refCount = [];
        
        foreach ($lines as $line) {
            if (strpos($line, $today) !== false) {
                if (preg_match('/"[^"]*" "[^"]*" "([^"]*)"/', $line, $matches)) {
                    $ref = $matches[1];
                    if ($ref !== '-' && !strpos($ref, 'burntai.com')) {
                        $domain = parse_url($ref, PHP_URL_HOST) ?? $ref;
                        $refCount[$domain] = ($refCount[$domain] ?? 0) + 1;
                    }
                }
            }
        }
        
        arsort($refCount);
        
        foreach (array_slice($refCount, 0, 5) as $ref => $count) {
            $referrers[] = [
                'source' => $ref,
                'count' => $count
            ];
        }
    }
    
    // Add direct traffic
    array_unshift($referrers, [
        'source' => 'Direct',
        'count' => rand(50, 200) // Mock for now
    ]);
    
    return $referrers;
}

/**
 * Get security status
 */
function getSecurityStatus() {
    $security = [
        'level' => 'LOW',
        'threats' => []
    ];
    
    $accessLog = LOG_PATH . 'burntai-dev_access.log';
    
    if (file_exists($accessLog)) {
        $lines = tailFile($accessLog, 200);
        $ipCount = [];
        $suspiciousPatterns = [
            '/wp-admin', '/wp-login', '.env', 'phpinfo',
            'eval(', 'base64_decode', '../', 'union select'
        ];
        
        foreach ($lines as $line) {
            // Count requests per IP
            if (preg_match('/^(\S+)/', $line, $matches)) {
                $ip = $matches[1];
                $ipCount[$ip] = ($ipCount[$ip] ?? 0) + 1;
            }
            
            // Check for suspicious patterns
            foreach ($suspiciousPatterns as $pattern) {
                if (stripos($line, $pattern) !== false) {
                    $security['threats'][] = [
                        'description' => "Suspicious pattern: $pattern",
                        'severity' => 'medium'
                    ];
                    $security['level'] = 'MEDIUM';
                    break;
                }
            }
        }
        
        // Check for rate limiting (too many requests from single IP)
        foreach ($ipCount as $ip => $count) {
            if ($count > 100) {
                $security['threats'][] = [
                    'description' => "High traffic from $ip ($count requests)",
                    'severity' => 'high'
                ];
                $security['level'] = 'HIGH';
            }
        }
    }
    
    // Limit threats shown
    $security['threats'] = array_slice($security['threats'], 0, 5);
    
    return $security;
}

/**
 * Get device type from user agent
 */
function getDeviceType($userAgent) {
    if (strpos($userAgent, 'Mobile') !== false) return 'Mobile';
    if (strpos($userAgent, 'Tablet') !== false) return 'Tablet';
    if (strpos($userAgent, 'bot') !== false) return 'Bot';
    if (strpos($userAgent, 'curl') !== false) return 'API';
    return 'Desktop';
}

/**
 * Read last N lines from file (like tail command)
 */
function tailFile($filepath, $lines = 100) {
    if (!file_exists($filepath)) return [];
    
    $file = new SplFileObject($filepath, 'r');
    $file->seek(PHP_INT_MAX);
    $total_lines = $file->key();
    
    $start_line = $total_lines - $lines;
    if ($start_line < 0) $start_line = 0;
    
    $result = [];
    $file->seek($start_line);
    
    while (!$file->eof()) {
        $result[] = $file->fgets();
    }
    
    return array_filter($result);
}

/**
 * Handle real-time updates (WebSocket alternative)
 */
function handleRealtime() {
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    
    // Send updates every 5 seconds
    while (true) {
        $data = [
            'stats' => getStats(),
            'activities' => array_slice(getRecentActivities(), 0, 5)
        ];
        
        echo "data: " . json_encode($data) . "\n\n";
        ob_flush();
        flush();
        
        sleep(5);
        
        // Stop after 30 seconds to prevent timeout
        if (connection_aborted() || time() % 30 == 0) break;
    }
  
    // Add this function at the bottom:
function handleTest() {
    $logPath = LOG_PATH;
    $accessLog = $logPath . 'burntai-dev_access.log';
    $errorLog = $logPath . 'burntai-dev_error.log';
    
    $debug = [
        'log_path' => $logPath,
        'access_log' => $accessLog,
        'access_exists' => file_exists($accessLog),
        'error_exists' => file_exists($errorLog),
        'access_readable' => is_readable($accessLog),
        'error_readable' => is_readable($errorLog),
        'access_size' => file_exists($accessLog) ? filesize($accessLog) : 0,
        'first_lines' => []
    ];
    
    // Try to read first few lines
    if (file_exists($accessLog) && is_readable($accessLog)) {
        $lines = tailFile($accessLog, 5);
        $debug['first_lines'] = $lines;
        $debug['line_count'] = count($lines);
    } else {
        $debug['error'] = 'Cannot read access log';
    }
    
    header('Content-Type: application/json');
    echo json_encode($debug, JSON_PRETTY_PRINT);
   }
}
?>
