<?php
require 'db.php';
header('Content-Type: application/json');

/* ---------- Input & basic validation -------------------------------- */
$start = $_POST['start'] ?? null;
$end = $_POST['end'] ?? null;
$class_name = trim($_POST['class_name'] ?? '');
$room_id = intval($_POST['room_id'] ?? 0);
$teacher_id = intval($_POST['teacher_id'] ?? 0);

if (!$start || !$end || $class_name === '' || $room_id <= 0 || $teacher_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

/* ---------- Parse ISO string (UTC) ----------------------------------- */
$dtStart = new DateTime($start, new DateTimeZone('UTC'));
$dtEnd = new DateTime($end, new DateTimeZone('UTC'));

$day = $dtStart->format('l');          // **NEW** – UTC weekday
$start_time = $dtStart->format('H:i:s');
$end_time = $dtEnd->format('H:i:s');

if ($start_time >= $end_time) {
    echo json_encode(['success' => false, 'Conflict', 'description' => 'Start time must be before end time']);
    exit;
}

/* ---------- 1️⃣ Teacher‑conflict check -------------------------------- */
$sqlTeach = "SELECT 1 FROM schedule
             WHERE day = ?
               AND teacher_id = ?
               AND ((start_time < ? AND end_time > ?) OR (start_time >= ? AND start_time < ?))";
$stmt = $pdo->prepare($sqlTeach);
$stmt->execute([$day, $teacher_id, $end_time, $start_time, $start_time, $end_time]);

if ($stmt->rowCount() > 0) {
    echo json_encode(['success' => false, 'error' => 'Teacher Conflict', 'description' => 'Teacher is already scheduled for this time slot']);
    exit;
}

/* ---------- 2️⃣ Room‑conflict check --------------------------------- */
$sqlRoom = "SELECT s.id, s.class_name, r.name AS room_name,
                   t.first_name, t.last_name,
                   s.start_time, s.end_time
            FROM schedule s
            JOIN rooms r ON s.room_id = r.id
            LEFT JOIN teachers t ON s.teacher_id = t.id
            WHERE s.day = ?
              AND s.room_id = ?
              AND ((s.start_time < ? AND s.end_time > ?) OR (s.start_time >= ? AND s.start_time < ?))";
$stmt = $pdo->prepare($sqlRoom);
$stmt->execute([$day, $room_id, $end_time, $start_time, $start_time, $end_time]);

$conflicts = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($stmt->rowCount() > 0) {
    $available = getAvailableRooms($pdo, $day, $start_time, $end_time);
    echo json_encode([
        'success' => false,
        'error' => 'Room Conflict',
        'available_rooms' => $available,
        'conflicts' => $conflicts   // <‑ NEW
    ]);
    exit;
}

/* ---------- 3️⃣ Insert ------------------------------------------------ */
$sql = "INSERT INTO schedule (class_name, room_id, day, start_time, end_time, teacher_id)
        VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);
$ok = $stmt->execute([$class_name, $room_id, $day, $start_time, $end_time, $teacher_id]);

if ($ok) {
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} else {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}

/* ---------- Helper: rooms that are free in this slot ----------------- */
function getAvailableRooms(PDO $pdo, string $day, string $start_time, string $end_time): array
{
    $sql = "SELECT id, name FROM rooms WHERE id NOT IN (
                SELECT room_id FROM schedule
                WHERE day = ?
                  AND ((start_time < ? AND end_time > ?) OR (start_time >= ? AND start_time < ?))
            )";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$day, $end_time, $start_time, $start_time, $end_time]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>