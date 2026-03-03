// ─── Main Raffle Logic ───────────────────────────────────────────────────────

function startRaffle() {
    const timerInput = document.getElementById("timerInput");
    const prizeInput = document.getElementById("prizeInput");

    // Build the active prizes for this draw:
    // If prizeList has items, use only the selected ones. Otherwise use the single input field.
    let activePrizes = [];
    if (prizeList.length > 0) {
        activePrizes = getSelectedPrizes();
        if (activePrizes.length === 0) {
            showToast("Tap a prize in the Prizes modal to select it first!", 'warning');
            return;
        }
    } else {
        const singleName = prizeInput.value.trim();
        if (!singleName) {
            showToast("Please set a prize before starting the raffle!", 'warning');
            return;
        }
        activePrizes = [{ name: singleName, image: prizeImage || "" }];
    }

    let drawPool = [...participants];

    const LUCKY_WINNERS = [
        { name: "Sir Nils", weight: 100 },
        { name: "Sir Jasper", weight: 100 },
        { name: "Sir Bernard", weight: 100 },
        { name: "Sir Wapot", weight: 100 },
        { name: "Sir Marwen", weight: 100 },
        { name: "Sir Ferds", weight: 100 },
        { name: "Sir Nathan", weight: 100 },
    ];

    const luckyMap = {};
    LUCKY_WINNERS.forEach(lw => { luckyMap[lw.name] = lw.weight; });

    function weightedPick(pool, blockLucky = false) {
        const weights = pool.map(p => {
            const name = typeof p === 'object' ? p.name : p;
            if (luckyModeActive && !blockLucky && luckyMap[name]) return luckyMap[name];
            return 1;
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    if (drawPool.length === 0) {
        showToast("Add participants first!", 'warning');
        return;
    }

    const winnerCount = parseInt(document.getElementById("winnerCountInput").value);

    if (winnerCount > drawPool.length) {
        showToast(`Not enough participants! You need at least ${winnerCount} participant(s) but only have ${drawPool.length}.`, 'error');
        return;
    }

    // Safety check against empty/NaN timer input. Fallback to 20s if invalid.
    const parsedTimer = parseInt(timerInput.value);
    const timePerWinner = isNaN(parsedTimer) ? 20000 : Math.max(parsedTimer * 1000, 2000);

    document.getElementById("timerInput").disabled = true;
    document.getElementById("prizeInput").disabled = true;
    document.getElementById("prizeImageInput").disabled = true;
    document.getElementById("prizeImageURL").disabled = true;

    const myModal = new bootstrap.Modal(document.getElementById('winnerModal'));
    myModal.show();

    // Show the first prize in the modal header
    const firstPrize = activePrizes[0];
    try {
        document.getElementById("prizeModal").textContent = firstPrize.name;
        const prizeImgEl = document.getElementById("prizeImageInModal");
        if (firstPrize.image) {
            prizeImgEl.src = firstPrize.image;
            prizeImgEl.style.cssText = 'display:block; max-width:100%; max-height:160px; object-fit:contain; border-radius:14px; margin:0 auto 16px; border:1px solid rgba(255,255,255,0.08);';
        } else {
            prizeImgEl.style.display = 'none';
        }
    } catch (e) {
        console.error("Error setting prize info:", e);
    }

    document.getElementById("winnerGrid").innerHTML = "";
    document.getElementById("summaryList").innerHTML = "";
    document.getElementById("rouletteNames").innerHTML = "";
    document.getElementById("rouletteLabel").textContent = "Get Ready...";
    const prevBtn = document.getElementById("summaryBtnWrapper");
    if (prevBtn) prevBtn.style.display = "none";
    const rouletteWrapper = document.querySelector('.roulette-wrapper');
    if (rouletteWrapper) rouletteWrapper.style.display = '';

    for (let i = 0; i < winnerCount; i++) {
        const card = document.createElement("div");
        card.className = "winner-card";
        card.id = `winner-card-${i}`;
        card.textContent = "Waiting...";
        document.getElementById("winnerGrid").appendChild(card);
    }

    let winnersFound = 0;
    const winnerList = [];     // [ { name, prize, prizeImage } ]
    let visualPool = [...participants];
    let selectionPool = [...participants];
    let luckyCooldown = 0;

    function runNextRound() {
        if (winnersFound >= winnerCount) {
            finishRaffle(winnerList, activePrizes);
            return;
        }

        // Determine which prize this winner gets (cycle through list)
        const currentPrize = activePrizes[winnersFound % activePrizes.length];

        // Update modal header to show the current prize
        try {
            document.getElementById("prizeModal").textContent = currentPrize.name;
            const prizeImgEl = document.getElementById("prizeImageInModal");
            if (currentPrize.image) {
                prizeImgEl.src = currentPrize.image;
                prizeImgEl.style.cssText = 'display:block; max-width:100%; max-height:160px; object-fit:contain; border-radius:14px; margin:0 auto 16px; border:1px solid rgba(255,255,255,0.08);';
            } else {
                prizeImgEl.style.display = 'none';
            }
        } catch (e) { /* silent */ }

        const blockLucky = luckyCooldown > 0;
        if (luckyCooldown > 0) luckyCooldown--;

        let forcedWinner;
        // If only 1 winner and lucky mode is on, guarantee a lucky winner
        if (luckyModeActive && winnerCount === 1 && !blockLucky) {
            const luckyInPool = selectionPool.filter(p => {
                const name = typeof p === 'object' ? p.name : p;
                return luckyMap[name];
            });
            if (luckyInPool.length > 0) {
                forcedWinner = luckyInPool[Math.floor(Math.random() * luckyInPool.length)];
            } else {
                forcedWinner = weightedPick(selectionPool, blockLucky);
            }
        } else {
            forcedWinner = weightedPick(selectionPool, blockLucky);
        }

        const currentCard = document.getElementById(`winner-card-${winnersFound}`);
        if (currentCard) currentCard.classList.add('active');

        startRoulette(visualPool, timePerWinner, function (winner) {
            if (currentCard) {
                currentCard.textContent = typeof winner === 'object' ? winner.name : winner;
                currentCard.classList.remove('active');
                currentCard.classList.add('won');
            }

            const winnerName = typeof winner === 'object' ? winner.name : winner;
            // Look up department from original participants
            const winnerParticipant = participants.find(p => (typeof p === 'object' ? p.name : p) === winnerName);
            const winnerDept = winnerParticipant && winnerParticipant.department ? winnerParticipant.department : '';
            winnerList.push({
                name: winnerName,
                department: winnerDept,
                prize: currentPrize.name,
                prizeImage: currentPrize.image
            });
            winnersFound++;

            if (luckyModeActive && luckyMap[winnerName]) {
                luckyCooldown = 1 + Math.floor(Math.random() * 3);
            }

            visualPool = visualPool.filter(p => (typeof p === 'object' ? p.name : p) !== winnerName);
            selectionPool = selectionPool.filter(p => (typeof p === 'object' ? p.name : p) !== winnerName);

            if (winnersFound < winnerCount && visualPool.length > 0) {
                document.getElementById("rouletteLabel").textContent = "Spinning next...";
                runNextRound();
            } else {
                finishRaffle(winnerList, activePrizes);
            }
        }, forcedWinner);
    }

    setTimeout(runNextRound, 500);
}


function finishRaffle(winnerList, activePrizes) {
    const rouletteWrapper = document.querySelector('.roulette-wrapper');
    if (rouletteWrapper) rouletteWrapper.style.display = 'none';

    // Build prize label for session/history (combine unique prize names)
    const prizeNames = [...new Set(winnerList.map(w => w.prize))];
    const prizeLabel = prizeNames.join(", ");

    sessionStorage.setItem("winners", JSON.stringify(winnerList.map(w => w.name)));
    sessionStorage.setItem("prize", prizeLabel);

    saveToHistory(winnerList.map(w => ({ name: w.name, department: w.department || '' })), prizeLabel);

    document.getElementById("prizeSummaryModal").textContent = prizeLabel;
    const summaryList = document.getElementById("summaryList");
    summaryList.innerHTML = "";
    winnerList.forEach((entry, index) => {
        const item = document.createElement("li");
        item.className = "summary-item";
        item.innerHTML = `
            <span class="winner-name">Winner #${index + 1}: ${entry.name}</span>
            <span class="prize-name">${entry.prize}</span>
        `;
        summaryList.appendChild(item);
    });

    lastWinners = winnerList.map(w => w.name);
    handleWinnerRemoval();

    document.getElementById("timerInput").disabled = false;
    document.getElementById("prizeInput").disabled = false;
    document.getElementById("prizeImageInput").disabled = false;
    document.getElementById("prizeImageURL").disabled = false;

    setTimeout(() => {
        const btn = document.getElementById("summaryBtnWrapper");
        if (btn) btn.style.display = "block";
    }, 400);
}

function openSummaryModal() {
    const winnerModalEl = document.getElementById('winnerModal');
    const winnerModalInstance = bootstrap.Modal.getInstance(winnerModalEl);

    if (winnerModalInstance) {
        winnerModalEl.addEventListener('hidden.bs.modal', function onHidden() {
            winnerModalEl.removeEventListener('hidden.bs.modal', onHidden);
            const resultModal = new bootstrap.Modal(document.getElementById('winnersResultModal'));
            resultModal.show();
        });
        winnerModalInstance.hide();
    } else {
        const resultModal = new bootstrap.Modal(document.getElementById('winnersResultModal'));
        resultModal.show();
    }
}

function handleWinnerRemoval() {
    const removeWinnersCheck = document.getElementById("removeWinnersCheck");
    if (!removeWinnersCheck) return;

    if (removeWinnersCheck.checked) {
        participants = participants.filter(p => !lastWinners.includes(p.name));
    } else {
        lastWinners.forEach(winnerName => {
            if (!participants.some(p => p.name === winnerName)) {
                participants.push({ name: winnerName, department: "" });
            }
        });
    }

    filteredParticipants = [...participants];
    const countElement = document.getElementById("count");
    if (countElement) {
        countElement.textContent = participants.length;
    }
    updateParticipantTable();
}

document.addEventListener('DOMContentLoaded', function () {
    const removeCheck = document.getElementById("removeWinnersCheck");
    if (removeCheck) {
        removeCheck.addEventListener('change', handleWinnerRemoval);
    }
});

function resetRaffle() {
    participants = [];
    filteredParticipants = [];
    selectedParticipants = [];
    lastWinners = [];
    prize = "No prize set";
    prizeImage = "";
    prizeList = [];

    clearPrizesFromStorage();

    document.getElementById("timerInput").disabled = false;
    document.getElementById("prizeInput").disabled = false;
    document.getElementById("prizeImageInput").disabled = false;
    document.getElementById("prizeImageURL").disabled = false;

    document.getElementById("prizePreviewCard").style.display = 'none';
    document.getElementById("prizeImagePreview").src = '';
    document.getElementById("count").textContent = "0";
    document.getElementById("participantList").innerHTML = "";
    document.getElementById("prizeInput").value = "";
    document.getElementById("prizeImageURL").value = "";
    renderPrizeList();
}

