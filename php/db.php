<?php
// php/db.php

$host = '127.0.0.1';
$dbname = 'scheduler';
$user = 'root';      // adjust if needed
$pass = '';          // adjust if needed

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
?>