<?php
// Direct test - manually set the keys as they work in curl
$ANTHROPIC_KEY = 'YOUR-ACTUAL-ANTHROPIC-KEY-HERE';
$OPENAI_KEY = 'YOUR-ACTUAL-OPENAI-KEY-HERE';

echo "Testing keys directly in PHP...\n\n";

// Test Anthropic
echo "Anthropic Test:\n";
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'x-api-key: ' . $ANTHROPIC_KEY,
        'anthropic-version: 2023-06-01',
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'claude-3-haiku-20240307',
        'max_tokens' => 10,
        'messages' => [['role' => 'user', 'content' => 'Say hello']]
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Anthropic API working in PHP!\n";
    $data = json_decode($response, true);
    echo "Claude said: " . $data['content'][0]['text'] . "\n";
} else {
    echo "❌ Error: HTTP $httpCode\n";
}
?>
