/**
 * DevDNA v1.0 - Profile Page Logic
 * Shows user stats, history, retake, delete account
 */

import { getUserByGmail, deleteUser, isFirebaseConfigured, sanitizeGmail } from './firebase.js';
import { getAuthInstance } from './firebase.js';

let currentUserData = null;

export async function openProfile(gmail){
    const section = document.getElementById('profile-section');
    if(!section) return;
    // Hide others
    document.querySelectorAll('.section').forEach(s=>{ s.style.display='none'; s.classList.remove('active'); });
    section.style.display='block';
    void section.offsetWidth;
    section.classList.add('active');

    await renderProfile(gmail);
}

async function renderProfile(gmail){
    const container = document.getElementById('profile-content');
    if(!container){ console.warn('profile-content missing'); return; }
    container.innerHTML = '<div class="mono" style="text-align:center; padding:20px;">Loading profile...</div>';

    const user = await getUserByGmail(gmail);
    if(!user){
        container.innerHTML = '<div class="mono">User not found. Please sign in.</div>';
        return;
    }
    currentUserData = user;

    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : 'Unknown';
    const lastQuiz = user.lastPlayed ? new Date(user.lastPlayed).toLocaleString() : 'Never';
    const daysActive = user.firstPlayed ? Math.max(1, Math.floor((Date.now() - user.firstPlayed)/ (24*60*60*1000))) : 0;

    // Calculate total history
    const history = user.archetypeHistory || [];

    container.innerHTML = `
        <div class="profile-header glass-panel" style="padding:20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
            <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=a855f7&color=fff`}" style="width:64px; height:64px; border-radius:50%; border:2px solid var(--neon-purple);">
            <div>
                <div style="font-family:var(--font-display); font-size:22px; font-weight:800;">${user.displayName}</div>
                <div class="mono" style="font-size:11px; color:var(--text-muted);">${user.gmail} • Member Since ${memberSince}</div>
                ${user.isBanned?'<div style="color:#ff4d4d; font-size:12px;">🚫 BANNED</div>':''}
                ${user.isFeatured?'<div style="color:var(--neon-green); font-size:12px;">⭐ Featured</div>':''}
            </div>
        </div>

        <div class="overview-grid" style="margin-top:16px;">
            <div class="overview-card glass-panel"><div class="overview-label">Total Quizzes</div><div class="overview-num" style="color:var(--neon-green)">${user.totalQuizzes||0}</div></div>
            <div class="overview-card glass-panel"><div class="overview-label">Most Frequent</div><div class="overview-num" style="font-size:18px;">${user.mostFrequentArchetype? `${getArchetypeEmoji(user.mostFrequentArchetype)} ${user.mostFrequentArchetype}` : '—'}</div></div>
            <div class="overview-card glass-panel"><div class="overview-label">Days Active</div><div class="overview-num">${daysActive}</div></div>
            <div class="overview-card glass-panel"><div class="overview-label">Last Quiz</div><div class="overview-num" style="font-size:12px;">${lastQuiz}</div></div>
        </div>

        <div class="glass-panel" style="padding:18px; margin-top:16px;">
            <div class="mono" style="font-size:10px; letter-spacing:0.16em; margin-bottom:12px; color:var(--text-muted);">FULL ARCHETYPE BREAKDOWN (ALL TIME)</div>
            <div id="profile-breakdown"></div>
        </div>

        <div class="glass-panel" style="padding:18px; margin-top:16px;">
            <div class="mono" style="font-size:10px; letter-spacing:0.16em; margin-bottom:12px;">ARCHETYPE HISTORY (10 per page)</div>
            <div id="profile-history"></div>
            <div id="profile-history-pagination" style="display:flex; gap:8px; justify-content:center; margin-top:12px;"></div>
        </div>

        <div style="display:flex; gap:12px; margin-top:18px; flex-wrap:wrap;">
            <button id="profile-retake-btn" class="btn btn-primary">🔄 Retake Quiz</button>
            <button id="profile-delete-btn" class="btn-admin-red">🗑️ Delete My Account</button>
        </div>
    `;

    // Breakdown
    renderProfileBreakdown(user);

    // History paginated
    renderHistoryPage(user, 0);

    // Bind buttons
    document.getElementById('profile-retake-btn')?.addEventListener('click', ()=>{
        try{ window.__DevDNA?.playSFX?.('click'); }catch{}
        location.hash = '';
        document.dispatchEvent(new CustomEvent('devdna-retake'));
    });
    document.getElementById('profile-delete-btn')?.addEventListener('click', async ()=>{
        if(!confirm('Delete your account? This cannot be undone. All your stats will be lost.')) return;
        if(!confirm('Are you REALLY sure? Type YES to confirm?')) return;
        await deleteUser(user.gmail);
        try{ localStorage.removeItem('devdna_user_session'); }catch{}
        alert('Account deleted. You will be signed out.');
        location.href = location.origin + location.pathname;
    });
}

function getArchetypeEmoji(key){
    const map = {
        frontend:'🎨', backend:'🛠', fullstack:'⚡', debugging:'🐞', ai:'🤖',
        security:'🔒', cloud:'☁️', game:'🎮', mobile:'📱', data:'🧠'
    };
    return map[key]||'❓';
}

function renderProfileBreakdown(user){
    const container = document.getElementById('profile-breakdown');
    if(!container) return;
    const counts = user.archetypeCounts || {};
    const total = Object.values(counts).reduce((s,v)=>s+v,0) || 1;
    const entries = Object.keys(counts).map(k=>({key:k, count:counts[k]||0, percent: Math.round(((counts[k]||0)/total)*100)}))
        .sort((a,b)=>b.percent-a.percent);
    
    container.innerHTML = entries.map(e=>{
        const emoji = getArchetypeEmoji(e.key);
        const color = getArchetypeColor(e.key);
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:13px; color:${color}">${emoji} ${e.key}</span>
                <span class="mono" style="font-size:12px; color:${color}">${e.percent}% (${e.count})</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:999px; margin-bottom:12px; overflow:hidden;">
                <div style="width:${e.percent}%; height:100%; background:linear-gradient(90deg, ${color}, ${color}aa); box-shadow:0 0 8px ${color}; transition:width 0.8s;"></div>
            </div>
        `;
    }).join('');
}

