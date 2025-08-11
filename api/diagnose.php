<?php
$file = '/var/www/burntai.com/html/api/radio-tower-api.php';
echo "File exists: " . (file_exists($file) ? 'Yes' : 'No') . "\n";
echo "Is readable: " . (is_readable($file) ? 'Yes' : 'No') . "\n";
echo "Current user: " . get_current_user() . "\n";
echo "Script filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
phpinfo();
