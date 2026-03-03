// ─── Global State ────────────────────────────────────────────────────────────
let participants = [];
let filteredParticipants = [];
let prize = "No prize set";
let prizeImage = "";
let selectedParticipants = [];
let lastWinners = [];
let luckyModeActive = false;

// ─── Lucky Mode Toggle ──────────────────────────────────────────────────────
function toggleLuckyMode() {
    luckyModeActive = !luckyModeActive;
    document.title = luckyModeActive
        ? '🔴 Raffle Draw'
        : 'Raffle Draw';
}

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLuckyMode();
    }
});
