export const RoomManager = (() => {
    const $roomSelect = $('#roomSelect');
    const $conflictRoomSelect = $('#conflictRoomSelect');

    function loadRooms() {
        $.getJSON('php/get_rooms.php', function (rooms) {
            populateRooms($roomSelect, rooms, "Choose a Room");
            populateRooms($conflictRoomSelect, rooms, "Choose a Room");
        });
    }

    function populateRooms($select, rooms, placeholder) {
        $select.empty();
        $select.append(`<option value="" disabled selected>${placeholder}</option>`);
        rooms.forEach(r => {
            $select.append(`<option value="${r.id}">${r.name}</option>`);
        });
    }

    return { loadRooms };
})();
