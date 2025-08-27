import { ModalManager } from './ModalManager.js';

export const ConflictManager = (() => {
    const $conflictRoomSelect = $('#conflictRoomSelect');
    const $conflictList = $('#conflictList');

    function showRoomConflicts(rooms, conflicts) {
        populateConflictRooms(rooms);
        populateConflicts(conflicts);
        ModalManager.show('conflictRoomModal');
    }

    function populateConflictRooms(rooms) {
        $conflictRoomSelect.empty();
        if (rooms.length === 0) {
            $conflictRoomSelect.append('<option value="" disabled selected>No rooms available</option>');
        } else {
            $conflictRoomSelect.append('<option value="" disabled selected>Choose a Room</option>');
            rooms.forEach(r => $conflictRoomSelect.append(`<option value="${r.id}">${r.name}</option>`));
        }
    }

    function populateConflicts(conflicts) {
        $conflictList.empty();
        if (!conflicts?.length) {
            $conflictList.append('<li>No conflicting classes found.</li>');
            return;
        }
        conflicts.forEach(c => {
            const teacherName = c.first_name ? `${c.first_name} ${c.last_name}` : 'N/A';
            $conflictList.append(
                `<li>${c.class_name} (${c.room_name}) – ${teacherName} [${c.start_time}–${c.end_time}]</li>`
            );
        });
    }

    return { showRoomConflicts };
})();
