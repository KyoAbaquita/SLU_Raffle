// ─── Toast Notification Utility ─────────────────────────────────────────────

/**
 * showToast(message, type, duration)
 * @param {string} message  - Text to display
 * @param {'info'|'success'|'warning'|'error'} type - Visual style
 * @param {number} duration - Auto-dismiss after ms (default 3500)
 */
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        info: '💬',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `app-toast app-toast--${type}`;
    toast.style.setProperty('--toast-duration', `${duration / 1000}s`);
    toast.innerHTML = `
        <span class="app-toast__icon">${icons[type] || icons.info}</span>
        <span class="app-toast__msg">${message}</span>
        <button class="app-toast__close" onclick="this.closest('.app-toast').remove()">✕</button>
        <div class="app-toast__progress"></div>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('app-toast--show'));
    });

    // Auto-dismiss
    let timer = setTimeout(() => dismissToast(toast), duration);

    // Pause auto-dismiss and progress bar on hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        const bar = toast.querySelector('.app-toast__progress');
        if (bar) bar.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
        const bar = toast.querySelector('.app-toast__progress');
        if (bar) bar.style.animationPlayState = 'running';
        timer = setTimeout(() => dismissToast(toast), 1500);
    });
}

function dismissToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.remove('app-toast--show');
    toast.classList.add('app-toast--hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}
