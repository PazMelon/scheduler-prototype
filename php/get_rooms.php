<?php
require 'db.php';
$stmt = $pdo->query('SELECT id, name FROM rooms ORDER BY name');
$rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rooms);
?>