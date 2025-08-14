<?php
/**
 * Individual API Tester
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

loadEnv();
header('Content-Type: text/plain; charset=UTF-8');

$api = $_GET['api'] ?? '';

switch ($api) {
    case 'openai':
        $key = getenv('OPENAI_API_KEY');
        if (!$key) {
            echo "❌ No OpenAI API key found in .env\n";
            break;
        }
        
        echo "Testing OpenAI API...\n";
        echo "Key format: " . (strpos($key, 'sk-proj-') === 0 ? 'Project Key' : 'Standard Key') . "\n\n";
        
        // Test API - List models
        $ch = curl_init('https://api.openai.com/v1/models');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $key,
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            echo "❌ cURL Error: $error\n";
        } elseif ($httpCode === 200) {
            echo "✅ API Key is VALID!\n\n";
            $data = json_decode($response, true);
            echo "Available Models:\n";
            if (!empty($data['data'])) {
                $models = array_slice($data['data'], 0, 5);
                foreach ($models as $model) {
                    echo "  - " . $model['id'] . "\n";
                }
                echo "\nTotal models: " . count($data['data']) . "\n";
            }
        } elseif ($httpCode === 401) {
            echo "❌ API Key is INVALID (401 Unauthorized)\n";
            $data = json_decode($response, true);
            if (isset($data['error']['message'])) {
                echo "Error: " . $data['error']['message'] . "\n";
            }
        } else {
            echo "❌ Unexpected response (HTTP $httpCode)\n";
            echo substr($response, 0, 500) . "\n";
        }
        break;
        
    case 'anthropic':
        $key = getenv('ANTHROPIC_API_KEY');
        if (!$key) {
            echo "❌ No Anthropic API key found in .env\n";
            break;
        }
        
        echo "Testing Anthropic API...\n";
        echo "Key format: " . (strpos($key, 'sk-ant-') === 0 ? 'Valid format' : 'Unknown format') . "\n\n";
        
        // Test API - Simple completion
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'x-api-key: ' . $key,
                'anthropic-version: 2023-06-01',
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'model' => 'claude-3-haiku-20240307',
                'max_tokens' => 10,
                'messages' => [
                    ['role' => 'user', 'content' => 'Say "API works"']
                ]
            ]),
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            echo "❌ cURL Error: $error\n";
        } elseif ($httpCode === 200) {
            echo "✅ API Key is VALID!\n\n";
            $data = json_decode($response, true);
            if (isset($data['content'][0]['text'])) {
                echo "Claude response: " . $data['content'][0]['text'] . "\n";
            }
            echo "Model used: " . ($data['model'] ?? 'unknown') . "\n";
            echo "Usage: " . ($data['usage']['input_tokens'] ?? 0) . " input, " . 
                 ($data['usage']['output_tokens'] ?? 0) . " output tokens\n";
        } elseif ($httpCode === 401) {
            echo "❌ API Key is INVALID (401 Unauthorized)\n";
            $data = json_decode($response, true);
            if (isset($data['error']['message'])) {
                echo "Error: " . $data['error']['message'] . "\n";
            }
        } elseif ($httpCode === 400) {
            echo "⚠️ Bad Request (HTTP 400)\n";
            $data = json_decode($response, true);
            echo "This might mean the model name has changed.\n";
            if (isset($data['error']['message'])) {
                echo "Error: " . $data['error']['message'] . "\n";
            }
        } else {
            echo "❌ Unexpected response (HTTP $httpCode)\n";
            echo substr($response, 0, 500) . "\n";
        }
        break;
        
    case 'newsapi':
    $key = getenv('NEWSAPI_KEY');
    if (!$key) {
        echo "❌ No NewsAPI key found in .env (this is optional)\n";
        break;
    }
    
    echo "Testing NewsAPI...\n";
    echo "Key: " . substr($key, 0, 4) . "..." . substr($key, -4) . "\n\n";
    
    // Use the same query that worked in curl
    $params = [
        'q' => 'AI',
        'pageSize' => 3,
        'apiKey' => $key
    ];
    
    $url = 'https://newsapi.org/v2/everything?' . http_build_query($params);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'User-Agent: BurntAI/1.0'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ cURL Error: $error\n";
    } elseif ($httpCode === 200) {
        echo "✅ API Key is VALID!\n\n";
        $data = json_decode($response, true);
        if ($data['status'] === 'ok') {
            echo "Status: OK\n";
            echo "Total Results: " . number_format($data['totalResults']) . "\n";
            if (!empty($data['articles'])) {
                echo "\nLatest AI articles:\n";
                foreach ($data['articles'] as $article) {
                    echo "  - " . $article['title'] . "\n";
                    echo "    Source: " . $article['source']['name'] . "\n";
                }
            }
        }
    } else {
        echo "❌ Unexpected response (HTTP $httpCode)\n";
        $data = json_decode($response, true);
        if (isset($data['message'])) {
            echo "Error: " . $data['message'] . "\n";
        }
    }
    break;
        
    default:
        echo "Invalid API parameter. Use: ?api=openai, ?api=anthropic, or ?api=newsapi\n";
}
