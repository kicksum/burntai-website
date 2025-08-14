<?php
// Disable sessions for now to avoid permission issues
// session_start();

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

define('LOG_PATH', '/var/log/nginx/');
define('ACCESS_LOG', LOG_PATH . 'burntai-dev_access.log');
define('ERROR_LOG', LOG_PATH . 'burntai-dev_error.log');

$action = $_GET['action'] ?? 'dashboard';

switch($action) {
    case 'auth':
        // Skip auth for now
        echo json_encode(['success' => true, 'token' => 'dev']);
        break;
        
    case 'dashboard':
        handleDashboard();
        break;
        
    default:
        echo json_encode(['error' => 'Unknown action']);
}

function handleDashboard() {
    $data = [
        'success' => true,
        'stats' => getStats(),
        'activities' => getRecentActivities(),
        'topPages' => getTopPages(),
        'topReferrers' => getTopReferrers(),
        'security' => ['level' => 'LOW', 'threats' => []]
    ];
    echo json_encode($data);
}

function getStats() {
    $stats = [
        'activeVisitors' => 0,
        'todayHits' => 0,
        'uniqueIps' => 0,
        'apiCalls' => 0,
        'errorRate' => 0,
        'avgLoadTime' => rand(50, 200),
        'hitsTrend' => 0
    ];
    
    if (file_exists(ACCESS_LOG)) {
        $today = date('d/M/Y');
        $uniqueIps = [];
        $todayCount = 0;
        $apiCalls = 0;
        
        // Read last 500 lines
        $lines = tailFile(ACCESS_LOG, 500);
        
        foreach ($lines as $line) {
            // Parse nginx log: IP - - [date] "method path" status size "referer" "user-agent"
                if (preg_match('/^(\S+) .* \[([^\]]+)\].*"([A-Z]+) ([^ ]+) [^"]*" (\d+)/', $line, $matches)) {
                $ip = $matches[1];
                $date = $matches[2];
                $path = $matches[3];
                
                $uniqueIps[$ip] = true;
                
                if (strpos($date, $today) !== false) {
                    $todayCount++;
                    if (strpos($path, '.php') !== false) {
                        $apiCalls++;
                    }
                }
            }
        }
        
        $stats['todayHits'] = $todayCount;
        $stats['uniqueIps'] = count($uniqueIps);
        $stats['apiCalls'] = $apiCalls;
        $stats['activeVisitors'] = min(count($uniqueIps), 20);
    }
    
    return $stats;
}

function getRecentActivities() {
    $activities = [];
    
    if (file_exists(ACCESS_LOG)) {
        $lines = tailFile(ACCESS_LOG, 50);
        
        foreach (array_reverse($lines) as $line) {
            if (preg_match('/^(\S+) .* \[([^\]]+)\].*"([A-Z]+) ([^"]+)" (\d+)/', $line, $matches)) {
                $activities[] = [
                    'type' => 'visit',
                    'action' => $matches[3] . ' request',
                    'ip' => $matches[1],
                    'page' => basename($matches[4]),
                    'timestamp' => time() - rand(0, 3600), // Mock time for now
                    'userAgent' => 'Browser'
                ];
                
                if (count($activities) >= 20) break;
            }
        }
    }
    
    return $activities;
}

function getTopPages() {
    $pages = [];
    $pageCount = [];
    
    if (file_exists(ACCESS_LOG)) {
        $lines = tailFile(ACCESS_LOG, 200);
        
        foreach ($lines as $line) {
           if (preg_match('/"[A-Z]+ ([^ ]+) /', $line, $matches)) {
                $page = basename($matches[1]);
                if (strpos($page, '.html') !== false || $page === '/') {
                    $pageCount[$page] = ($pageCount[$page] ?? 0) + 1;
                }
            }
        }
        
        arsort($pageCount);
        
        foreach (array_slice($pageCount, 0, 5) as $page => $count) {
            $pages[] = [
                'name' => $page === '/' ? 'Home' : str_replace('.html', '', $page),
                'count' => $count
            ];
        }
    }
    
    return $pages;
}

function getTopReferrers() {
    return [
        ['source' => 'Direct', 'count' => rand(50, 200)],
        ['source' => 'Google', 'count' => rand(20, 100)]
    ];
}

function tailFile($filepath, $lines = 100) {
    if (!file_exists($filepath)) return [];
    
    $file = fopen($filepath, 'r');
    if (!$file) return [];
    
    $buffer = 4096;
    fseek($file, -1, SEEK_END);
    
    if (ftell($file) === 0) {
        fclose($file);
        return [];
    }
    
    $output = '';
    $chunk = '';
    $lines_found = 0;
    
    while (ftell($file) > 0 && $lines_found < $lines) {
        $seek = min(ftell($file), $buffer);
        fseek($file, -$seek, SEEK_CUR);
        $chunk = fread($file, $seek);
        $output = $chunk . $output;
        fseek($file, -$seek, SEEK_CUR);
        $lines_found = substr_count($output, "\n");
    }
    
    fclose($file);
    
    $arr = explode("\n", trim($output));
    return array_slice($arr, -$lines);
}
?>
