import { FormManager } from './FormManager.js';

export const CalendarManager = (() => {
    const calendarEl = document.getElementById('calendar');
    const today = new Date();
    const initialDateStr = new Date(today.setDate(today.getDate() - today.getDay()))
        .toLocaleDateString('en-CA');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        initialDate: initialDateStr,
        firstDay: 0,
        headerToolbar: true,
        selectable: true,
        editable: true,
        eventOverlap: true,
        allDaySlot: false,
        slotMinTime: '06:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '00:30:00',
        timeZone: 'UTC',
        events: 'php/get_schedule.php',
        dayHeaderFormat: { weekday: 'long' },
        height: 'auto',
        select: FormManager.openCreateModal,
        eventClick: e => FormManager.openEditModal(e.event),
        eventDrop: e => FormManager.handleEventChange(e, 'drop'),
        eventResize: e => FormManager.handleEventChange(e, 'resize')
    });

    function init() { calendar.render(); }

    return { init, refetch: () => calendar.refetchEvents(), getCalendar: () => calendar };
})();
