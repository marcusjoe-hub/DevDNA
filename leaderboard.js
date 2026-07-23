/**
 * DevDNA v1.0 - User Leaderboard with 4 Tabs
 * Tabs: Most Active, Most Diverse, Recent, Top per Archetype
 */

import { subscribeToUsers, isFirebaseConfigured } from './firebase.js';

const ARCHETYPES = {
    frontend: { name:'Frontend Wizard', emoji:'🎨', color:'#00ccff' },
    backend: { name:'Backend Architect', emoji:'🛠', color:'#00ff99' },
    fullstack: { name:'Full Stack Ninja', emoji:'⚡', color:'#a855f7' },
    debugging: { name:'Debugging Detective', emoji:'🐞', color:'#ff8a00' },
    ai: { name:'AI Explorer', emoji:'🤖', color:'#00ffff' },
    security: { name:'Security Sentinel', emoji:'🔒', color:'#ff3333' },
    cloud: { name:'Cloud Nomad', emoji:'☁️', color:'#33ccff' },
    game: { name:'Game Forge', emoji:'🎮', color:'#ffaa00' },
    mobile: { name:'Mobile Maverick', emoji:'📱', color:'#00ffcc' },
    data: { name:'Data Alchemist', emoji:'🧠', color:'#c77dff' }
};

let allUsers = [];
let currentTab = 'active';
let currentArchetypeFilter = 'frontend';
let usersUnsub = null;

function initLeaderboard(){
    const container = document.getElementById('user-leaderboard-section');
    if(!container) return;

    // Subscribe to users
    if(usersUnsub) usersUnsub();
    usersUnsub = subscribeToUsers((users)=>{
        allUsers = users.filter(u=>!u.isBanned);
        renderLeaderboard();
    });

    // Tab clicks
    document.querySelectorAll('.ulb-tab').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            document.querySelectorAll('.ulb-tab').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            if(currentTab==='top'){
                document.getElementById('ulb-archetype-subtabs')?.classList.remove('hidden');
            } else {
                document.getElementById('ulb-archetype-subtabs')?.classList.add('hidden');
            }
            renderLeaderboard();
        });
    });

    document.querySelectorAll('.ulb-arch-tab').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            document.querySelectorAll('.ulb-arch-tab').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentArchetypeFilter = btn.dataset.arch;
            renderLeaderboard();
        });
    });
}

function getDiversityCount(user){
    const counts = user.archetypeCounts || {};
    return Object.values(counts).filter(v=>v>0).length;
}

function renderLeaderboard(){
    const listEl = document.getElementById('user-leaderboard-list');
    if(!listEl) return;

    let sorted = [...allUsers];

    // Featured pinned at top
    const featured = sorted.filter(u=>u.isFeatured);
    const normal = sorted.filter(u=>!u.isFeatured);

    if(currentTab==='active'){
        normal.sort((a,b)=>(b.totalQuizzes||0)-(a.totalQuizzes||0));
    } else if(currentTab==='diverse'){
        normal.sort((a,b)=> getDiversityCount(b) - getDiversityCount(a));
    } else if(currentTab==='recent'){
        const cutoff = Date.now() - 24*60*60*1000;
        sorted = [...allUsers].filter(u=> (u.lastPlayed||0) > cutoff);
        sorted.sort((a,b)=>(b.lastPlayed||0)-(a.lastPlayed||0));
        // Re-split featured for recent tab
        const recentFeatured = sorted.filter(u=>u.isFeatured);
        const recentNormal = sorted.filter(u=>!u.isFeatured);
        sorted = [...recentFeatured, ...recentNormal];
        // Early return rendering for recent
        renderList(sorted, listEl);
        return;
    } else if(currentTab==='top'){
        normal.sort((a,b)=>{
            const aCount = (a.archetypeCounts?.[currentArchetypeFilter]||0);
            const bCount = (b.archetypeCounts?.[currentArchetypeFilter]||0);
            return bCount - aCount;
        });
    }

    const finalSorted = [...featured.sort((a,b)=>(b.totalQuizzes||0)-(a.totalQuizzes||0)), ...normal];
    renderList(finalSorted, listEl);
}

function renderList(users, container){
    if(users.length===0){
        container.innerHTML = `<div class="mono" style="text-align:center; padding:20px; color:var(--text-muted);">No users yet — be the first!</div>`;
        return;
    }

    container.innerHTML = users.map((u, idx)=>{
        const rank = idx+1;
        let rankIcon = `#${rank}`;
        if(rank===1) rankIcon='🥇 #1';
        else if(rank===2) rankIcon='🥈 #2';
        else if(rank===3) rankIcon='🥉 #3';

        const diversity = getDiversityCount(u);
        const dominant = u.mostFrequentArchetype ? `${ARCHETYPES[u.mostFrequentArchetype]?.emoji||'❓'} ${u.mostFrequentArchetype}` : '—';
        
        let stat = '';
        if(currentTab==='active') stat = `${u.totalQuizzes||0} quizzes`;
        else if(currentTab==='diverse') stat = `${diversity}/10 archetypes`;
        else if(currentTab==='recent') stat = u.lastPlayed ? `${timeAgo(u.lastPlayed)} ago` : 'Never';
        else if(currentTab==='top') stat = `${u.archetypeCounts?.[currentArchetypeFilter]||0}x ${currentArchetypeFilter}`;

        const isFeatured = u.isFeatured ? ' style="border:1px solid var(--neon-green); box-shadow:0 0 18px rgba(0,255,153,0.25); background:linear-gradient(135deg, rgba(0,255,153,0.08), rgba(255,255,255,0.03));"' : '';

        return `
            <div class="leader-item" ${isFeatured}>
                <div class="leader-item-top">
                    <span class="mono" style="font-size:11px; min-width:48px;">${rankIcon}</span>
                    <img src="${u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=a855f7&color=fff`}" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--border-glass);">
                    <div class="leader-info">
                        <span class="leader-name">${u.displayName} ${u.isFeatured?'<span style="color:var(--neon-green);">⭐</span>':''}</span>
                        <span class="leader-count">${dominant}</span>
                    </div>
                </div>
                <span class="leader-percent" style="font-size:11px;">${stat}</span>
            </div>
        `;
    }).join('');
}

function timeAgo(ts){
    const diff = Date.now() - ts;
    const mins = Math.floor(diff/60000);
    if(mins<1) return 'just now';
    if(mins<60) return `${mins}m`;
    const hrs = Math.floor(mins/60);
    if(hrs<24) return `${hrs}h`;
    const days = Math.floor(hrs/24);
    return `${days}d`;
}

export function initUserLeaderboard(){
    // Called from main script after DOM ready
    if(document.getElementById('user-leaderboard-section')){
        initLeaderboard();
    }
}

// Auto-init if section exists
if(typeof window!=='undefined'){
    document.addEventListener('DOMContentLoaded', ()=>{
        if(document.getElementById('user-leaderboard-section')){
            initUserLeaderboard();
        }
    });
    window.__DevDNA_Leaderboard = { initUserLeaderboard };
}
