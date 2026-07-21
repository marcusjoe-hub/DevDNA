/**
 * DevDNA - Admin Panel Logic v2
 * Handles #secret-admin-only route
 * Password: 2trh-8D
 */

import { subscribeToLeaderboard, subscribeToSettings, updateEventStatus, updateAnnouncement, clearAllSubmissions, getLeaderboardData } from './firebase.js';

const ADMIN_PASSWORD = '2trh-8D';
const SESSION_KEY = 'devdna_admin_auth_v2';

const DOM = {
    adminSection: document.getElementById('admin-section'),
    loginBox: document.getElementById('admin-login'),
    dashboard: document.getElementById('admin-dashboard'),
    passwordInput: document.getElementById('admin-password'),
    authBtn: document.getElementById('admin-auth-btn'),
    errorMsg: document.getElementById('admin-error'),
    terminalLog: document.getElementById('admin-terminal-log'),
    eventBadge: document.getElementById('event-badge'),
    totalSubs: document.getElementById('admin-total-subs'),
    statsGrid: document.getElementById('admin-stats-grid'),
    announcementInput: document.getElementById('admin-announcement-input'),
    updateBannerBtn: document.getElementById('admin-update-banner'),
    hideBannerBtn: document.getElementById('admin-hide-banner'),
    startEventBtn: document.getElementById('admin-start-event'),
    closeEventBtn: document.getElementById('admin-close-event'),
    clearBtn: document.getElementById('admin-clear-data'),
    exportBtn: document.getElementById('admin-export-data'),
    logoutBtn: document.getElementById('admin-logout'),
    confirmModal: document.getElementById('admin-confirm-modal'),
    confirmYes: document.getElementById('admin-confirm-yes'),
    confirmNo: document.getElementById('admin-confirm-no')
};

let settingsUnsub = null;
let leaderboardUnsub = null;
let currentSettings = null;
let currentCounts = null;

// FIX 6: Add colors for big glowing numbers per archetype theme
const ARCHETYPES = {
    frontend: { name: 'Frontend Wizard', emoji: '🎨', color: '#00ccff' },
    backend: { name: 'Backend Architect', emoji: '🛠', color: '#00ff99' },
    fullstack: { name: 'Full Stack Ninja', emoji: '⚡', color: '#a855f7' },
    debugging: { name: 'Debugging Detective', emoji: '🐞', color: '#ff8a00' },
    ai: { name: 'AI Explorer', emoji: '🤖', color: '#00ffff' }
};
const ORDER = ['frontend','backend','fullstack','debugging','ai'];

// ------------------------------------------------------------------
// Session
// ------------------------------------------------------------------
function isAuthenticated() {
    try { return localStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; }
}
function setAuthenticated(v) {
    try { localStorage.setItem(SESSION_KEY, v ? 'true' : 'false'); } catch {}
}

// ------------------------------------------------------------------
// Login flow
// ------------------------------------------------------------------
function showError() {
    DOM.errorMsg.textContent = '⛔ ACCESS DENIED — INVALID CODE';
    DOM.errorMsg.classList.add('show');
    DOM.passwordInput.classList.add('shake');
    DOM.loginBox.classList.add('glitch');
    if (navigator.vibrate) navigator.vibrate([50,30,50]);

    // play error tick if audio system exists
    window.__DevDNA?.playSFX?.('error');

    setTimeout(() => {
        DOM.passwordInput.classList.remove('shake');
        DOM.loginBox.classList.remove('glitch');
    }, 520);
    setTimeout(() => DOM.errorMsg.classList.remove('show'), 2800);
}

function showGranted() {
    DOM.terminalLog.textContent = '> ACCESS GRANTED. WELCOME, ADMIN.';
    DOM.errorMsg.classList.remove('show');
    setTimeout(() => {
        DOM.loginBox.style.display = 'none';
        DOM.dashboard.classList.remove('hidden');
        initDashboard();
    }, 700);
}

function attemptAuth() {
    const entered = DOM.passwordInput.value.trim();
    if (!entered) {
        DOM.passwordInput.focus();
        return;
    }
    if (entered === ADMIN_PASSWORD) {
        setAuthenticated(true);
        showGranted();
    } else {
        setAuthenticated(false);
        showError();
    }
}

function initLogin() {
    DOM.loginBox.style.display = 'block';
    DOM.dashboard.classList.add('hidden');
    DOM.passwordInput.value = '';
    DOM.terminalLog.textContent = '> AWAITING AUTHORIZATION...';
    DOM.errorMsg.classList.remove('show');

    DOM.authBtn.onclick = attemptAuth;
    DOM.passwordInput.onkeydown = (e) => {
        if (e.key === 'Enter') attemptAuth();
    };
}

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------
function updateEventUI(live) {
    if (!DOM.eventBadge) return;
    if (live) {
        DOM.eventBadge.textContent = '🟢 LIVE';
        DOM.eventBadge.className = 'admin-status-badge badge-live';
    } else {
        DOM.eventBadge.textContent = '🔴 CLOSED';
        DOM.eventBadge.className = 'admin-status-badge badge-closed';
    }
}

