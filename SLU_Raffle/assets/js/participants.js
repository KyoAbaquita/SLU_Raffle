// ─── Participant Table ───────────────────────────────────────────────────────

function updateParticipantWarning() {
    const warning = document.getElementById('participantWarning');
    if (!warning) return;
    warning.style.display = participants.length === 0 ? '' : 'none';
}

function updateParticipantTable() {
    const tableBody = document.getElementById("participantList");
    tableBody.innerHTML = "";

    filteredParticipants.forEach((participant, index) => {
        const row = document.createElement("tr");
        row.classList.add('participant-item');
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${participant.name}</td>
                    <td>${participant.department || "—"}</td>
                    <td>
                        <span class="edit-btn" onclick="editParticipant(${index})">Edit</span>
                        <span class="delete-btn" onclick="deleteParticipant(${index})">Delete</span>
                    </td>
                `;
        tableBody.appendChild(row);
    });
    updateParticipantWarning();
}

function editParticipant(index) {
    const participant = filteredParticipants[index];

    // Populate modal inputs
    document.getElementById('editParticipantName').value = participant.name || "";
    document.getElementById('editParticipantDept').value = participant.department || "";
    document.getElementById('editParticipantIndex').value = index;

    // Show the modal
    const modalEl = document.getElementById('editParticipantModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function saveEditParticipant(event) {
    if (event) event.preventDefault();

    const index = parseInt(document.getElementById('editParticipantIndex').value, 10);
    const newName = document.getElementById('editParticipantName').value.trim();
    const newDept = document.getElementById('editParticipantDept').value.trim();

    if (newName === "" || isNaN(index)) return;

    const participant = filteredParticipants[index];

    // Find them in the main array
    const mainIndex = participants.indexOf(participant);
    if (mainIndex !== -1) {
        participants[mainIndex].name = newName;
        participants[mainIndex].department = newDept;
    }

    // Update the filtered list
    participant.name = newName;
    participant.department = newDept;

    updateParticipantTable();
    populateDepartmentFilter();

    // Hide the modal
    const modalEl = document.getElementById('editParticipantModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

function deleteParticipant(index) {
    if (confirm("Are you sure you want to delete this participant?")) {
        // find them in main array and delete
        const participant = filteredParticipants[index];
        const mainIndex = participants.indexOf(participant);
        if (mainIndex > -1) {
            participants.splice(mainIndex, 1);
        }

        // update filtered array
        filteredParticipants.splice(index, 1);

        document.getElementById("count").textContent = participants.length;
        updateParticipantTable();
    }
}

function removeAll() {
    if (confirm("Are you sure you want to remove all participants?")) {
        participants = [];
        filteredParticipants = [];
        selectedParticipants = [];
        document.getElementById("count").textContent = "0";
        updateParticipantTable();
        populateDepartmentFilter();
        updateParticipantWarning();
    }
}

function searchParticipants() {
    const query = document.getElementById("participantSearch").value.trim().toLowerCase();
    const filterSelect = document.getElementById("departmentFilter");
    const deptFilter = filterSelect ? filterSelect.value : "";

    filteredParticipants = participants.filter(p => {
        const name = (p.name || '').toLowerCase();
        const dept = (p.department || '').toLowerCase();

        const matchesQuery = !query || name.includes(query) || dept.includes(query);
        const matchesDept = !deptFilter || dept === deptFilter.toLowerCase();

        return matchesQuery && matchesDept;
    });

    updateParticipantTable();
}

function populateDepartmentFilter() {
    const filterSelect = document.getElementById("departmentFilter");
    if (!filterSelect) return;

    // Remember current selection
    const currentVal = filterSelect.value;

    // Get unique departments
    const departments = new Set();
    participants.forEach(p => {
        if (p.department && p.department.trim() !== "") {
            departments.add(p.department.trim());
        }
    });

    // Rebuild options
    let html = `<option value="">All Departments</option>`;
    Array.from(departments).sort().forEach(dept => {
        html += `<option value="${dept}">${dept}</option>`;
    });

    filterSelect.innerHTML = html;

    // Restore selection if it still exists
    if (Array.from(departments).includes(currentVal)) {
        filterSelect.value = currentVal;
    } else {
        filterSelect.value = "";
    }
}

function addParticipant(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newParticipantName');
    const deptInput = document.getElementById('newParticipantDept');

    if (!nameInput) return;

    const name = nameInput.value.trim();
    if (name === "") return;

    // Duplicate detection — case-insensitive
    const isDuplicate = participants.some(p =>
        (typeof p === 'object' ? p.name : p).toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
        alert(`"${name}" is already in the participant list!`);
        return;
    }

    const dept = deptInput ? deptInput.value.trim() : "";

    const newParticipant = {
        name: name,
        department: dept
    };

    participants.push(newParticipant);

    // Immediately clear search/filters so the new participant is visible
    const searchInput = document.getElementById('participantSearch');
    if (searchInput) searchInput.value = '';
    const filterSelect = document.getElementById('departmentFilter');
    if (filterSelect) filterSelect.value = '';

    filteredParticipants = [...participants];
    document.getElementById("count").textContent = participants.length;

    populateDepartmentFilter();
    updateParticipantTable();
    updateParticipantWarning();

    // Clear inputs and hide modal
    nameInput.value = '';
    if (deptInput) deptInput.value = '';

    const modalEl = document.getElementById('addParticipantModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

// Clear search when modal closes
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('participantsModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', () => {
            const searchInput = document.getElementById('participantSearch');
            if (searchInput) searchInput.value = '';
            const filterSelect = document.getElementById('departmentFilter');
            if (filterSelect) filterSelect.value = '';

            filteredParticipants = [...participants];
            updateParticipantTable();
        });
    }
});
