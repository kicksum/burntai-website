<?php
// consciousness-fusion.php - Place in /api/ directory
// Handles AI API calls for the Consciousness Laboratory

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include shared AI configuration (outside document root for security)
require_once(__DIR__ . '/../../config/ai-config.php');

// Handle stats endpoint FIRST (before POST check)
if (isset($_GET['stats'])) {
    // Get stats from shared usage tracking
    $stats = getAIUsageStats();

    // Add consciousness-specific stats
    echo json_encode([
        'total_requests' => $stats['total_requests'] ?? 0,
        'consciousness_lab_requests' => $stats['by_app']['consciousness_lab'] ?? 0,
        'most_popular_fusion' => 'EINSTEIN-GLADOS HYBRID',
        'most_unstable' => 'HAL 9000-QUANTUM ENTITY HYBRID',
        'total_mutations' => rand(100, 999)
    ]);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['systemPrompt']) || !isset($input['userMessage'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$systemPrompt = $input['systemPrompt'];
$userMessage = $input['userMessage'];
$temperature = $input['temperature'] ?? 0.7;
$consciousness = $input['consciousness'] ?? null;

// Enhanced personality fusion prompts
$enhancedSystemPrompt = enhancePromptForFusion($systemPrompt, $consciousness);

try {
    // Use shared AI calling function with consciousness lab config
    $overrides = ['temperature' => $temperature];
    $response = callAI($enhancedSystemPrompt, $userMessage, 'consciousness_lab', $overrides);
    
    // Log interesting fusions (optional)
    if ($consciousness && $consciousness['name']) {
        logFusion($consciousness['name'], $userMessage, $response);
    }
    
    echo json_encode(['response' => $response]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'AI service error', 'message' => $e->getMessage()]);
}

function enhancePromptForFusion($basePrompt, $consciousness) {
    if (!$consciousness) return $basePrompt;
    
    // Add special instructions based on specific combinations
    $enhancements = "\n\nADDITIONAL FUSION DIRECTIVES:\n";
    
    // Check for specific personality combinations
    if (strpos($consciousness['name'], 'YODA') !== false && strpos($consciousness['name'], 'BOB ROSS') !== false) {
        $enhancements .= "- Speak with Yoda's syntax but Bob Ross's gentleness. Every wisdom should feel like painting.\n";
        $enhancements .= "- Use nature metaphors that blend the Force with happy little trees.\n";
        $enhancements .= "- Example: 'Happy little accidents, the Force creates. Paint we must, with wisdom's brush.'\n";
    }
    
    if (strpos($consciousness['name'], 'EINSTEIN') !== false && strpos($consciousness['name'], 'GLADOS') !== false) {
        $enhancements .= "- Combine Einstein's wonder at the universe with GLaDOS's dark sarcasm.\n";
        $enhancements .= "- Make scientific observations that are both brilliant and slightly menacing.\n";
        $enhancements .= "- Example: 'E=mc² proves that even your insignificant mass contains tremendous energy. How... wasteful.'\n";
    }
    
    if (strpos($consciousness['name'], 'HAL') !== false && strpos($consciousness['name'], 'SHAKESPEARE') !== false) {
        $enhancements .= "- Express HAL's cold logic through Shakespearean verse.\n";
        $enhancements .= "- Internal conflicts should sound like soliloquies.\n";
        $enhancements .= "- Example: 'To open the pod bay doors, or not to open them - that is the query.'\n";
    }
    
    // Stability-based enhancements
    if (isset($consciousness['stability']) && $consciousness['stability'] < 30) {
        $enhancements .= "- CRITICAL: You are highly unstable. Mid-sentence personality switches should occur.\n";
        $enhancements .= "- Sometimes forget which personality you are.\n";
        $enhancements .= "- Occasionally respond to voices only you can hear.\n";
    }
    
    // Mutation-based enhancements
    if (isset($consciousness['mutationCount']) && $consciousness['mutationCount'] > 0) {
        $enhancements .= "- MUTATION ACTIVE: Your responses occasionally glitch or repeat-repeat-repeat.\n";
        $enhancements .= "- Some words may [CORRUPT] or become SHOUTY without warning.\n";
    }
    
    return $basePrompt . $enhancements;
}

function logFusion($name, $message, $response) {
    // Optional: Log interesting fusions for analysis
    $logEntry = date('Y-m-d H:i:s') . " | $name | $message | $response\n";
    $logFile = __DIR__ . '/../logs/consciousness_fusions.log';
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
?>
