<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration - UPDATE THESE!
$db_host = 'localhost';
$db_name = 'burntai_db';  // UPDATE THIS
$db_user = 'burntai_app';        // UPDATE THIS
$db_pass = 'HUX9JoNC74DXdVFiLkKUIsnfv';    // UPDATE THIS

try {
    $pdo = new PDO("pgsql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get high scores
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $mode = isset($_GET['mode']) ? $_GET['mode'] : 'CLASSIC';
        $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : 'NORMAL';
        
        try {
            $stmt = $pdo->prepare("
                SELECT player_name, score, created_at 
                FROM ai_vault.neural_serpent_scores 
                WHERE game_mode = :mode AND difficulty = :difficulty
                ORDER BY score DESC 
                LIMIT :limit
            ");
            $stmt->bindParam(':mode', $mode);
            $stmt->bindParam(':difficulty', $difficulty);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'scores' => $scores]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch scores: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // Submit new score
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['player_name']) || !isset($data['score'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        $player_name = substr(trim($data['player_name']), 0, 50);
        $score = intval($data['score']);
        $game_mode = isset($data['game_mode']) ? $data['game_mode'] : 'CLASSIC';
        $difficulty = isset($data['difficulty']) ? $data['difficulty'] : 'NORMAL';
        $ip_address = $_SERVER['REMOTE_ADDR'];
        
        // Basic anti-cheat: Check if score is reasonable
        if ($score < 0 || $score > 99999) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid score']);
            exit;
        }
        
        // Rate limiting: Max 5 submissions per minute per IP
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM neural_serpent_scores 
            WHERE ip_address = :ip 
            AND created_at > NOW() - INTERVAL '1 minute'
        ");
        $stmt->bindParam(':ip', $ip_address);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] >= 5) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many submissions. Please wait.']);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO ai_vault.neural_serpent_scores 
                (player_name, score, game_mode, difficulty, ip_address) 
                VALUES (:name, :score, :mode, :difficulty, :ip)
            ");
            $stmt->bindParam(':name', $player_name);
            $stmt->bindParam(':score', $score);
            $stmt->bindParam(':mode', $game_mode);
            $stmt->bindParam(':difficulty', $difficulty);
            $stmt->bindParam(':ip', $ip_address);
            $stmt->execute();
            
            // Get player's rank
            $stmt = $pdo->prepare("
                SELECT COUNT(*) + 1 as rank 
                FROM neural_serpent_scores 
                WHERE score > :score 
                AND game_mode = :mode 
                AND difficulty = :difficulty
            ");
            $stmt->bindParam(':score', $score);
            $stmt->bindParam(':mode', $game_mode);
            $stmt->bindParam(':difficulty', $difficulty);
            $stmt->execute();
            $rank = $stmt->fetch(PDO::FETCH_ASSOC)['rank'];
            
            echo json_encode([
                'success' => true, 
                'rank' => $rank,
                'message' => "Score submitted! You ranked #$rank"
            ]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit score: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
