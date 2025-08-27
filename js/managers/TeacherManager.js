export const TeacherManager = (() => {
    const $teacherSel = $('#teacherSelect');
    const $conflictTeacherSel = $('#conflictTeacherSelect');

    function loadTeachers(filter = '') {
        const url = filter
            ? `php/get_teachers.php?department=${encodeURIComponent(filter)}`
            : 'php/get_teachers.php';

        $.getJSON(url, populateTeachers);
    }

    function populateTeachers(teachers) {
        [$teacherSel, $conflictTeacherSel].forEach($sel => {
            $sel.empty().append('<option value="" disabled selected>Choose a Teacher</option>');
            teachers.forEach(t => {
                $sel.append(`<option value="${t.id}">${t.first_name} ${t.last_name}</option>`);
            });
        });
    }

    return { loadTeachers };
})();
