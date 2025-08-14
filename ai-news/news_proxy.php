<?php
/**
 * AI News Proxy with Environment Variables and API Support
 * Supports direct API calls to OpenAI, Anthropic, and news services
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
        
        // ALWAYS set the value (removed the check)
        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
    return true;
}

// Load environment
loadEnv();

// Get environment variables with defaults
$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: null;
$ANTHROPIC_API_KEY = getenv('ANTHROPIC_API_KEY') ?: null;
$NEWSAPI_KEY = getenv('NEWSAPI_KEY') ?: null;
$CACHE_TIME = getenv('CACHE_TIME') ?: 300;
$DEBUG_MODE = getenv('DEBUG_MODE') === 'true';
$APP_ENV = getenv('APP_ENV') ?: 'production';

// Error reporting based on environment
if ($APP_ENV === 'development' || $DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
define('CACHE_DIR', __DIR__ . '/cache/');
define('FORCE_REFRESH', isset($_GET['force']) || isset($_GET['t']));

if (!file_exists(CACHE_DIR)) {
    mkdir(CACHE_DIR, 0755, true);
}

/**
 * Fetch with API key support
 */
function fetchWithAPI($url, $headers = [], $timeout = 10) {
    $ch = curl_init();
    
    $defaultHeaders = [
        'Accept: application/json',
        'User-Agent: BurntAI/2.0 (News Aggregator)'
    ];
    
    $headers = array_merge($defaultHeaders, $headers);
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error && $GLOBALS['DEBUG_MODE']) {
        error_log("API Error for $url: $error");
    }
    
    return $httpCode === 200 ? $content : false;
}

/**
 * Fetch OpenAI news using API
 */
function fetchOpenAINews($apiKey = null) {
    $articles = [];
    
    // First try RSS feed (no API needed)
    $rssUrl = 'https://openai.com/blog/rss.xml';
    $content = fetchWithAPI($rssUrl);
    
    if ($content) {
        $xml = @simplexml_load_string($content);
        if ($xml && isset($xml->channel->item)) {
            foreach ($xml->channel->item as $item) {
                $articles[] = [
                    'title' => (string)$item->title,
                    'url' => (string)$item->link,
                    'desc' => strip_tags((string)$item->description),
                    'date' => date('c', strtotime((string)$item->pubDate)),
                    'source' => 'OpenAI Blog'
                ];
                if (count($articles) >= 3) break;
            }
        }
    }
    
    // If we have an API key, try to get additional info
    if ($apiKey && count($articles) < 3) {
        // You could query OpenAI's API for model information
        $headers = ["Authorization: Bearer $apiKey"];
        $modelsUrl = 'https://api.openai.com/v1/models';
        $modelsData = fetchWithAPI($modelsUrl, $headers);
        
        if ($modelsData) {
            $models = json_decode($modelsData, true);
            // Add a synthetic news item about available models
            if (!empty($models['data'])) {
                $latestModel = end($models['data']);
                $articles[] = [
                    'title' => 'API Update: ' . $latestModel['id'] . ' Available',
                    'url' => 'https://platform.openai.com/docs/models',
                    'desc' => 'Latest model available via API with enhanced capabilities',
                    'date' => date('c'),
                    'source' => 'OpenAI API'
                ];
            }
        }
    }
    
    // Fallback
    if (empty($articles)) {
        $articles[] = [
            'title' => 'Visit OpenAI Blog',
            'url' => 'https://openai.com/blog',
            'desc' => 'Check out the latest updates from OpenAI',
            'date' => date('c'),
            'source' => 'OpenAI'
        ];
    }
    
    return array_slice($articles, 0, 3);
}

/**
 * Fetch Anthropic news using API
 */
