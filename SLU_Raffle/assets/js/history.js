// ─── Winner History (localStorage) ───────────────────────────────────────────

function saveToHistory(winners, prize) {
    const history = JSON.parse(localStorage.getItem("raffleHistory")) || [];
    const newEntry = {
        date: new Date().toLocaleString(),
        winners: winners,
        prize: prize
    };
    history.unshift(newEntry);
    localStorage.setItem("raffleHistory", JSON.stringify(history));
}

function viewHistory() {
    const history = JSON.parse(localStorage.getItem("raffleHistory")) || [];
    const listElement = document.getElementById("historyList");
    listElement.innerHTML = "";

    if (history.length === 0) {
        listElement.innerHTML = `<li class="history-empty">No history yet. Run a raffle to get started!</li>`;
    } else {
        history.forEach((entry, index) => {
            const item = document.createElement("li");
            item.className = "history-card";
            item.style.animationDelay = `${index * 0.04}s`;

            // Support both old format (string array) and new format (object array with department)
            let winnerDisplay;
            let winnerCount;

            if (Array.isArray(entry.winners)) {
                winnerCount = entry.winners.length;
                winnerDisplay = entry.winners.map(w => {
                    if (typeof w === 'object' && w.name) {
                        return w.department
                            ? `<span class="history-winner-name">${w.name}</span> <span class="history-winner-dept">(${w.department})</span>`
                            : `<span class="history-winner-name">${w.name}</span>`;
                    }
                    // Old format: plain string
                    return `<span class="history-winner-name">${w}</span>`;
                }).join(' · ');
            } else {
                winnerCount = 1;
                winnerDisplay = `<span class="history-winner-name">${entry.winners}</span>`;
            }

            item.innerHTML = `
                <div class="history-card-meta">
                    <span class="history-timestamp">${entry.date}</span>
                    <span class="history-badge">${winnerCount} winner${winnerCount > 1 ? 's' : ''}</span>
                    <button class="history-undo-btn" onclick="undoDraw(${index})" title="Undo this draw">↺ Undo</button>
                </div>
                <div class="history-prize">${entry.prize}</div>
                <div class="history-winners">${winnerDisplay}</div>
            `;
            listElement.appendChild(item);
        });
    }

    const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
    historyModal.show();
}

// ─── Undo Draw Logic ───────────────────────────────────────────

function undoDraw(index) {
    if (!confirm("Are you sure you want to completely undo this draw? This will erase the history record and add the winners back to the participant pool.")) {
        return;
    }

    let history = JSON.parse(localStorage.getItem("raffleHistory")) || [];
    if (index >= history.length || index < 0) return;

    const entryToUndo = history[index];
    const winnersToRestore = entryToUndo.winners || [];

    // Safety check just in case it's the old flat string format
    const isRemoveWinnersEnabled = document.getElementById("removeWinnersCheck")?.checked !== false;

    // We only need to physically restore them if they were actually removed from the pool during their draw.
    // If 'removeWinnersCheck' is theoretically always on during draws, or we just want to be safe:
    if (Array.isArray(winnersToRestore)) {
        winnersToRestore.forEach(w => {
            // Check if they are already in the pool to prevent duplicates
            const existing = participants.find(p => p.name === w.name);
            if (!existing) {
                // Not in the pool, add them back!
                participants.push({
                    name: w.name,
                    department: w.department || ""
                });
            }
        });
    }

    // Save participants and re-render the list immediately
    saveParticipants();
    renderParticipants();

    // 2. Remove from History
    history.splice(index, 1);
    localStorage.setItem("raffleHistory", JSON.stringify(history));

    // 3. Re-render the history popup instantly
    // We have to close the current modal and re-open it to refresh the list, or just manually rebuild listElement.
    // Manually rebuilding listElement is cleaner visually (no flicker).
    const listElement = document.getElementById("historyList");
    listElement.innerHTML = "";
    if (history.length === 0) {
        listElement.innerHTML = `<li class="history-empty">No history yet. Run a raffle to get started!</li>`;
    } else {
        // A simple recursive call to re-build isn't possible because viewHistory opens the modal.
        // We'll just softly close and re-open
        const historyModalEl = document.getElementById('historyModal');
        const modalInstance = bootstrap.Modal.getInstance(historyModalEl);
        if (modalInstance) modalInstance.hide();
        setTimeout(viewHistory, 200);
    }
}

function clearHistory() {
    if (confirm("Are you sure you want to clear the entire raffle history?")) {
        localStorage.removeItem("raffleHistory");
        const listElement = document.getElementById("historyList");
        listElement.innerHTML = `<li class="history-empty">No history found.</li>`;
    }
}

// ─── Restore All Winners Logic ───────────────────────────────────────────

function restoreWinners() {
    const history = JSON.parse(localStorage.getItem("raffleHistory")) || [];
    if (history.length === 0) {
        alert("No winners found in history to restore.");
        return;
    }

    let restoredCount = 0;
    history.forEach(entry => {
        const winners = entry.winners || [];
        const winnerArray = Array.isArray(winners) ? winners : [winners];

        winnerArray.forEach(w => {
            const name = typeof w === 'object' ? w.name : w;
            const dept = typeof w === 'object' ? (w.department || "") : "";

            // Check if they are already in the pool
            if (!participants.some(p => (typeof p === 'object' ? p.name : p) === name)) {
                participants.push({ name: name, department: dept });
                restoredCount++;
            }
        });
    });

    if (restoredCount > 0) {
        filteredParticipants = [...participants];
        const countElement = document.getElementById("count");
        if (countElement) {
            countElement.textContent = participants.length;
        }

        if (typeof updateParticipantTable === 'function') {
            updateParticipantTable();
        }

        alert(`Successfully restored ${restoredCount} winner(s) back to the participant pool!`);
    } else {
        alert("All previous winners are already in the participant pool.");
    }
}
