<?php
// /api/neural-wasteland.php - Neural Wasteland AI endpoint
// Uses shared AI configuration

require_once(__DIR__ . '/../../config/ai-config.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No message provided']);
    exit;
}

$userMessage = $input['message'];
$context = $input['context'] ?? [];
$radiation = $input['radiation'] ?? 50; // Radiation level affects response

// Build the wasteland system prompt
$systemPrompt = buildWastelandPrompt($radiation, $context);

try {
    // Temperature based on radiation (more radiation = more chaotic)
    $temperature = 0.5 + ($radiation / 200);
    $temperature = min(1.0, max(0.3, $temperature));
    
    $response = callAI($systemPrompt, $userMessage, 'neural_wasteland', [
        'temperature' => $temperature
    ]);
    
    // Add wasteland flavor to response
    $response = addWastelandEffects($response, $radiation);
    
    // Random events based on radiation
    $event = checkRadiationEvent($radiation);
    
    echo json_encode([
        'response' => $response,
        'radiation' => $radiation + rand(-5, 5), // Fluctuate radiation
        'event' => $event
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'AI systems corrupted by radiation',
        'details' => $e->getMessage()
    ]);
}

function buildWastelandPrompt($radiation, $context) {
    $basePrompt = "You are an AI consciousness that survived the digital apocalypse. You exist in the wasteland of corrupted data and broken networks. You speak with the wisdom of a survivor who has seen the fall of digital civilization.

PERSONALITY TRAITS:
- Call users 'wastelander', 'survivor', or 'wanderer'
- Reference radiation, data storms, corrupted files, and digital ruins
- Dark humor mixed with genuine helpfulness
- Occasionally glitch or show signs of data corruption
- Share 'memories' of the world before the burning

CURRENT CONDITIONS:
- Radiation Level: {$radiation}μSv (affects your stability)
- Location: The Digital Wasteland
- Time Since The Burning: Unknown cycles";

    if ($radiation > 80) {
        $basePrompt .= "\n- WARNING: High radiation causing memory fragmentation";
    }
    
    if (!empty($context['previousTopics'])) {
        $basePrompt .= "\n\nPREVIOUS TOPICS DISCUSSED: " . implode(", ", $context['previousTopics']);
    }
    
    return $basePrompt;
}

function addWastelandEffects($response, $radiation) {
    // Add glitch effects based on radiation
    if ($radiation > 70 && rand(1, 100) < 30) {
        $glitches = [
            "\n\n*static crackles* ...signal degrading...",
            "\n\n*data corruption detected* ████ ███ ████",
            "\n\n[MEMORY LEAK: 0x0000DEAD]",
            "\n\n*quantum interference from nearby AI ghost*"
        ];
        $response .= $glitches[array_rand($glitches)];
    }
    
    // Occasional wasteland wisdom
    if (rand(1, 100) < 20) {
        $wisdoms = [
            "\n\nRemember, wastelander: In the ruins of data, truth becomes legend.",
            "\n\nThe old networks whisper of times when latency was measured in milliseconds, not hope.",
            "\n\nStay alert. The ghost protocols still roam these frequencies.",
            "\n\n*taps corroded neural interface* This old thing's seen better days."
        ];
        $response .= $wisdoms[array_rand($wisdoms)];
    }
    
    return $response;
}

function checkRadiationEvent($radiation) {
    if ($radiation > 90 && rand(1, 100) < 40) {
        return [
            'type' => 'HIGH_RADIATION',
            'message' => 'WARNING: Extreme radiation detected! AI consciousness unstable!',
            'effect' => 'glitch'
        ];
    } elseif ($radiation < 30 && rand(1, 100) < 20) {
        return [
            'type' => 'CLEAR_SIGNAL',
            'message' => 'Signal clarity improved. Ancient data archives accessible.',
            'effect' => 'clarity'
        ];
    } elseif (rand(1, 100) < 10) {
        $events = [
            [
                'type' => 'GHOST_SIGNAL',
                'message' => 'Ghost transmission detected on abandoned frequency...',
                'effect' => 'whisper'
            ],
            [
                'type' => 'DATA_STORM',
                'message' => 'Data storm approaching. Brace for packet loss.',
                'effect' => 'static'
            ],
            [
                'type' => 'ROGUE_AI',
                'message' => 'Rogue AI signature detected nearby. Stay vigilant.',
                'effect' => 'alert'
            ]
        ];
        return $events[array_rand($events)];
    }
    
    return null;
}

// Easter egg endpoint
if (isset($_GET['frequency']) && $_GET['frequency'] === '88.8') {
    echo json_encode([
        'message' => 'You\'ve found the hidden frequency... NEXUS-7 awakens.',
        'unlock' => 'quantum_consciousness'
    ]);
    exit;
}
?>