<?php
session_start();
require_once '../../config/ai-config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['prompt'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid request']));
}

try {
    // Rate limiting check
    $sessionId = session_id();
    $rateLimitKey = "avatar_gen_" . $sessionId;
    
    if (!checkAvatarRateLimit($rateLimitKey)) {
        throw new Exception('Rate limit exceeded. Please wait before generating another avatar.');
    }
    
    // Generate unique cache key
    $cacheKey = md5($input['prompt'] . json_encode($input['consciousness']));
    $cachedImage = checkImageCache($cacheKey);
    
    if ($cachedImage) {
        echo json_encode([
            'success' => true,
            'imageUrl' => $cachedImage,
            'cached' => true
        ]);
        exit;
    }
    
    // Call DALL-E 3 API
    $imageUrl = generateDALLE3Image(
        $input['prompt'],
        $input['size'] ?? '1024x1024',
        $input['quality'] ?? 'standard'
    );
    
    // Save to cache
    saveImageToCache($cacheKey, $imageUrl);
    
    // Log the generation
    logAvatarGeneration([
        'consciousness_name' => $input['consciousness']['name'] ?? 'Unknown',
        'traits' => $input['consciousness']['traits'] ?? [],
        'prompt_length' => strlen($input['prompt']),
        'timestamp' => time(),
        'session_id' => $sessionId
    ]);
    
    // Return success
    echo json_encode([
        'success' => true,
        'imageUrl' => 'USE_DYNAMIC_3D', // Special flag
        'method' => 'dynamic3d'
        'cached' => false
    ]);
    
} catch (Exception $e) {
    error_log("Avatar generation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

// Helper functions
function generateDALLE3Image($prompt, $size = '1024x1024', $quality = 'standard') {
    global $openai_api_key;
    
    if (!$openai_api_key) {
        throw new Exception('OpenAI API key not configured');
    }
    
    $ch = curl_init('https://api.openai.com/v1/images/generations');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $openai_api_key
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'dall-e-3',
        'prompt' => $prompt,
        'n' => 1,
        'size' => $size,
        'quality' => $quality,
        'style' => 'vivid',
        'response_format' => 'url'
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception('DALL-E API error: ' . ($error['error']['message'] ?? 'Unknown error'));
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['data'][0]['url'])) {
        throw new Exception('Invalid DALL-E response format');
    }
    
    return $data['data'][0]['url'];
}

function checkAvatarRateLimit($key) {
    $cacheDir = '../cache/rate_limits/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0777, true);
    }
    
    $file = $cacheDir . md5($key) . '.txt';
    $limit = 10; // 10 generations per hour
    $window = 3600; // 1 hour
    
    $now = time();
    $requests = [];
    
    if (file_exists($file)) {
        $data = file_get_contents($file);
        $requests = $data ? explode("\n", trim($data)) : [];
    }
    
    // Remove old requests
    $requests = array_filter($requests, function($timestamp) use ($now, $window) {
        return ($now - intval($timestamp)) < $window;
    });
    
    if (count($requests) >= $limit) {
        return false;
    }
    
    // Add current request
    $requests[] = $now;
    file_put_contents($file, implode("\n", $requests));
    
    return true;
}

function checkImageCache($key) {
    $cacheFile = '../cache/avatars/' . $key . '.json';
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        
        // Check if cache is still valid (24 hours)
        if ($data && isset($data['url']) && (time() - $data['timestamp']) < 86400) {
            return $data['url'];
        }
    }
    
    return false;
}

function saveImageToCache($key, $url) {
    $cacheDir = '../cache/avatars/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0777, true);
    }
    
    $data = [
        'url' => $url,
        'timestamp' => time()
    ];
    
    file_put_contents($cacheDir . $key . '.json', json_encode($data));
}

function logAvatarGeneration($data) {
    $logFile = '../logs/avatar_generations.log';
    $logEntry = date('Y-m-d H:i:s') . ' | ' . json_encode($data) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}
?>
