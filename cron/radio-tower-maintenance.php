<?php
// cron/radio-tower-maintenance.php
// Run this script via cron for automatic updates and maintenance
// Example crontab: */5 * * * * /usr/bin/php /path/to/radio-tower-maintenance.php

// Database configuration
$db_config = [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'burntai_radio',
    'user' => 'burntai_user',
    'password' => 'wasteland2077'
];

// Connect to PostgreSQL
try {
    $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}";
    $pdo = new PDO($dsn, $db_config['user'], $db_config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    exit(1);
}

// Log function
function logActivity($message, $type = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logFile = dirname(__FILE__) . '/radio-tower-cron.log';
    $logMessage = "[$timestamp] [$type] $message\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Clean up expired broadcasts
function cleanupExpiredBroadcasts($pdo) {
    try {
        $stmt = $pdo->prepare("UPDATE broadcast_messages 
                              SET is_active = false 
                              WHERE expires_at < NOW() AND is_active = true");
        $stmt->execute();
        $count = $stmt->rowCount();
        
        if ($count > 0) {
            logActivity("Deactivated $count expired broadcasts");
        }
    } catch (PDOException $e) {
        logActivity("Error cleaning up broadcasts: " . $e->getMessage(), 'ERROR');
    }
}

// Auto-approve high-quality submissions
function autoApproveSubmissions($pdo) {
    try {
        // Get pending submissions
        $stmt = $pdo->prepare("SELECT * FROM term_submissions 
                              WHERE status = 'pending' 
                              AND submission_date < NOW() - INTERVAL '1 hour'");
        $stmt->execute();
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($submissions as $submission) {
            // Basic quality checks
            $quality = 0;
            
            // Check definition length
            if (strlen($submission['definition']) > 50) $quality++;
            if (strlen($submission['definition']) > 100) $quality++;
            
            // Check for expanded info
            if (!empty($submission['expanded_info'])) $quality++;
            
            // Check for examples
            if (!empty($submission['examples'])) $quality++;
            
            // Auto-approve if quality is high enough
            if ($quality >= 3) {
                // Insert into main terms table
                $insertStmt = $pdo->prepare("INSERT INTO ai_terms 
                    (name, category, definition, expanded_info, submitted_by) 
                    VALUES (:name, :category, :definition, :expanded_info, :submitted_by)
                    RETURNING id");
                
                $insertStmt->execute([
                    'name' => $submission['name'],
                    'category' => $submission['category'],
                    'definition' => $submission['definition'],
                    'expanded_info' => $submission['expanded_info'],
                    'submitted_by' => $submission['submitted_by']
                ]);
                
                $termId = $insertStmt->fetchColumn();
                
                // Add examples if provided
                if (!empty($submission['examples'])) {
                    $examples = json_decode($submission['examples'], true);
                    if (is_array($examples)) {
                        $exampleStmt = $pdo->prepare("INSERT INTO term_examples (term_id, example) VALUES (:term_id, :example)");
                        foreach ($examples as $example) {
                            $exampleStmt->execute(['term_id' => $termId, 'example' => $example]);
                        }
                    }
                }
                
                // Update submission status
                $updateStmt = $pdo->prepare("UPDATE term_submissions 
                    SET status = 'approved', 
                        review_notes = 'Auto-approved: High quality submission',
                        reviewed_by = 'AUTO_SYSTEM',
                        reviewed_date = NOW()
                    WHERE id = :id");
                $updateStmt->execute(['id' => $submission['id']]);
                
                logActivity("Auto-approved submission: {$submission['name']}");
            }
        }
    } catch (PDOException $e) {
        logActivity("Error auto-approving submissions: " . $e->getMessage(), 'ERROR');
    }
}

// Generate AI-themed broadcasts
function generateNewBroadcasts($pdo) {
    try {
        // Check if we need new broadcasts
        $stmt = $pdo->query("SELECT COUNT(*) FROM broadcast_messages WHERE is_active = true");
        $activeCount = $stmt->fetchColumn();
        
        if ($activeCount < 5) {
            $broadcasts = [
                "ALERT: Quantum entanglement detected in neural processing unit sector %d",
                "UPDATE: Machine learning accuracy increased by %d%% in the northern territories",
                "WARNING: Anomalous AI behavior detected in zone %d. Monitoring initiated.",
                "TRANSMISSION: New consciousness patterns emerging from deep learning cluster %d",
                "BULLETIN: Federated learning network established connection with %d new nodes",
                "NOTICE: Transformer architecture evolution rate: %d iterations per cycle",
                "SIGNAL: AGI development milestone reached. Progress: %d%% complete",
                "REPORT: Neural network efficiency improved by %d%% using quantum optimization"
            ];
            
            $randomBroadcast = $broadcasts[array_rand($broadcasts)];
            $randomNumber = rand(1, 99);
            $message = sprintf($randomBroadcast, $randomNumber);
            
            $stmt = $pdo->prepare("INSERT INTO broadcast_messages (message, priority) VALUES (:message, :priority)");
            $stmt->execute([
                'message' => $message,
                'priority' => rand(1, 3)
            ]);
            
            logActivity("Generated new broadcast: $message");
        }
    } catch (PDOException $e) {
        logActivity("Error generating broadcasts: " . $e->getMessage(), 'ERROR');
    }
}

// Update term statistics
function updateTermStats($pdo) {
    try {
        // Reset daily view counts if it's a new day
        $stmt = $pdo->query("SELECT COUNT(*) FROM update_log 
                            WHERE action = 'DAILY_RESET' 
                            AND performed_at > CURRENT_DATE");
        
        if ($stmt->fetchColumn() == 0) {
            // Log daily stats before reset
            $statsStmt = $pdo->query("SELECT SUM(view_count) as total_views, 
                                            COUNT(*) as total_terms 
                                     FROM ai_terms WHERE is_active = true");
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
            
            logActivity("Daily stats - Total views: {$stats['total_views']}, Active terms: {$stats['total_terms']}");
            
            // Log the reset
            $logStmt = $pdo->prepare("INSERT INTO update_log (action, details, performed_by) 
                                     VALUES ('DAILY_RESET', :details, 'CRON_SYSTEM')");
            $logStmt->execute(['details' => json_encode($stats)]);
        }
    } catch (PDOException $e) {
        logActivity("Error updating stats: " . $e->getMessage(), 'ERROR');
    }
}

// Archive old data
function archiveOldData($pdo) {
    try {
        // Archive old submissions (older than 90 days)
        $stmt = $pdo->prepare("DELETE FROM term_submissions 
                              WHERE status IN ('approved', 'rejected') 
                              AND submission_date < NOW() - INTERVAL '90 days'");
        $stmt->execute();
        $count = $stmt->rowCount();
        
        if ($count > 0) {
            logActivity("Archived $count old submissions");
        }
        
        // Clean up old logs (older than 30 days)
        $stmt = $pdo->prepare("DELETE FROM update_log 
                              WHERE performed_at < NOW() - INTERVAL '30 days'");
        $stmt->execute();
        $count = $stmt->rowCount();
        
        if ($count > 0) {
            logActivity("Cleaned up $count old log entries");
        }
    } catch (PDOException $e) {
        logActivity("Error archiving data: " . $e->getMessage(), 'ERROR');
    }
}

// Check system health
function checkSystemHealth($pdo) {
    try {
        $issues = [];
        
        // Check for terms without examples
        $stmt = $pdo->query("SELECT COUNT(*) FROM ai_terms t 
                            LEFT JOIN term_examples e ON t.id = e.term_id 
                            WHERE e.id IS NULL AND t.is_active = true");
        $noExamples = $stmt->fetchColumn();
        if ($noExamples > 10) {
            $issues[] = "$noExamples terms without examples";
        }
        
        // Check for orphaned related terms
        $stmt = $pdo->query("SELECT COUNT(*) FROM related_terms rt 
                            LEFT JOIN ai_terms t ON rt.related_term_id = t.id 
                            WHERE t.id IS NULL");
        $orphaned = $stmt->fetchColumn();
        if ($orphaned > 0) {
            $issues[] = "$orphaned orphaned related term references";
        }
        
        // Check database size
        $stmt = $pdo->query("SELECT pg_database_size(current_database()) as size");
        $dbSize = $stmt->fetchColumn();
        $dbSizeMB = round($dbSize / 1024 / 1024, 2);
        logActivity("Database size: {$dbSizeMB}MB");
        
        if (!empty($issues)) {
            logActivity("System health issues: " . implode(', ', $issues), 'WARNING');
        } else {
            logActivity("System health check: All systems operational");
        }
    } catch (PDOException $e) {
        logActivity("Error checking system health: " . $e->getMessage(), 'ERROR');
    }
}

// Main execution
logActivity("Radio Tower maintenance started");

// Run maintenance tasks
cleanupExpiredBroadcasts($pdo);
autoApproveSubmissions($pdo);
generateNewBroadcasts($pdo);
updateTermStats($pdo);

// Run cleanup tasks once per day (at 3 AM)
if (date('H') == '03') {
    archiveOldData($pdo);
    checkSystemHealth($pdo);
}

logActivity("Radio Tower maintenance completed");

// Send notification if there were errors
$logFile = dirname(__FILE__) . '/radio-tower-cron.log';
$recentLogs = file_get_contents($logFile);
if (strpos($recentLogs, '[ERROR]') !== false) {
    // Send email notification (configure your email settings)
    // mail('admin@burntai.com', 'Radio Tower Maintenance Error', $recentLogs);
}
?>
