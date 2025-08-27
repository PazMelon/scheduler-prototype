<?php
require 'db.php';

/* ---- 1.  Which department do we want?  ---- */
$dept = $_GET['department'] ?? null;          // e.g. “CJP”, “TEP” …

if ($dept) {
    /* ----- only teachers from that department ----- */
    $stmt = $pdo->prepare('SELECT * FROM teachers
                           WHERE department = ?
                           ORDER BY last_name');
    $stmt->execute([$dept]);
} else {
    /* ----- all teachers (default, no filter) ----- */
    $stmt = $pdo->query('SELECT * FROM teachers ORDER BY last_name');
}

$teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($teachers);
