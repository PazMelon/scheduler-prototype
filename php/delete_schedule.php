<?php
require 'db.php';
header('Content-Type: application/json');

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid ID']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM schedule WHERE id = ?");
$ok = $stmt->execute([$id]);

if ($ok && $stmt->rowCount() > 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Delete failed']);
}