function getArchetypeColor(key){
    const map={
        frontend:'#00ccff', backend:'#00ff99', fullstack:'#a855f7', debugging:'#ff8a00', ai:'#00ffff',
        security:'#ff3333', cloud:'#33ccff', game:'#ffaa00', mobile:'#00ffcc', data:'#c77dff'
    };
    return map[key]||'#ffffff';
}

function renderHistoryPage(user, page){
    const history = user.archetypeHistory || [];
    const perPage = 10;
    const totalPages = Math.ceil(history.length / perPage);
    const start = page*perPage;
    const slice = history.slice(start, start+perPage);

    const container = document.getElementById('profile-history');
    const pagContainer = document.getElementById('profile-history-pagination');
    if(!container) return;

    if(slice.length===0){
        container.innerHTML = '<div class="mono" style="text-align:center; color:var(--text-muted); padding:12px;">No history yet — take your first quiz!</div>';
        return;
    }

    container.innerHTML = slice.map((h,i)=>{
        const date = new Date(h.timestamp).toLocaleString();
        return `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--border-glass); margin-bottom:8px;">
            <span>${getArchetypeEmoji(h.archetype)} ${h.archetype}</span>
            <span class="mono" style="font-size:11px; color:var(--text-muted);">${date}</span>
        </div>`;
    }).join('');

    if(pagContainer){
        pagContainer.innerHTML='';
        for(let p=0;p<totalPages;p++){
            const btn=document.createElement('button');
            btn.textContent = (p+1).toString();
            btn.className = p===page ? 'btn-admin-green' : 'btn-admin-blue';
            btn.style.cssText='padding:6px 12px; font-size:11px; min-width:32px;';
            btn.addEventListener('click', ()=>renderHistoryPage(user, p));
            pagContainer.appendChild(btn);
        }
    }
}

export function getCurrentProfileUser(){ return currentUserData; }