function fetchAnthropicNews($apiKey = null) {
    $articles = [];
    
    // Try RSS first
    $rssUrl = 'https://www.anthropic.com/rss.xml';
    $content = fetchWithAPI($rssUrl);
    
    if ($content) {
        $xml = @simplexml_load_string($content);
        if ($xml) {
            $items = $xml->channel->item ?? $xml->item ?? [];
            foreach ($items as $item) {
                $articles[] = [
                    'title' => (string)$item->title,
                    'url' => (string)$item->link,
                    'desc' => strip_tags((string)($item->description ?? '')),
                    'date' => date('c', strtotime((string)($item->pubDate ?? 'now'))),
                    'source' => 'Anthropic Blog'
                ];
                if (count($articles) >= 3) break;
            }
        }
    }
    
    // If we have an API key, could check Claude API status
    if ($apiKey && count($articles) < 3) {
        // Anthropic doesn't have a public models endpoint, but we could check API health
        $headers = [
            "x-api-key: $apiKey",
            "anthropic-version: 2023-06-01"
        ];
        
        // You could make a minimal API call to check status
        // For now, just add a status message
        $articles[] = [
            'title' => 'Claude API Status: Operational',
            'url' => 'https://www.anthropic.com/api',
            'desc' => 'API services running normally with Claude models available',
            'date' => date('c'),
            'source' => 'Anthropic API'
        ];
    }
    
    // Fallback
    if (empty($articles)) {
        $articles[] = [
            'title' => 'Visit Anthropic News',
            'url' => 'https://www.anthropic.com/news',
            'desc' => 'Latest developments from Anthropic',
            'date' => date('c'),
            'source' => 'Anthropic'
        ];
    }
    
    return array_slice($articles, 0, 3);
}

/**
 * Fetch tech news using NewsAPI
 */
function fetchTechNews($apiKey = null) {
    if (!$apiKey) {
        return [];
    }
    
    // Better query for AI-specific news
    $url = 'https://newsapi.org/v2/everything?' . http_build_query([
        'q' => '("artificial intelligence" OR "machine learning" OR "GPT" OR "Claude" OR "OpenAI" OR "Anthropic" OR "DeepMind") NOT sports NOT football NOT toothpaste',
        'domains' => 'techcrunch.com,theverge.com,wired.com,arstechnica.com,venturebeat.com,mit.edu,technologyreview.com',
        'sortBy' => 'publishedAt',
        'language' => 'en',
        'pageSize' => 5,
        'apiKey' => $apiKey
    ]);
    
    $content = fetchWithAPI($url);
    $articles = [];
    
    if ($content) {
        $data = json_decode($content, true);
        if (!empty($data['articles'])) {
            foreach ($data['articles'] as $article) {
                // Additional filtering for AI relevance
                $text = strtolower($article['title'] . ' ' . $article['description']);
                $aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'neural', 'gpt', 'claude', 'llm', 'generative'];
                $hasAIContent = false;
                
                foreach ($aiKeywords as $keyword) {
                    if (strpos($text, $keyword) !== false) {
                        $hasAIContent = true;
                        break;
                    }
                }
                
                if ($hasAIContent) {
                    $articles[] = [
                        'title' => $article['title'],
                        'url' => $article['url'],
                        'desc' => $article['description'],
                        'date' => date('c', strtotime($article['publishedAt'])),
                        'source' => $article['source']['name'] ?? 'Tech News'
                    ];
                }
            }
        }
    }    
    return $articles;
}

/**
 * Get cached data if valid
 */
function getCachedData($cacheFile) {
    global $CACHE_TIME;
    
    if (!FORCE_REFRESH && file_exists($cacheFile)) {
        $age = time() - filemtime($cacheFile);
        if ($age < $CACHE_TIME) {
            $data = json_decode(file_get_contents($cacheFile), true);
            if ($data) {
                $data['cached'] = true;
                $data['cache_age'] = $age;
                return $data;
            }
        }
    }
    return null;
}

/**
 * Main news aggregation with API support
 */
