export const TeacherManager = (() => {
    const $teacherSel = $('#teacherSelect');
    const $conflictTeacherSel = $('#conflictTeacherSelect');

    /** Load teachers (optionally filtered by department) */
    function loadTeachers(filter = '', cb) {
        const url = filter
            ? `php/get_teachers.php?department=${encodeURIComponent(filter)}`
            : 'php/get_teachers.php';

        $.getJSON(url, data => {
            populate(data);
            if (cb) cb();          // ← call the callback once teachers are rendered
        });
    }

    /**
     * Populate the two <select> boxes AND the checkbox list.
     */
    function populate(teachers) {
        // 1️⃣   selects
        [$teacherSel, $conflictTeacherSel].forEach($sel => {
            $sel.empty().append('<option value="" disabled selected>Choose a Teacher</option>');
            teachers.forEach(t =>
                $sel.append(`<option value="${t.id}">${t.first_name} ${t.last_name}</option>`));
        });

        // 2️⃣   checkbox list (with “All” + default‑checked)
        const $container = $('#teacherListContainer');
        $container.empty();

        if (!teachers.length) {
            $container.append('<p class="text-muted mb-0"><em>No teachers in this department.</em></p>');
            return;
        }

        // "All" checkbox
        $container.append(`
            <div class="form-check">
                <input class="form-check-input teacher-checkbox all-teacher"
                       type="checkbox" value="" id="teacherChkAll" checked>
                <label class="form-check-label" for="teacherChkAll">All</label>
            </div>`);

        teachers.forEach(t => {
            $container.append(`
                <div class="form-check">
                    <input class="form-check-input teacher-checkbox"
                           type="checkbox" value="${t.id}" id="teacherChk${t.id}" checked>
                    <label class="form-check-label" for="teacherChk${t.id}">
                        ${t.first_name} ${t.last_name}
                    </label>
                </div>`);
        });
    }

    return { loadTeachers };
})();
