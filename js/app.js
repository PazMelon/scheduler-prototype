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

    // ----- 3.  Program dropdown ------------------------------------------------
    /* Program dropdown */
    $('#program').on('change', () => {
        const prog = $('#program').val();

        TeacherManager.loadTeachers(prog);   // reload checkboxes for this department

        updateCalendarEvents();
    });

    // ----- 4.  Teacher checkbox changes ----------------------------------------
    /* Teacher checkbox changes + “All” logic */
    let updateTimer;
    function scheduleUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => updateCalendarEvents(), 500); // 500 ms debounce
    }

    $('#teacherListContainer')
        .on('change', 'input.teacher-checkbox', function () {
            if ($(this).hasClass('all-teacher')) {
                const checked = this.checked;
                $(this).closest('.form-check').siblings()
                    .find('input.teacher-checkbox')
                    .prop('checked', checked);
            }
            scheduleUpdate();   // instead of updateCalendarEvents();
        });

    /* Initial render */
    updateCalendarEvents();
});
