<?php
/**
 * Radio Tower Networks API Endpoint
 * Fixed version using query parameters
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$db_config = [
    'host' => 'localhost',
    'port' => '5432', 
    'dbname' => 'burntai_radio',
    'user' => 'burntai_user',
    'password' => 'wasteland2077'
];

// Connect to database
try {
    $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Get the action from query parameters
$action = $_GET['action'] ?? 'terms';
$method = $_SERVER['REQUEST_METHOD'];

// Route the request
switch ($action) {
    case 'terms':
        handleTerms($pdo, $method);
        break;
    case 'broadcasts':
        handleBroadcasts($pdo);
        break;
    case 'submissions':
        handleSubmissions($pdo, $method);
        break;
    case 'stats':
        handleStats($pdo);
        break;
    case 'updates':
        handleUpdates($pdo);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found', 'requested_action' => $action]);
}

// Handler functions
function handleTerms($pdo, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        return;
    }
    
    try {
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        
        $sql = "SELECT 
                    t.id,
                    t.name,
                    t.category,
                    t.definition,
                    t.is_active,
                    t.view_count,
                    t.created_at,
                    t.updated_at,
                    COALESCE(array_agg(DISTINCT e.example) FILTER (WHERE e.example IS NOT NULL), '{}') as examples,
                    COALESCE(array_agg(DISTINCT rt_term.name) FILTER (WHERE rt_term.name IS NOT NULL), '{}') as related_terms
                FROM ai_terms t
                LEFT JOIN term_examples e ON t.id = e.term_id
                LEFT JOIN related_terms rt ON t.id = rt.term_id
                LEFT JOIN ai_terms rt_term ON rt.related_term_id = rt_term.id
                WHERE t.is_active = true";
        
        $params = [];
        
        if ($search) {
            $sql .= " AND (LOWER(t.name) LIKE LOWER(:search) OR LOWER(t.definition) LIKE LOWER(:search))";
            $params[':search'] = '%' . $search . '%';
        }
        
        if ($category && $category !== 'all') {
            $sql .= " AND t.category = :category";
            $params[':category'] = $category;
        }
        
        $sql .= " GROUP BY t.id ORDER BY t.name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $terms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert PostgreSQL arrays to PHP arrays
        foreach ($terms as &$term) {
            $term['examples'] = parsePostgresArray($term['examples']);
            $term['related_terms'] = parsePostgresArray($term['related_terms']);
        }
        
        echo json_encode(['status' => 'success', 'data' => $terms]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch terms: ' . $e->getMessage()]);
    }
}

function handleBroadcasts($pdo) {
    try {
        $sql = "SELECT id, message, priority, created_at 
                FROM broadcast_messages 
                WHERE is_active = true 
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY priority DESC, created_at DESC 
                LIMIT 5";
        
        $stmt = $pdo->query($sql);
        $broadcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['status' => 'success', 'data' => $broadcasts]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch broadcasts']);
    }
}

function handleSubmissions($pdo, $method) {
    if ($method === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['name']) || !isset($data['category']) || !isset($data['definition'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
                return;
            }
            
            $sql = "INSERT INTO term_submissions 
                    (name, category, definition, submitted_by, examples, related_terms) 
                    VALUES (:name, :category, :definition, :submitted_by, :examples, :related_terms)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $data['name'],
                ':category' => $data['category'],
                ':definition' => $data['definition'],
                ':submitted_by' => $data['submitted_by'] ?? 'Anonymous Wanderer',
                ':examples' => isset($data['examples']) ? json_encode($data['examples']) : null,
                ':related_terms' => isset($data['related_terms']) ? json_encode($data['related_terms']) : null
            ]);
            
            echo json_encode(['status' => 'success', 'message' => 'Submission received']);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to submit term']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
}

function handleStats($pdo) {
    try {
        $stats = [];
        
        // Total terms
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM ai_terms WHERE is_active = true");
        $stats['total_terms'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Terms by category
        $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM ai_terms WHERE is_active = true GROUP BY category");
        $stats['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Pending submissions
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM term_submissions WHERE status = 'pending'");
        $stats['pending_submissions'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Active broadcasts
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM broadcast_messages WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())");
        $stats['active_broadcasts'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode(['status' => 'success', 'data' => $stats]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch stats']);
    }
}

function handleUpdates($pdo) {
    try {
        $since = $_GET['since'] ?? 0;
        $since_date = date('Y-m-d H:i:s', $since / 1000);
        
        $sql = "SELECT COUNT(*) as count FROM ai_terms WHERE updated_at > :since";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':since' => $since_date]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $has_updates = $result['count'] > 0;
        
        echo json_encode(['status' => 'success', 'has_updates' => $has_updates]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to check updates']);
    }
}

// Helper function to parse PostgreSQL arrays
function parsePostgresArray($pgArray) {
    if ($pgArray === '{}' || empty($pgArray)) {
        return [];
    }
    
    // Remove the curly braces
    $pgArray = trim($pgArray, '{}');
    
    // Handle quoted elements
    if (strpos($pgArray, '"') !== false) {
        preg_match_all('/"([^"]+)"/', $pgArray, $matches);
        return $matches[1];
    }
    
    // Simple comma-separated values
    return array_filter(explode(',', $pgArray));
}
?>
