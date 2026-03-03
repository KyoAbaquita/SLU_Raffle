// Handle file upload (Excel/Word)
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Update custom upload UI label
    const wrapper = event.target.closest('.file-upload-wrapper');
    if (wrapper) {
        const label = wrapper.querySelector('.file-upload-text');
        if (label) label.textContent = file.name;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileData = e.target.result;

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            parseExcel(fileData);
        } else if (file.name.endsWith('.docx')) {
            parseWord(fileData);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Parse Excel file and extract participants
function parseExcel(data) {
    const wb = XLSX.read(data, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const participantsData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    participantsData.forEach(row => {
        if (!row[0]) return;
        const name = String(row[0]).trim();
        const department = row[1] ? String(row[1]).trim() : "";
        if (name && !participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            participants.push({ name, department });
        }
    });

    filteredParticipants = [...participants]; // Reset filtered list
    document.getElementById("count").textContent = participants.length;
    populateDepartmentFilter();
    updateParticipantTable();
}

// Parse Word file and extract participants (basic example using mammoth.js)
function parseWord(data) {
    mammoth.extractRawText({ arrayBuffer: data })
        .then(function (result) {
            const names = result.value.split(/\r?\n/).map(line => line.trim()).filter(line => line !== "");

            names.forEach(name => {
                if (name && !participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                    participants.push({ name, department: "" });
                }
            });

            filteredParticipants = [...participants]; // Reset filtered list
            document.getElementById("count").textContent = participants.length;
            populateDepartmentFilter();
            updateParticipantTable();
        })
        .catch(function (err) {
            showToast("Error reading Word file: " + err, 'error');
        });
}