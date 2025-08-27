$(function () {

    // Global – keep the same instance for each modal
    const classModal = new bootstrap.Modal(document.getElementById('classModal'), { backdrop: 'static' });
    const conflictModal = new bootstrap.Modal(document.getElementById('conflictRoomModal'), { backdrop: 'static' });
    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'), { backdrop: 'static' });

    function showClassModal() { classModal.show(); }
    function hideClassModal() { classModal.hide(); }

    function showConflictModal(rooms, conflicts) {
        populateConflictRooms(rooms);
        populateConflicts(conflicts);
        conflictModal.show();
    }
    function hideConflictModal() { conflictModal.hide(); }
    
    /* ---------- 1. Load room options ----------
       -------------------------------------------*/
    const $roomSelect = $('#roomSelect');
    const $conflictRoomSelect = $('#conflictRoomSelect');

    $.getJSON('php/get_rooms.php', function (rooms) {
        $roomSelect.append('<option value="" disabled selected>Choose a Room</option>');
        rooms.forEach(r => {
            const option = `<option value="${r.id}">${r.name}</option>`;
            $roomSelect.append(option);
            $conflictRoomSelect.append(option);
        });
    });

    /* ----------  Load all teachers on page load (no filter) ----------
   -------------------------------------------------------------- */
    $.getJSON('php/get_teachers.php', function (teachers) {
        populateTeacherSelect(teachers);
    });

    /* ---------- 2. Program filter ----------
       ------------------------------------- */
    const $programSelect = $('#program');

    /* ---------- Helper to clear & fill both select elements ----------
   --------------------------------------------------------------- */
    function populateTeacherSelect(teachers) {
        const $teacherSel = $('#teacherSelect');
        const $conflictTeacherSel = $('#conflictTeacherSelect');

        // Remove old options first
        $teacherSel.empty();
        $conflictTeacherSel.empty();

        $teacherSel.append('<option value="" disabled selected>Choose a Teacher</option>');
        teachers.forEach(t => {
            const opt = `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`;
            $teacherSel.append(opt);
            $conflictTeacherSel.append(opt);   // for the teacher‑conflict modal
        });
    }

    /* ---------- Apply program filter (events + teachers) ----------
   --------------------------------------------------------------- */
    function applyProgramFilter() {
        const prog = $programSelect.val();               // may be empty

        /* --- Calendar events ----------------------------------- */
        const url = prog ? `php/get_schedule.php?program=${encodeURIComponent(prog)}` :
            'php/get_schedule.php';
        calendar.setOption('events', url);
        calendar.refetchEvents();

        /* --- Teacher list ------------------------------------- */
        const teacherUrl = prog ?
            `php/get_teachers.php?department=${encodeURIComponent(prog)}` :
            'php/get_teachers.php';

        $.getJSON(teacherUrl, function (teachers) {
            populateTeacherSelect(teachers);
        });
    }

    $programSelect.on('change', applyProgramFilter);

    /* ---------- 2. Compute Monday of current week ----------
       -------------------------------------------*/
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday=0, Monday=1, ..., Saturday=6
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() - dayOfWeek);   // subtract offset
    const initialDateStr = sunday.toLocaleDateString('en-CA');  // e.g. "2025-08-23"

    console.log("today", today);
    console.log("dayOfWeek", dayOfWeek);
    console.log("sunday", sunday);
    // console.log(sunday.setDate(today.getDate() - dayOfWeek));
    console.log("initialDateStr", initialDateStr);

    /* ---------- 3. FullCalendar initialization ----------
       -------------------------------------------*/
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        initialDate: initialDateStr,
        firstDay: 0,
        headerToolbar: true,
        selectable: true,
        selectMirror: true,
        editable: true,
        eventOverlap: true,
        allDaySlot: false,
        slotMinTime: '06:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '00:30:00',
        timeZone: 'UTC',          // <-- important if you want strict UTC handling
        events: 'php/get_schedule.php',
        dayHeaderFormat: { weekday: 'long' },// "Sunday", "Monday" …
        select: function (info) {
            openCreateModal(info);
        },
        eventClick: function (info) {
            openEditModal(info.event);
        },
        eventDrop: function (info) {
            handleEventChange(info, 'drop');
        },
        eventResize: function (info) {
            handleEventChange(info, 'resize');
        }
    });
    calendar.render();

    /* ---------- 4. Global state ----------
       -------------------------------------------*/
    let pendingRequest = null; // {action:'create'|'update', data:{}, isEventChange:boolean}

    /* ---------- 5. Modal helpers ----------
       -------------------------------------------*/
    function openCreateModal(selectionInfo) {
        $('#classModal .modal-title').text('Add Class');
        $('#classForm')[0].reset();
        $('#classForm input[name="id"]').val('');
        $('#classForm input[name="start"]').val(selectionInfo.startStr);
        $('#classForm input[name="end"]').val(selectionInfo.endStr);
        $('#classForm input[name="day"]').val(getDayName(selectionInfo.start));
        $('#modalStartTime').text(formatTime(selectionInfo.start));
        $('#modalEndTime').text(formatTime(selectionInfo.end));
        $('#modalDay').text(getDayName(selectionInfo.start));
        $('#deleteBtn').addClass('d-none');
        showClassModal();
    }

    function openEditModal(event) {
        $('#classModal .modal-title').text('Edit Class');
        $('#classForm')[0].reset();
        $('#classForm input[name="id"]').val(event.id);
        const startStr = event.start.toISOString();
        const endStr = event.end ? event.end.toISOString() : null;
        $('#classForm input[name="start"]').val(startStr);
        $('#classForm input[name="end"]').val(endStr);
        $('#classForm input[name="day"]').val(getDayName(event.start));
        // Extract class name from title
        const titleParts = event.title.split(' (');
        $('#className').val(titleParts[0].trim());
        $('#roomSelect').val(event.extendedProps.room_id);
        $('#modalStartTime').text(formatTime(event.start));
        $('#modalEndTime').text(formatTime(event.end));
        $('#modalDay').text(getDayName(event.start));
        $('#teacherSelect').val(event.extendedProps.teacher_id);
        $('#deleteBtn').removeClass('d-none');
        showClassModal();
    }

    function formatTime(date) {
        // Use UTC getters so the displayed time matches what is stored in DB
        const h = date.getUTCHours();
        const m = date.getUTCMinutes();

        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = ((h + 11) % 12 + 1);

        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }


    function getDayName(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    /* ---------- 6. Form submission ----------
       -------------------------------------------*/
    $('#classForm').on('submit', function (e) {
        e.preventDefault();
        const formDataArray = $(this).serializeArray();
        pendingRequest = { action: '', data: {}, isEventChange: false };
        formDataArray.forEach(item => {
            if (item.name === 'id' && item.value === '') return; // skip empty id
            pendingRequest.data[item.name] = item.value;
        });
        // Determine action based on presence of id
        if ($('#classForm input[name="id"]').val()) {
            pendingRequest.action = 'update';
        } else {
            pendingRequest.action = 'create';
        }
        sendFormRequest();
    });

    function sendFormRequest() {
        const url = pendingRequest.action === 'create'
            ? 'php/create_schedule.php'
            : 'php/update_schedule.php';

        $.post(url, pendingRequest.data, function (resp) {
            if (resp.success) {                     // everything OK
                hideClassModal();     // hide the create/edit modal
                calendar.refetchEvents();
            } else if (Array.isArray(resp.available_rooms)) {   // room conflict
                showConflictModal(resp.available_rooms, resp.conflicts);
            } else if (resp.error === 'Teacher Conflict') {
                showConflictTeacherModal(resp);
            } else {                                    // teacher conflict or other error
                alert(resp.error || resp.description || 'Unknown error');
            }
        }, 'json');
    }


    /* ---------- 7. Conflict modal OK ----------
       -------------------------------------------*/
    $('#conflictOkBtn').on('click', function () {
        const selectedRoomId = $('#conflictRoomSelect').val();
        pendingRequest.data.room_id = selectedRoomId;

        if (pendingRequest.isEventChange) {               // drag / resize
            $.post('php/update_schedule.php', pendingRequest.data, function (resp) {
                if (resp.success) {
                    hideConflictModal();
                    calendar.refetchEvents();
                } else if (Array.isArray(resp.available_rooms)) {
                    alert('Still conflict after selecting room. Please try another.');
                } else {
                    alert(resp.error || resp.description || 'Unknown error');
                }
            }, 'json');
        } else {                                            // create / edit form
            sendFormRequest();                              // this will hide the class modal
            hideConflictModal();
        }
    });


    /* ---------- 8. Event change handling ----------
       -------------------------------------------*/
    function handleEventChange(info, type) {
        const ev = info.event;
        pendingRequest = {
            action: 'update',
            data: {
                id: ev.id,
                start: ev.start.toISOString(),
                end: ev.end ? ev.end.toISOString() : null
            },
            isEventChange: true
        };

        $.post('php/update_schedule.php', pendingRequest.data, function (resp) {
            if (resp.success) {
                calendar.refetchEvents();
            } else if (Array.isArray(resp.available_rooms)) {   // room conflict
                info.revert();                                 // go back to original spot
                showConflictModal(resp.available_rooms, resp.conflicts);
            } else if (resp.error === 'Teacher Conflict') {
                showConflictTeacherModal();   // teacher conflict
                info.revert();                                 // go back to original spot
            } else {                                            // teacher conflict / error
                alert(resp.error || resp.description || 'Unknown error');
                info.revert();
            }
        }, 'json');
    }

    $('#deleteBtn').on('click', () => {
        deleteConfirmModal.show();
    });

    $('#confirmDeleteBtn').on('click', () => {
        const id = $('#classForm input[name="id"]').val();

        $.post('php/delete_schedule.php', { id }, resp => {
            if (resp.success) {
                // Close both modals
                deleteConfirmModal.hide();   // close the confirmation dialog
                classModal.hide();          // close the edit form

                calendar.refetchEvents();
            } else {
                alert(resp.error || 'Delete failed');
            }
        }, 'json');
    });

    function populateConflictRooms(rooms) {
        const $sel = $('#conflictRoomSelect');
        $sel.empty();                    // remove old options
        if (rooms.length === 0) {
            $sel.append('<option value="" disabled selected>No rooms available</option>');
        } else {
            $sel.append('<option value="" disabled selected>Choose a Room</option>');
            rooms.forEach(room => {
                $sel.append(`<option value="${room.id}">${room.name}</option>`);
            });
        }
    }

    function populateConflicts(conflicts) {
        const $list = $('#conflictList');
        $list.empty();

        if (!Array.isArray(conflicts) || conflicts.length === 0) {
            $list.append('<li>No conflicting classes found.</li>');
            return;
        }

        conflicts.forEach(c => {
            // Build a readable string
            const teacherName = c.first_name ? `${c.first_name} ${c.last_name}` : 'N/A';
            const startTime = c.start_time;          // already in HH:MM:SS or ISO‑8601
            const endTime = c.end_time;
            $list.append(
                `<li>${c.class_name} (${c.room_name}) – ${teacherName} [${startTime}–${endTime}]</li>`
            );
        });
    }

    function showConflictTeacherModal() {
        const el = document.getElementById('conflictTeacherModal');
        const modal = new bootstrap.Modal(el, { backdrop: 'static' });
        modal.show();
    }


});
