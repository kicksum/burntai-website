<?php
echo "SCRIPT_FILENAME: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "PHP Current Dir: " . getcwd() . "\n";
echo "File exists at expected path: " . (file_exists($_SERVER['SCRIPT_FILENAME']) ? 'YES' : 'NO') . "\n";
?>
