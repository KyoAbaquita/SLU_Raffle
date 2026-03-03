// ─── Prize Image Handling ────────────────────────────────────────────────────

// Prize list: each entry = { name, image, selected }
let prizeList = [];

// ─── LocalStorage Persistence ────────────────────────────────────────────────

function savePrizesToStorage() {
    try {
        localStorage.setItem('rafflePrizes', JSON.stringify(prizeList));
    } catch (e) {
        console.warn('Could not save prizes to localStorage:', e);
    }
}

function loadPrizesFromStorage() {
    try {
        const saved = localStorage.getItem('rafflePrizes');
        if (saved) {
            prizeList = JSON.parse(saved);
            prizeList.forEach(p => {
                if (typeof p.selected === 'undefined') p.selected = false;
            });
            // Auto-select first prize if none are currently selected
            const hasSelection = prizeList.some(p => p.selected);
            if (!hasSelection && prizeList.length > 0) {
                prizeList[0].selected = true;
                savePrizesToStorage();
            }
            renderPrizeList();
        }
    } catch (e) {
        console.warn('Could not load prizes from localStorage:', e);
    }
}

function clearPrizesFromStorage() {
    try {
        localStorage.removeItem('rafflePrizes');
    } catch (e) { /* silent */ }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadPrizesFromStorage);

// ─── Prize Image Preview ────────────────────────────────────────────────────

function previewPrizeImage() {
    const fileInput = document.getElementById("prizeImageInput");
    const file = fileInput.files[0];

    if (file) {
        const urlInput = document.getElementById("prizeImageURL");
        if (urlInput) urlInput.value = file.name;

        const reader = new FileReader();
        reader.onload = function (event) {
            prizeImage = event.target.result;
            const preview = document.getElementById("prizeImagePreview");
            const card = document.getElementById("prizePreviewCard");
            preview.src = prizeImage;
            if (card) card.style.display = '';
        };
        reader.readAsDataURL(file);
    }
}

function updatePrizeImageURL() {
    const urlInput = document.getElementById("prizeImageURL");
    prizeImage = urlInput.value.trim();

    if (prizeImage) {
        const preview = document.getElementById("prizeImagePreview");
        const card = document.getElementById("prizePreviewCard");
        preview.src = prizeImage;
        if (card) card.style.display = '';
    }
}

function removePrizeImage() {
    prizeImage = "";
    document.getElementById("prizeImageURL").value = "";
    document.getElementById("prizeImageInput").value = "";
    document.getElementById("prizeImagePreview").src = "";
    document.getElementById("prizePreviewCard").style.display = "none";
}

function clearPrize() {
    document.getElementById("prizeInput").value = "";
    prize = "No prize set";
    removePrizeImage();
}

// ─── Prize List Management ───────────────────────────────────────────────────

function addPrize() {
    const nameInput = document.getElementById("prizeInput");
    const prizeName = nameInput.value.trim();

    if (!prizeName) {
        showToast("Enter a prize name first!", 'warning');
        return;
    }

    prizeList.push({
        name: prizeName,
        image: prizeImage || "",
        selected: false
    });

    // Clear inputs for next prize
    nameInput.value = "";
    removePrizeImage();

    savePrizesToStorage();
    renderPrizeList();
}

function removePrizeFromList(index) {
    prizeList.splice(index, 1);
    savePrizesToStorage();
    renderPrizeList();
}

// Single-select: tap to pick one prize for the draw
function selectPrize(index) {
    prizeList.forEach((p, i) => {
        p.selected = (i === index) ? !p.selected : false;
    });
    savePrizesToStorage();
    renderPrizeList();
}

function getSelectedPrizes() {
    return prizeList.filter(p => p.selected);
}

// ─── Edit Prize Handle ──────────────────────────────────────────────────────

let tempEditPrizeImage = "";

