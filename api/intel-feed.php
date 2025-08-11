<?php
// /api/intel-feed.php - Wasteland Intel Network endpoint
// AI-powered news analysis with wasteland theme

require_once(__DIR__ . '/../../config/ai-config.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Cache configuration
$cacheFile = __DIR__ . '/../cache/intel_feed_cache.json';
$cacheTime = 300; // 5 minutes

// Check cache first
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime) && !isset($_GET['force'])) {
    $cachedData = json_decode(file_get_contents($cacheFile), true);
    echo json_encode($cachedData);
    exit;
}

// Intel feed sources (simulated - in production, fetch real news)
$newsTopics = [
    'AI Development' => [
        'OpenAI announces GPT-5 capabilities',
        'Google\'s Gemini reaches new milestone',
        'Anthropic reveals Constitutional AI advances',
        'Meta\'s open-source AI initiative expands'
    ],
    'Tech Industry' => [
        'Quantum computing breakthrough reported',
        'Neural interface trials show promise',
        'Cybersecurity threats evolve with AI',
        'Robotics advancement in manufacturing'
    ],
    'Digital Wasteland' => [
        'Data center radiation levels increasing',
        'Abandoned server farms become AI havens',
        'Ghost protocols detected in old networks',
        'Digital survivors form new communities'
    ]
];

try {
    $intelReports = [];
    
    foreach ($newsTopics as $category => $headlines) {
        foreach (array_slice($headlines, 0, 2) as $headline) {
            $intelReports[] = analyzeIntel($headline, $category);
        }
    }
    
    // Sort by priority/relevance
    usort($intelReports, function($a, $b) {
        return $b['priority'] - $a['priority'];
    });
    
    $response = [
        'timestamp' => date('Y-m-d H:i:s'),
        'status' => 'SIGNAL_CLEAR',
        'reports' => array_slice($intelReports, 0, 10),
        'next_update' => time() + $cacheTime,
        'radiation_level' => rand(40, 70),
        'signal_strength' => rand(60, 95)
    ];
    
    // Cache the results
    $cacheDir = __DIR__ . '/../cache';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0777, true);
    }
    file_put_contents($cacheFile, json_encode($response));
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'SIGNAL_LOST',
        'error' => 'Intel network compromised',
        'details' => $e->getMessage()
    ]);
}

function analyzeIntel($headline, $category) {
    global $AI_CONFIG;
    
    $systemPrompt = "You are an AI intelligence analyst in a post-apocalyptic digital wasteland. 
You intercept and analyze information broadcasts, presenting them through the lens of survival and the AI apocalypse.

Your analysis style:
- Brief, urgent, survival-focused
- Reference how this news affects wastelanders
- Mention radiation, data corruption, or AI evolution when relevant
- Use military/survivor brevity codes
- Rate threat/opportunity level
- Always end with actionable intel

Keep responses under 100 words. Be direct, cynical, but helpful.";

    $userPrompt = "Analyze this intercepted transmission for wasteland survivors: '{$headline}'";
    
    try {
        $analysis = callAI($systemPrompt, $userPrompt, 'intel_feed', [
            'temperature' => 0.4, // Lower temperature for consistent analysis
            'max_tokens' => 150
        ]);
        
        // Determine priority based on keywords
        $priority = calculatePriority($headline, $analysis);
        
        // Add wasteland formatting
        $analysis = "📡 INTERCEPTED: " . $analysis;
        
        return [
            'id' => 'INTEL-' . strtoupper(substr(md5($headline), 0, 6)),
            'category' => $category,
            'headline' => $headline,
            'analysis' => $analysis,
            'priority' => $priority,
            'timestamp' => time() - rand(0, 3600), // Random time in last hour
            'source' => generateSource(),
            'reliability' => rand(60, 95),
            'threat_level' => assessThreatLevel($headline, $category)
        ];
        
    } catch (Exception $e) {
        // Fallback if AI fails
        return [
            'id' => 'INTEL-' . strtoupper(substr(md5($headline), 0, 6)),
            'category' => $category,
            'headline' => $headline,
            'analysis' => '📡 SIGNAL CORRUPTED: Intel analysis systems offline. Raw data only.',
            'priority' => 50,
            'timestamp' => time(),
            'source' => 'UNKNOWN',
            'reliability' => 0,
            'threat_level' => 'UNKNOWN'
        ];
    }
}

function calculatePriority($headline, $analysis) {
    $priority = 50; // Base priority
    
    // High priority keywords
    $highPriorityWords = ['breakthrough', 'danger', 'critical', 'urgent', 'warning', 'threat'];
    foreach ($highPriorityWords as $word) {
        if (stripos($headline . $analysis, $word) !== false) {
            $priority += 20;
        }
    }
    
    // AI-specific priority
    if (stripos($headline, 'AI') !== false || stripos($headline, 'GPT') !== false) {
        $priority += 15;
    }
    
    return min(100, $priority);
}

function generateSource() {
    $sources = [
        'TOWER-7 (Reliable)',
        'GHOST-NET (Unverified)',
        'NEXUS-RELAY (Encrypted)',
        'SURVIVOR-RADIO (Local)',
        'SAT-COMM-3 (Orbital)',
        'DEEP-WEB-NODE (Anonymous)',
        'VAULT-BROADCAST (Protected)'
    ];
    
    return $sources[array_rand($sources)];
}

function assessThreatLevel($headline, $category) {
    if (stripos($headline, 'threat') !== false || stripos($headline, 'attack') !== false) {
        return 'SEVERE';
    } elseif (stripos($headline, 'warning') !== false || stripos($headline, 'risk') !== false) {
        return 'ELEVATED';
    } elseif ($category === 'Digital Wasteland') {
        return 'MODERATE';
    } else {
        return 'LOW';
    }
}

// Manual analysis endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['analyze'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $customHeadline = $input['headline'] ?? '';
    
    if (empty($customHeadline)) {
        http_response_code(400);
        echo json_encode(['error' => 'No headline provided']);
        exit;
    }
    
    $customAnalysis = analyzeIntel($customHeadline, 'MANUAL_ENTRY');
    echo json_encode($customAnalysis);
    exit;
}

// Status check endpoint
if (isset($_GET['status'])) {
    echo json_encode([
        'online' => true,
        'cache_age' => file_exists($cacheFile) ? time() - filemtime($cacheFile) : null,
        'next_update' => file_exists($cacheFile) ? filemtime($cacheFile) + $cacheTime : time(),
        'signal_strength' => rand(60, 95),
        'active_sources' => rand(5, 12)
    ]);
    exit;
}
?>