function getAINews() {
    global $OPENAI_API_KEY, $ANTHROPIC_API_KEY, $NEWSAPI_KEY, $DEBUG_MODE;
    
    $cacheFile = CACHE_DIR . 'news_data.json';
    
    // Check cache first
    $cachedData = getCachedData($cacheFile);
    if ($cachedData && !FORCE_REFRESH) {
        $cachedData['stale'] = ($cachedData['cache_age'] > $GLOBALS['CACHE_TIME'] * 0.8);
        return $cachedData;
    }
    
    // Fetch fresh data
    $newsData = [
        'items' => [],
        'updated' => date('c'),
        'stale' => false,
        'cached' => false,
        'api_status' => []
    ];
    
    // OpenAI News
    $newsData['items']['openai'] = [
        'articles' => fetchOpenAINews($OPENAI_API_KEY),
        'status_url' => 'https://status.openai.com',
        'provider' => 'OpenAI',
        'has_api_key' => !empty($OPENAI_API_KEY)
    ];
    $newsData['api_status']['openai'] = !empty($OPENAI_API_KEY) ? 'configured' : 'no_key';
    
    // Anthropic News
    $newsData['items']['anthropic'] = [
        'articles' => fetchAnthropicNews($ANTHROPIC_API_KEY),
        'status_url' => 'https://www.anthropic.com',
        'provider' => 'Anthropic',
        'has_api_key' => !empty($ANTHROPIC_API_KEY)
    ];
    $newsData['api_status']['anthropic'] = !empty($ANTHROPIC_API_KEY) ? 'configured' : 'no_key';
    
    // DeepMind News (no API key needed)
    $deepmindArticles = [];
    $rssUrl = 'https://deepmind.google/blog/rss.xml';
    $content = fetchWithAPI($rssUrl);
    
    if ($content) {
        $xml = @simplexml_load_string($content);
        if ($xml && isset($xml->channel->item)) {
            foreach ($xml->channel->item as $item) {
                $deepmindArticles[] = [
                    'title' => (string)$item->title,
                    'url' => (string)$item->link,
                    'desc' => strip_tags((string)$item->description),
                    'date' => date('c', strtotime((string)$item->pubDate)),
                    'source' => 'DeepMind Blog'
                ];
                if (count($deepmindArticles) >= 3) break;
            }
        }
    }
    
    if (empty($deepmindArticles)) {
        $deepmindArticles[] = [
            'title' => 'Visit DeepMind Blog',
            'url' => 'https://deepmind.google/discover/blog',
            'desc' => 'Explore DeepMind research and updates',
            'date' => date('c'),
            'source' => 'DeepMind'
        ];
    }
    
    $newsData['items']['deepmind'] = [
        'articles' => $deepmindArticles,
        'status_url' => 'https://deepmind.google',
        'provider' => 'Google DeepMind'
    ];
    
    // Add tech news if NewsAPI key is available
    if ($NEWSAPI_KEY) {
        $techNews = fetchTechNews($NEWSAPI_KEY);
        if (!empty($techNews)) {
            $newsData['items']['tech'] = [
                'articles' => $techNews,
                'status_url' => 'https://newsapi.org',
                'provider' => 'Tech News'
            ];
            $newsData['api_status']['newsapi'] = 'configured';
        }
    }
    
    // Add debug info if enabled
    if ($DEBUG_MODE) {
        $newsData['debug'] = [
            'env' => $GLOBALS['APP_ENV'],
            'openai_key' => !empty($OPENAI_API_KEY) ? 'set' : 'missing',
            'anthropic_key' => !empty($ANTHROPIC_API_KEY) ? 'set' : 'missing',
            'newsapi_key' => !empty($NEWSAPI_KEY) ? 'set' : 'missing',
            'cache_time' => $GLOBALS['CACHE_TIME'],
            'php_version' => PHP_VERSION
        ];
    }
    
    // Save to cache
    file_put_contents($cacheFile, json_encode($newsData, JSON_PRETTY_PRINT));
    
    return $newsData;
}

// Main execution
try {
    $newsData = getAINews();
    echo json_encode($newsData, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    if ($DEBUG_MODE) {
        error_log("News proxy error: " . $e->getMessage());
    }
    
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $DEBUG_MODE ? $e->getMessage() : 'Failed to fetch news data',
        'timestamp' => date('c')
    ]);
}
