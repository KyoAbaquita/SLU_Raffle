// ─── Simple Audio Generator ───────────────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTick() {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        console.warn('Audio tick error:', e);
    }
}

function playWinSound() {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
        console.warn('Audio win sound error:', e);
    }
}

// ─── Roulette Animation ─────────────────────────────────────────────────────
// pool         – clean visual participant list (no lucky duplicates)
// forcedWinner – optional; if set, animation lands on this person's real slot

let _stopRaffleCallback = null; // holds the stopNow fn while a spin is active

function stopRaffle() {
    if (_stopRaffleCallback) _stopRaffleCallback();
}

function startRoulette(pool, duration, callback, forcedWinner) {
    const rouletteNames = document.getElementById('rouletteNames');
    const label = document.getElementById('rouletteLabel');
    const stopBtn = document.getElementById('stopRaffleBtn');

    if (label) label.textContent = 'Spinning...';
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    // Clone and fully shuffle the visual pool so the order is random every spin
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    // Build visual strip from the CLEAN, SHUFFLED pool — no suspicious duplicates
    const REPEATS = 40;
    const repeatedPool = [];
    for (let i = 0; i < REPEATS; i++) repeatedPool.push(...shuffledPool);

    rouletteNames.innerHTML = repeatedPool
        .map(p => `<div class="roulette-name">${typeof p === 'object' ? p.name : p}</div>`)
        .join('');

    const itemHeight = 60;
    const viewportHeight = 180;
    const centerOffset = (viewportHeight / 2) - (itemHeight / 2);
    // CRITICAL: minSpins MUST be less than REPEATS, otherwise you scroll past the bottom into empty space
    const minSpins = 20;

    // Determine landing slot. If forcedWinner, find their real position in the
    // SHUFFLED pool so the strip visually lands on them — looks completely natural.
    let targetIndexInPool;
    if (forcedWinner) {
        const forcedName = typeof forcedWinner === 'object' ? forcedWinner.name : forcedWinner;
        const idx = shuffledPool.findIndex(p => (typeof p === 'object' ? p.name : p) === forcedName);
        targetIndexInPool = idx >= 0 ? idx : Math.floor(Math.random() * shuffledPool.length);
    } else {
        targetIndexInPool = Math.floor(Math.random() * shuffledPool.length);
    }
    const targetPosition = (minSpins * shuffledPool.length + targetIndexInPool) * itemHeight - centerOffset;

    // ── Easing ───────────────────────────────────────────
    // An intense single continuous easing curve.
    // Power 6 gives a dramatic slow-down without freezing too early.
    function easeOutIntense(t) {
        return 1 - Math.pow(1 - t, 6);
    }

    const startTime = Date.now();
    let animId = null;
    let lastTickPosition = 0;
    let stopped = false;

    // ── Shared finish logic ───────────────────────────────
    function finishSpin() {
        if (stopped) return;
        stopped = true;
        _stopRaffleCallback = null;

        cancelAnimationFrame(animId);
        rouletteNames.style.transform = `translateY(-${targetPosition}px)`;

        if (stopBtn) stopBtn.style.display = 'none';

        // Highlight the winner slot
        const finalNames = rouletteNames.querySelectorAll('.roulette-name');
        const winnerIdx = targetIndexInPool + (minSpins * shuffledPool.length);
        if (finalNames[winnerIdx]) {
            finalNames[winnerIdx].classList.add('winner-gold-glow');
        }

        if (label) label.textContent = '🎉 Winner!';
        playWinSound();

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 10,
                origin: { y: 0.6 },
                colors: ['#FFE400', '#FF0000', '#FFFFFF', '#00FFF0']
            });
        }

        const winner = forcedWinner || pool[targetIndexInPool];
        callback(winner);
    }

    // Expose stop callback so the button can trigger it
    _stopRaffleCallback = finishSpin;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = easeOutIntense(progress);
        const currentPosition = targetPosition * eased;

        rouletteNames.style.transform = `translateY(-${currentPosition}px)`;

        // Play tick sound whenever we pass an item boundary
        const currentItemIndex = Math.floor(currentPosition / itemHeight);
        if (currentItemIndex > lastTickPosition) {
            playTick();
            lastTickPosition = currentItemIndex;
        }

        // Finish when the strip has functionally stopped (< 1.5 px remaining)
        if (targetPosition - currentPosition < 1.5 || progress >= 1) {
            finishSpin();
        } else {
            animId = requestAnimationFrame(animate);
        }
    }

    animate();
}
