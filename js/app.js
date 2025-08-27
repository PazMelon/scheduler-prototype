import { RoomManager } from './managers/RoomManager.js';
import { TeacherManager } from './managers/TeacherManager.js';
import { CalendarManager } from './managers/CalendarManager.js';
import { FormManager } from './managers/FormManager.js';

$(function () {
    // ----- 1.  Initial load ------------------------------------------------
    RoomManager.loadRooms();
    TeacherManager.loadTeachers();          // all teachers (no filter)

    CalendarManager.init();
    FormManager.handleSubmit();
    FormManager.handleDelete();

    // ----- 2.  Helper – build the URL for FullCalendar -------------------
    // Helper: build URL for FullCalendar (program + checked teachers)
    function buildEventsUrl() {
        const prog = $('#program').val();

        const teacherIds = [];
        $('#teacherListContainer input.teacher-checkbox:checked')
            .each((_, el) => {
                const val = $(el).val();
                if (val !== '') {          // skip the “All” checkbox
                    teacherIds.push(val);
                }
            });

        let url = 'php/get_schedule.php?';
        if (prog) url += `program=${encodeURIComponent(prog)}&`;
        if (teacherIds.length)
            url += `teachers=${encodeURIComponent(teacherIds.join(','))}&`;

        return url.replace(/&$/, '');
    }

    function updateCalendarEvents() {
        const cal = CalendarManager.getCalendar();
        // 1. Tell FullCalendar what the new source is
        cal.setOption('events', buildEventsUrl());
        // 2. **Remove** this line – it’s the duplicate fetch
        // cal.refetchEvents();          // <-- delete or comment out
    }

    function buildEventsUrl() {
        const prog = $('#program').val();

        // gather every checked teacher (skip “All”)
        const teacherIds = [];
        $('#teacherListContainer input.teacher-checkbox:checked')
            .each((_, el) => { if ($(el).val() !== '') teacherIds.push($(el).val()); });

        let url = 'php/get_schedule.php?';
        if (prog) url += `program=${encodeURIComponent(prog)}&`;

        const allChecked = $('#teacherChkAll').length ? $('#teacherChkAll').prop('checked') : true;

        if (!allChecked && teacherIds.length === 0) {
            url += 'teachers=-1&';          // empty result set
        } else if (teacherIds.length > 0) {
            url += `teachers=${encodeURIComponent(teacherIds.join(','))}&`;
        }

        return url.replace(/&$/, '');
    }


    // ----- 3.  Program dropdown ------------------------------------------------
    /* Program dropdown */
    $('#program').on('change', () => {
        const prog = $('#program').val();
        TeacherManager.loadTeachers(prog, updateCalendarEvents); // reload + refresh calendar
    });

    // ----- 4.  Teacher checkbox changes ----------------------------------------
    /* Teacher checkbox changes + “All” logic */
    let updateTimer;
    function scheduleUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => updateCalendarEvents(), 200); // 200 ms debounce
    }

    $('#teacherListContainer')
        .on('change', 'input.teacher-checkbox', function () {
            const $this = $(this);

            /* ----------  All‑box logic -------------------------------- */
            if ($this.hasClass('all-teacher')) {                // user toggled “All”
                const checked = this.checked;
                $('#teacherListContainer input.teacher-checkbox')
                    .not('.all-teacher')
                    .prop('checked', checked);
            } else {                                            // a single teacher changed
                // If any individual box is unchecked → uncheck “All”
                const allChecked = $('#teacherChkAll').prop('checked');
                if (allChecked) {
                    const anyUnchecked = $('#teacherListContainer input.teacher-checkbox')
                        .not('.all-teacher')
                        .filter(':not(:checked)').length > 0;
                    $('#teacherChkAll').prop('checked', !anyUnchecked);
                }
            }

            /* ----------  Refresh the calendar -------------------------- */
            scheduleUpdate();          // debounce – see next section
        });

    /* Initial render */
    updateCalendarEvents();
});
