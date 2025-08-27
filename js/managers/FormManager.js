import { ModalManager } from './ModalManager.js';
import { CalendarManager } from './CalendarManager.js';
import { ConflictManager } from './ConflictManager.js';

export const FormManager = (() => {
    let pendingRequest = null;

    function openCreateModal(info) {
        $('#classModal .modal-title').text('Add Class');
        $('#classForm')[0].reset();
        $('#classForm input[name="id"]').val('');
        $('#classForm input[name="start"]').val(info.startStr);
        $('#classForm input[name="end"]').val(info.endStr);
        $('#classForm input[name="day"]').val(getDayName(info.start));
        $('#modalStartTime').text(formatTime(info.start));
        $('#modalEndTime').text(formatTime(info.end));
        $('#modalDay').text(getDayName(info.start));
        $('#deleteBtn').addClass('d-none');
        ModalManager.show('classModal');
    }

    function openEditModal(event) {
        $('#classModal .modal-title').text('Edit Class');
        $('#classForm')[0].reset();
        $('#classForm input[name="id"]').val(event.id);
        $('#classForm input[name="start"]').val(event.start.toISOString());
        $('#classForm input[name="end"]').val(event.end?.toISOString() || '');
        $('#classForm input[name="day"]').val(getDayName(event.start));
        $('#className').val(event.title.split(' (')[0].trim());
        $('#roomSelect').val(event.extendedProps.room_id);
        $('#teacherSelect').val(event.extendedProps.teacher_id);
        $('#modalStartTime').text(formatTime(event.start));
        $('#modalEndTime').text(formatTime(event.end));
        $('#modalDay').text(getDayName(event.start));
        $('#deleteBtn').removeClass('d-none');
        ModalManager.show('classModal');
    }

    function handleSubmit() {
        $('#classForm').on('submit', function (e) {
            e.preventDefault();
            const data = {};
            $(this).serializeArray().forEach(item => {
                if (item.name === 'id' && !item.value) return;
                data[item.name] = item.value;
            });

            pendingRequest = {
                action: data.id ? 'update' : 'create',
                data,
                isEventChange: false
            };
            sendFormRequest();
        });
    }

    function sendFormRequest() {
        const url = pendingRequest.action === 'create'
            ? 'php/create_schedule.php'
            : 'php/update_schedule.php';

        $.post(url, pendingRequest.data, function (resp) {
            if (resp.success) {
                ModalManager.hide('classModal');
                CalendarManager.refetch();
            } else if (resp.available_rooms) {
                ConflictManager.showRoomConflicts(resp.available_rooms, resp.conflicts);
            } else if (resp.error === 'Teacher Conflict') {
                ModalManager.show('conflictTeacherModal');
            } else {
                alert(resp.error || resp.description || 'Unknown error');
            }
        }, 'json');
    }

    function handleEventChange(info) {
        pendingRequest = {
            action: 'update',
            data: { id: info.event.id, start: info.event.start.toISOString(), end: info.event.end?.toISOString() },
            isEventChange: true
        };

        $.post('php/update_schedule.php', pendingRequest.data, function (resp) {
            if (resp.success) {
                CalendarManager.refetch();
            } else if (resp.available_rooms) {
                info.revert();
                ConflictManager.showRoomConflicts(resp.available_rooms, resp.conflicts);
            } else if (resp.error === 'Teacher Conflict') {
                ModalManager.show('conflictTeacherModal');
                info.revert();
            } else {
                alert(resp.error || 'Unknown error');
                info.revert();
            }
        }, 'json');
    }

    function handleDelete() {
        $('#deleteBtn').on('click', () => ModalManager.show('deleteConfirmModal'));
        $('#confirmDeleteBtn').on('click', () => {
            const id = $('#classForm input[name="id"]').val();
            $.post('php/delete_schedule.php', { id }, resp => {
                if (resp.success) {
                    ModalManager.hide('deleteConfirmModal');
                    ModalManager.hide('classModal');
                    CalendarManager.refetch();
                } else {
                    alert(resp.error || 'Delete failed');
                }
            }, 'json');
        });
    }

    $('#conflictOkBtn').on('click', function () {
        const selectedRoomId = $('#conflictRoomSelect').val();
        pendingRequest.data.room_id = selectedRoomId;

        if (pendingRequest.isEventChange) {               // drag / resize
            $.post('php/update_schedule.php', pendingRequest.data, function (resp) {
                if (resp.success) {
                    ModalManager.hide('conflictRoomModal');
                    calendar.refetchEvents();
                } else if (Array.isArray(resp.available_rooms)) {
                    alert('Still conflict after selecting room. Please try another.');
                } else {
                    alert(resp.error || resp.description || 'Unknown error');
                }
            }, 'json');
        } else {                                            // create / edit form
            sendFormRequest();                              // this will hide the class modal
           ModalManager.hide('conflictRoomModal');
        }
    });

    function formatTime(date) {
        const h = date.getUTCHours(), m = date.getUTCMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = (h + 11) % 12 + 1;
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    function getDayName(date) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    }

    return { openCreateModal, openEditModal, handleEventChange, handleSubmit, handleDelete };
})();