function editPrize(index) {
    const prizeToEdit = prizeList[index];
    if (!prizeToEdit) return;

    // Populate modal inputs
    document.getElementById("editPrizeIndex").value = index;
    document.getElementById("editPrizeName").value = prizeToEdit.name || "";
    document.getElementById("editPrizeImageURL").value = prizeToEdit.image || "";

    // Reset file input just in case
    document.getElementById("editPrizeImageInput").value = "";

    tempEditPrizeImage = prizeToEdit.image || "";

    const preview = document.getElementById("editPrizeImagePreview");
    const card = document.getElementById("editPrizePreviewCard");

    if (tempEditPrizeImage) {
        preview.src = tempEditPrizeImage;
        card.style.display = '';
    } else {
        preview.src = "";
        card.style.display = 'none';
    }

    // Show the modal
    const modalEl = document.getElementById("editPrizeModal");
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function updateEditPrizeImageURL() {
    const urlInput = document.getElementById("editPrizeImageURL");
    tempEditPrizeImage = urlInput.value.trim();

    const preview = document.getElementById("editPrizeImagePreview");
    const card = document.getElementById("editPrizePreviewCard");

    if (tempEditPrizeImage) {
        preview.src = tempEditPrizeImage;
        card.style.display = '';
    } else {
        card.style.display = 'none';
    }
}

function previewEditPrizeImage() {
    const fileInput = document.getElementById("editPrizeImageInput");
    const file = fileInput.files[0];

    if (file) {
        const urlInput = document.getElementById("editPrizeImageURL");
        if (urlInput) urlInput.value = file.name;

        const reader = new FileReader();
        reader.onload = function (event) {
            tempEditPrizeImage = event.target.result;
            const preview = document.getElementById("editPrizeImagePreview");
            const card = document.getElementById("editPrizePreviewCard");
            preview.src = tempEditPrizeImage;
            if (card) card.style.display = '';
        };
        reader.readAsDataURL(file);
    }
}

function removeEditPrizeImage() {
    tempEditPrizeImage = "";
    document.getElementById("editPrizeImageURL").value = "";
    document.getElementById("editPrizeImageInput").value = "";
    document.getElementById("editPrizeImagePreview").src = "";
    document.getElementById("editPrizePreviewCard").style.display = "none";
}

function saveEditPrize(event) {
    if (event) event.preventDefault();

    const index = parseInt(document.getElementById("editPrizeIndex").value, 10);
    const newName = document.getElementById("editPrizeName").value.trim();

    if (newName === "" || isNaN(index)) return;

    // Update the list
    if (prizeList[index]) {
        prizeList[index].name = newName;
        prizeList[index].image = tempEditPrizeImage;
    }

    savePrizesToStorage();
    renderPrizeList();

    // Hide the modal
    const modalEl = document.getElementById("editPrizeModal");
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

// ─── Prize Badge (count on View Prizes button) ──────────────────────────────

function updatePrizeBadge() {
    const badge = document.getElementById("prizeBadge");
    if (!badge) return;

    if (prizeList.length > 0) {
        badge.textContent = prizeList.length;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Render Prize List Inside Modal ─────────────────────────────────────────

function renderPrizeList() {
    const container = document.getElementById("prizeListContainer");
    const ul = document.getElementById("prizeList");
    const emptyState = document.getElementById("prizeEmptyState");

    updatePrizeBadge();

    if (prizeList.length === 0) {
        if (container) container.style.display = "none";
        if (emptyState) emptyState.style.display = "";
        ul.innerHTML = "";
        return;
    }

    if (container) container.style.display = "";
    if (emptyState) emptyState.style.display = "none";
    ul.innerHTML = "";

    const selected = prizeList.find(p => p.selected);

    prizeList.forEach((p, i) => {
        const li = document.createElement("li");
        const isActive = p.selected;
        li.className = `prize-card ${isActive ? 'prize-card--active' : ''}`;
        li.style.animationDelay = `${i * 0.04}s`;

        const imgHtml = p.image
            ? `<img class="prize-card__img" src="${p.image}" alt="">`
            : '';

        li.innerHTML = `
            <div class="prize-card__left" onclick="selectPrize(${i})">
                <div class="prize-card__radio">
                    <span class="prize-card__radio-dot ${isActive ? 'prize-card__radio-dot--on' : ''}"></span>
                </div>
                ${imgHtml}
                <span class="prize-card__name">${p.name}</span>
            </div>
            <div class="prize-card__actions">
                <button class="prize-card__edit" onclick="event.stopPropagation(); editPrize(${i})" title="Edit this prize">Edit</button>
                <button class="prize-card__delete" onclick="event.stopPropagation(); removePrizeFromList(${i})" title="Delete this prize">Delete</button>
            </div>
        `;
        ul.appendChild(li);
    });
}
