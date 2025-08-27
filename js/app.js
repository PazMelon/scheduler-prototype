import { RoomManager } from './managers/RoomManager.js';
import { TeacherManager } from './managers/TeacherManager.js';
import { CalendarManager } from './managers/CalendarManager.js';
import { FormManager } from './managers/FormManager.js';

$(function () {
    RoomManager.loadRooms();
    TeacherManager.loadTeachers();
    CalendarManager.init();
    FormManager.handleSubmit();
    FormManager.handleDelete();

    // Program filter
    const $programSelect = $('#program');
    $programSelect.on('change', () => {
        const prog = $programSelect.val();
        CalendarManager.getCalendar().setOption('events',
            prog ? `php/get_schedule.php?program=${encodeURIComponent(prog)}` : 'php/get_schedule.php'
        );
        CalendarManager.refetch();
        TeacherManager.loadTeachers(prog);
    });
});