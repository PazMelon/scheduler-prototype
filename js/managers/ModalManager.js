export const ModalManager = (() => {
    const modals = {
        classModal: new bootstrap.Modal('#classModal', { backdrop: 'static' }),
        conflictRoomModal: new bootstrap.Modal('#conflictRoomModal', { backdrop: 'static' }),
        deleteConfirmModal: new bootstrap.Modal('#deleteConfirmModal', { backdrop: 'static' }),
        conflictTeacherModal: new bootstrap.Modal('#conflictTeacherModal', { backdrop: 'static' })
    };

    return {
        show: (name) => modals[name]?.show(),
        hide: (name) => modals[name]?.hide()
    };
})();
