<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'test';

if ($action === 'test') {
    $logPath = '/var/log/nginx/';
    $accessLog = $logPath . 'burntai-dev_access.log';
    
    $response = [
        'status' => 'ok',
        'log_path' => $logPath,
        'access_log' => $accessLog,
        'exists' => file_exists($accessLog),
        'readable' => is_readable($accessLog),
        'size' => file_exists($accessLog) ? filesize($accessLog) : 0,
        'sample_lines' => []
    ];
    
    if (file_exists($accessLog) && is_readable($accessLog)) {
        $file = fopen($accessLog, 'r');
        if ($file) {
            for ($i = 0; $i < 3 && !feof($file); $i++) {
                $response['sample_lines'][] = fgets($file);
            }
            fclose($file);
        }
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'Unknown action']);
}
?>
