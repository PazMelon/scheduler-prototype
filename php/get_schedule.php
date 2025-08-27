<?php
require 'db.php';

header('Content-Type: application/json');
date_default_timezone_set('UTC');

/* ---------- 1.  Determine week start (FullCalendar will send it) ----------
   -------------------------------------------------------- */
$weekStart = strtotime($_GET['start'] ?? date('Y-m-d\TH:i:s\Z', time()));

/* ---------- 2.  Day offset map ----------
   -------------------------------------------------------- */
$dayOffsetMap = [
    'Sunday' => 0,
    'Monday' => 1,
    'Tuesday' => 2,
    'Wednesday' => 3,
    'Thursday' => 4,
    'Friday' => 5,
    'Saturday' => 6
];

/* ---------- 3.  Build the query ----------
   -------------------------------------------------------- */
$sql = "SELECT s.id, s.class_name,
               r.name AS room_name, r.id AS room_id,
               t.id AS teacher_id, t.first_name, t.last_name, t.department,
               s.day, s.start_time, s.end_time
        FROM schedule s
        JOIN rooms r ON s.room_id = r.id
        LEFT JOIN teachers t ON s.teacher_id = t.id";

$whereClauses = [];
$params = [];

/* Filter by program (department) */
$dept = $_GET['program'] ?? null;
if ($dept) {
    $whereClauses[] = "t.department = :department";
    $params[':department'] = $dept;
}

/* Filter by teachers */
$teacherIds = [];
if (!empty($_GET['teachers'])) {
    // explode, cast to int, remove empty values
    $teacherIds = array_filter(array_map('intval', explode(',', $_GET['teachers'])));
}
if ($teacherIds) {
    // build ? placeholders
    $placeholders = implode(',', array_fill(0, count($teacherIds), '?'));
    $whereClauses[] = "s.teacher_id IN ($placeholders)";
    foreach ($teacherIds as $id) {
        $params[] = $id;            // positional parameters after the named ones
    }
}

/* Attach WHERE if we have any clauses */
if ($whereClauses) {
    $sql .= ' WHERE ' . implode(' AND ', $whereClauses);
}

$sql .= "
        ORDER BY FIELD(s.day,'Sunday','Monday','Tuesday',
                        'Wednesday','Thursday','Friday','Saturday'),
                 s.start_time";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ---------- 4.  Map department → hex colour ----------
   -------------------------------------------------------- */
$deptColors = [
    'ITP' => '#CD5C5C',
    'CJP' => '#1E90FF',
    'TEP' => '#32CD32',
    'HMP' => '#FFC0CB',
    'BAP' => '#d6d615ff'
];

/* ---------- 5.  Build FullCalendar events ----------
   -------------------------------------------------------- */
$events = [];
foreach ($rows as $row) {
    $offsetDays = $dayOffsetMap[$row['day']] ?? 0;
    $date = date('Y-m-d', strtotime("+$offsetDays days", $weekStart));

    $start = $date . 'T' . $row['start_time'] . 'Z';
    $end = $date . 'T' . $row['end_time'] . 'Z';

    $dept = $row['department'] ?? '';
    $color = $deptColors[$dept] ?? '#808080'; // default grey

    $teacherName = trim($row['first_name'] . ' ' . $row['last_name']);
    if ($teacherName === '') {
        $teacherName = 'N/A';
    }

    $events[] = [
        'id' => (string) $row['id'],
        'title' => "{$row['class_name']} ({$row['room_name']}) - {$teacherName}",
        'start' => $start,
        'end' => $end,
        'backgroundColor' => $color,
        'borderColor' => $color,
        'extendedProps' => [
            'room_id' => (int) $row['room_id'],
            'room_name' => $row['room_name'],
            'teacher_id' => (int) $row['teacher_id'],
            'teacher_name' => $teacherName,
            'department' => $dept
        ]
    ];
}

echo json_encode($events);
?>