// FIX 6: Big glowing neon numbers with label COUNT, color per archetype, real-time
function renderStats(counts) {
    currentCounts = counts;
    const total = counts.total !== undefined ? counts.total : ORDER.reduce((s,k)=>s+(counts[k]||0),0);
    if (DOM.totalSubs) DOM.totalSubs.textContent = (total||0).toLocaleString();

    if (DOM.statsGrid) {
        DOM.statsGrid.innerHTML = '';
        ORDER.forEach(key => {
            const arch = ARCHETYPES[key];
            const count = counts[key] || 0;
            const card = document.createElement('div');
            card.className = 'stat-card';
            // Neon color per archetype
            card.style.borderColor = `${arch.color}33`;
            card.innerHTML = `
                <span class="stat-emoji">${arch.emoji}</span>
                <div class="stat-name">${arch.name}</div>
                <div class="stat-label">DEVELOPERS</div>
                <span class="stat-count" style="color:${arch.color}; text-shadow: 0 0 14px ${arch.color}, 0 0 32px ${arch.color}, 0 0 54px ${arch.color};">${count}</span>
            `;
            DOM.statsGrid.appendChild(card);
        });
    }
}

function initDashboard() {
    // Subscribe to settings
    if (settingsUnsub) settingsUnsub();
    settingsUnsub = subscribeToSettings((settings) => {
        currentSettings = settings;
        updateEventUI(settings.eventLive);
        if (DOM.announcementInput && document.activeElement !== DOM.announcementInput) {
            DOM.announcementInput.value = settings.announcement || '';
        }
    });

    // Subscribe to leaderboard
    if (leaderboardUnsub) leaderboardUnsub();
    leaderboardUnsub = subscribeToLeaderboard((counts) => {
        renderStats(counts);
    });

    // Button events
    DOM.startEventBtn.onclick = async () => {
        DOM.startEventBtn.disabled = true;
        await updateEventStatus(true);
        DOM.startEventBtn.disabled = false;
    };
    DOM.closeEventBtn.onclick = async () => {
        DOM.closeEventBtn.disabled = true;
        await updateEventStatus(false);
        DOM.closeEventBtn.disabled = false;
    };

    DOM.updateBannerBtn.onclick = async () => {
        const text = DOM.announcementInput.value.trim();
        if (!text) { DOM.announcementInput.focus(); return; }
        DOM.updateBannerBtn.disabled = true;
        await updateAnnouncement(text, true);
        DOM.updateBannerBtn.textContent = '✓ UPDATED';
        setTimeout(()=> DOM.updateBannerBtn.textContent = 'UPDATE BANNER', 1500);
        DOM.updateBannerBtn.disabled = false;
    };
    DOM.hideBannerBtn.onclick = async () => {
        DOM.hideBannerBtn.disabled = true;
        await updateAnnouncement(currentSettings?.announcement || '', false);
        DOM.hideBannerBtn.textContent = '✓ HIDDEN';
        setTimeout(()=> DOM.hideBannerBtn.textContent = 'HIDE BANNER', 1500);
        DOM.hideBannerBtn.disabled = false;
    };

    DOM.clearBtn.onclick = () => {
        DOM.confirmModal.classList.remove('hidden');
    };
    DOM.confirmNo.onclick = () => DOM.confirmModal.classList.add('hidden');
    DOM.confirmYes.onclick = async () => {
        DOM.confirmModal.classList.add('hidden');
        DOM.clearBtn.textContent = 'CLEARING...';
        await clearAllSubmissions();
        DOM.clearBtn.textContent = 'CLEAR ALL SUBMISSIONS';
    };

    DOM.exportBtn.onclick = async () => {
        const data = await getLeaderboardData();
        const payload = {
            exportedAt: new Date().toISOString(),
            settings: currentSettings,
            counts: data
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devdna-leaderboard-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    DOM.logoutBtn.onclick = () => {
        setAuthenticated(false);
        if (settingsUnsub) settingsUnsub();
        if (leaderboardUnsub) leaderboardUnsub();
        location.hash = '';
        location.reload();
    };
}

// ------------------------------------------------------------------
// Public entry called from main router
// ------------------------------------------------------------------
export function openAdminPanel() {
    if (DOM.adminSection) {
        DOM.adminSection.style.display = 'flex';
        DOM.adminSection.classList.add('active');
    }
    if (isAuthenticated()) {
        DOM.loginBox.style.display = 'none';
        DOM.dashboard.classList.remove('hidden');
        initDashboard();
    } else {
        initLogin();
    }
}

export function closeAdminPanel() {
    if (settingsUnsub) settingsUnsub();
    if (leaderboardUnsub) leaderboardUnsub();
    if (DOM.adminSection) {
        DOM.adminSection.style.display = 'none';
        DOM.adminSection.classList.remove('active');
    }
}

// Auto-bind hash check if module loaded standalone
if (typeof window !== 'undefined') {
    window.__DevDNA_Admin = { openAdminPanel, closeAdminPanel };
}
