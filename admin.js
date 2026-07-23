/**
 * DevDNA v1.0 - Admin Panel
 * Google Auth + Roles (Owner > Admin > Admin) + 19 Perms + Fake Owner + Users + Leaderboard Ctrl + History + Chat
 * Owner: Marcus (OWNER_GMAIL_PLACEHOLDER)
 */

import { 
    OWNER_CONFIG,
    signInWithGoogle, signOutUser, onAuthChange,
    getAdminByGmail, getAllAdmins, subscribeToAdmins, createAdmin, updateAdmin, deleteAdmin,
    getDefaultPermissions, getPermissionDefs, sanitizeGmail,
    subscribeToLeaderboard, clearAllSubmissions, getLeaderboardData,
    subscribeToSettings, updateEventStatus, updateAnnouncement, updateTheme, updateLeaderboardSettings,
    getQuestions, subscribeToQuestions, addQuestion, updateQuestion, deleteQuestion,
    addActivityLog, subscribeToActivityLog, clearActivityLog,
    getAllUsers, subscribeToUsers, deleteUser, banUser, featureUser,
    getLeaderboardHistory, subscribeToLeaderboardHistory, deleteLeaderboardSnapshot, performAutoClear, addLeaderboardSnapshot,
    getChatChannels, subscribeToChatChannels, createChatChannel, deleteChatChannel, subscribeToChatMessages, sendChatMessage, editChatMessage, deleteChatMessage, subscribeToUnreadPings, clearUnreadPing, clearAllUnreadPings,
    isFirebaseConfigured
} from './firebase.js';
import { THEMES, applyTheme } from './themes.js';

const DOM = {
    adminSection: document.getElementById('admin-section'),
    authGoogle: document.getElementById('admin-auth-google'),
    authPassword: document.getElementById('admin-auth-password'),
    googleBtn: document.getElementById('google-signin-btn'),
    authError: document.getElementById('admin-auth-error'),
    identityName: document.getElementById('auth-identity-name'),
    identityGmail: document.getElementById('auth-identity-gmail'),
    passwordInput: document.getElementById('admin-password-input'),
    passwordBtn: document.getElementById('admin-password-btn'),
    passwordError: document.getElementById('admin-password-error'),
    attemptCounter: document.getElementById('admin-attempt-counter'),
    passwordTerminal: document.getElementById('admin-password-terminal'),
    backToGoogle: document.getElementById('admin-back-to-google'),
    dashboard: document.getElementById('admin-dashboard'),
    sidebar: document.getElementById('admin-sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    sidebarAvatar: document.getElementById('sidebar-avatar'),
    sidebarName: document.getElementById('sidebar-name'),
    sidebarRole: document.getElementById('sidebar-role'),
    logoutBtn: document.getElementById('admin-logout'),
    tabs: document.querySelectorAll('.sidebar-tab'),
    tabContents: document.querySelectorAll('.admin-tab-content'),
    // Dashboard
    overviewTotal: document.getElementById('overview-total'),
    overviewPopular: document.getElementById('overview-popular'),
    overviewEvent: document.getElementById('overview-event'),
    overviewAdmins: document.getElementById('overview-admins'),
    dashboardRecent: document.getElementById('dashboard-recent-activity'),
    dashboardStats: document.getElementById('dashboard-stats-grid'),
    // Event
    eventBadge: document.getElementById('event-badge'),
    startEventBtn: document.getElementById('admin-start-event'),
    closeEventBtn: document.getElementById('admin-close-event'),
    // Banner
    announcementInput: document.getElementById('admin-announcement-input'),
    updateBannerBtn: document.getElementById('admin-update-banner'),
    hideBannerBtn: document.getElementById('admin-hide-banner'),
    bannerPreview: document.getElementById('banner-preview'),
    // Questions
    questionsList: document.getElementById('questions-list'),
    addQuestionBtn: document.getElementById('add-question-btn'),
    questionEditorModal: document.getElementById('question-editor-modal'),
    qeTitle: document.getElementById('question-editor-title'),
    qeText: document.getElementById('qe-text'),
    qeOptions: document.getElementById('qe-options'),
    qeCancel: document.getElementById('qe-cancel'),
    qeSave: document.getElementById('qe-save'),
    deleteQuestionModal: document.getElementById('delete-question-modal'),
    deleteQNo: document.getElementById('delete-q-no'),
    deleteQYes: document.getElementById('delete-q-yes'),
    // Anonymous Counter (was leaderboard)
    totalSubs: document.getElementById('admin-total-subs'),
    statsGrid: document.getElementById('admin-stats-grid'),
    clearBtn: document.getElementById('admin-clear-data'),
    exportBtn: document.getElementById('admin-export-data'),
    confirmModal: document.getElementById('admin-confirm-modal'),
    confirmYes: document.getElementById('admin-confirm-yes'),
    confirmNo: document.getElementById('admin-confirm-no'),
    // Admins
    adminsList: document.getElementById('admins-list'),
    adminSearch: document.getElementById('admin-search'),
    addAdminBtn: document.getElementById('add-admin-btn'),
    addAdminModal: document.getElementById('add-admin-modal'),
    newGmail: document.getElementById('new-admin-gmail'),
    newName: document.getElementById('new-admin-name'),
    newPassword: document.getElementById('new-admin-password'),
    generatePassBtn: document.getElementById('generate-password-btn'),
    newRole: document.getElementById('new-admin-role'),
    newIsAdmin: document.getElementById('new-admin-is-administrator'),
    newDisplayAsOwner: document.getElementById('new-admin-display-as-owner'),
    fakeOwnerContainer: document.getElementById('fake-owner-toggle-container'),
    permsCheckboxes: document.getElementById('permissions-checkboxes'),
    addAdminCancel: document.getElementById('add-admin-cancel'),
    addAdminCreate: document.getElementById('add-admin-create'),
    editAdminModal: document.getElementById('edit-admin-modal'),
    editAdminTitle: document.getElementById('edit-admin-title'),
    editAdminContent: document.getElementById('edit-admin-content'),
    editAdminRemove: document.getElementById('edit-admin-remove'),
    editAdminCancel: document.getElementById('edit-admin-cancel'),
    editAdminSave: document.getElementById('edit-admin-save'),
    // Users
    usersList: document.getElementById('users-list'),
    usersSearch: document.getElementById('users-search'),
    usersSort: document.getElementById('users-sort'),
    usersTotalCount: document.getElementById('users-total-count'),
    // Leaderboard Ctrl
    autoclearInterval: document.getElementById('autoclear-interval'),
    nextClearTime: document.getElementById('next-clear-time'),
    autoclearCountdown: document.getElementById('autoclear-countdown'),
    saveAutoclearBtn: document.getElementById('save-autoclear-btn'),
    manualClearNowBtn: document.getElementById('manual-clear-now-btn'),
    freezeToggle: document.getElementById('freeze-leaderboard-toggle'),
    bannedUsersList: document.getElementById('banned-users-list'),
    featuredUsersList: document.getElementById('featured-users-list'),
    // History
    historyList: document.getElementById('history-list'),
    refreshHistoryBtn: document.getElementById('refresh-history-btn'),
    // Activity
    activityList: document.getElementById('activity-list'),
    activitySearch: document.getElementById('activity-search'),
    activityFilterRole: document.getElementById('activity-filter-role'),
    clearActivityBtn: document.getElementById('clear-activity-btn'),
    clearLogModal: document.getElementById('clear-log-modal'),
    clearLogNo: document.getElementById('clear-log-no'),
    clearLogYes: document.getElementById('clear-log-yes'),
    // Theme
    themeGrid: document.getElementById('theme-grid'),
    // Chat
    chatChannelsList: document.getElementById('chat-channels-list'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),
    chatMembersList: document.getElementById('chat-members-list'),
    chatHeader: document.getElementById('chat-header'),
    newChannelBtn: document.getElementById('new-channel-btn'),
    chatNotifSettingsBtn: document.getElementById('chat-notif-settings-btn'),
    chatUnreadBadge: document.getElementById('chat-unread-badge'),
    chatChannelModal: document.getElementById('chat-channel-modal'),
    newChannelName: document.getElementById('new-channel-name'),
    newChannelDesc: document.getElementById('new-channel-desc'),
    newChannelRestricted: document.getElementById('new-channel-restricted'),
    createChannelCancel: document.getElementById('create-channel-cancel'),
    createChannelCreate: document.getElementById('create-channel-create'),
    // Other modals
    usersActionModal: document.getElementById('users-action-modal'),
    usersActionContent: document.getElementById('users-action-content'),
    historyDetailModal: document.getElementById('history-detail-modal'),
    historyDetailContent: document.getElementById('history-detail-content')
};

let currentFirebaseUser=null;
let currentAdmin=null;
let allAdmins=[];
let allQuestions=[];
let activityLogs=[];
let allUsers=[];
let leaderboardHistory=[];
let chatChannels=[];
let currentChatChannel='general';
let chatMessagesUnsub=null;
let unreadPings=[];
let attemptCount=0;
let editingQuestionId=null;
let deletingQuestionId=null;
let editingAdminGmail=null;
let selectedUserGmail=null;
let questionsUnsub=null, adminsUnsub=null, leaderboardUnsub=null, settingsUnsub=null, activityUnsub=null, usersUnsub=null, historyUnsub=null, chatChannelsUnsub=null, unreadUnsub=null;
let modalHandlersInitialized=false;

const ARCHETYPES = {
    frontend:{name:'Frontend Wizard',emoji:'🎨',color:'#00ccff'},
    backend:{name:'Backend Architect',emoji:'🛠',color:'#00ff99'},
    fullstack:{name:'Full Stack Ninja',emoji:'⚡',color:'#a855f7'},
    debugging:{name:'Debugging Detective',emoji:'🐞',color:'#ff8a00'},
    ai:{name:'AI Explorer',emoji:'🤖',color:'#00ffff'},
    security:{name:'Security Sentinel',emoji:'🔒',color:'#ff3333'},
    cloud:{name:'Cloud Nomad',emoji:'☁️',color:'#33ccff'},
    game:{name:'Game Forge',emoji:'🎮',color:'#ffaa00'},
    mobile:{name:'Mobile Maverick',emoji:'📱',color:'#00ffcc'},
    data:{name:'Data Alchemist',emoji:'🧠',color:'#c77dff'}
};

function playClick(){ try{ window.__DevDNA?.playSFX?.('click'); }catch{} }
function getRoleEmoji(role){ if(role==='owner')return'👑'; if(role==='administrator')return'⚡'; return'🛡️'; }
function getRoleBadgeClass(role){ if(role==='owner')return'owner'; if(role==='administrator')return'administrator'; return'admin'; }
function isOwnerGmail(gmail){ return gmail?.toLowerCase()===OWNER_CONFIG.gmail.toLowerCase(); }
function userCan(permId){
    if(!currentAdmin) return false;
    if(currentAdmin.role==='owner') return true;
    if(currentAdmin.role==='administrator') return true;
    return !!currentAdmin.permissions?.[permId];
}
function canModifyAdmin(actor, target){
    // Rank enforcement: Owner can modify everyone except themselves (protected)
    // Administrator can modify regular ADMINs only, not Owner, not other Administrators, not themselves
    // Admin with manage_admins can modify other regular ADMINs only, not Owner, not Administrators, not themselves
    if(!actor || !target) return false;
    if(target.gmail.toLowerCase()===actor.gmail.toLowerCase()) return false; // cannot modify self
    if(target.role==='owner') return false; // NO ONE can modify owner
    if(actor.role==='owner') return true; // owner can modify everyone except self
    if(actor.role==='administrator'){
        if(target.role==='owner') return false;
        if(target.role==='administrator') return false; // admin cannot modify other admins
        return target.role==='admin';
    }
    if(actor.role==='admin'){
        if(!userCan('manage_admins')) return false;
        // regular admin can only modify other regular admins, not administrators, not owner, not self
        if(target.role!=='admin') return false;
        return true;
    }
    return false;
}
function generateHardPassword(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd=''; for(let i=0;i<16;i++) pwd+=chars[Math.floor(Math.random()*chars.length)];
    return pwd;
}
function closeModalById(id){
    const modal=document.getElementById(id);
    if(modal) modal.classList.add('hidden');
    if(id==='question-editor-modal') editingQuestionId=null;
    if(id==='delete-question-modal') deletingQuestionId=null;
    if(id==='edit-admin-modal') editingAdminGmail=null;
}
function closeAllModals(){
    document.querySelectorAll('.admin-confirm-modal').forEach(m=>m.classList.add('hidden'));
    editingQuestionId=null; deletingQuestionId=null;
}
function initModalCloseHandlers(){
    if(modalHandlersInitialized) return;
    modalHandlersInitialized=true;
    document.querySelectorAll('.modal-close-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
            playClick();
            const targetId=btn.dataset.close;
            if(targetId) closeModalById(targetId);
            else btn.closest('.admin-confirm-modal')?.classList.add('hidden');
        });
    });
    document.querySelectorAll('.admin-confirm-modal').forEach(modal=>{
        modal.addEventListener('click',(e)=>{
            if(e.target===modal){
                playClick();
                modal.classList.add('hidden');
                if(modal.id==='question-editor-modal') editingQuestionId=null;
                if(modal.id==='delete-question-modal') deletingQuestionId=null;
                if(modal.id==='edit-admin-modal') editingAdminGmail=null;
            }
        });
    });
    document.addEventListener('keydown',(e)=>{
        if(e.key==='Escape'){
            const open=Array.from(document.querySelectorAll('.admin-confirm-modal')).filter(m=>!m.classList.contains('hidden'));
            if(open.length>0){
                playClick();
                open.forEach(m=>m.classList.add('hidden'));
                editingQuestionId=null; deletingQuestionId=null;
            }
        }
    });
}
async function logActivity(action, details=''){
    if(!currentAdmin) return;
    try{
        const { addActivityLog } = await import('./firebase.js');
        await addActivityLog({gmail:currentAdmin.gmail, displayName:currentAdmin.displayName, role:currentAdmin.role, action, details});
    }catch{}
}

// Auth screens
function showGoogleScreen(){
    DOM.authGoogle?.classList.remove('hidden');
    DOM.authPassword?.classList.add('hidden');
    DOM.dashboard?.classList.add('hidden');
}
function showPasswordScreen(admin){
    DOM.authGoogle?.classList.add('hidden');
    DOM.authPassword?.classList.remove('hidden');
    DOM.dashboard?.classList.add('hidden');
    if(DOM.identityName) DOM.identityName.textContent=`Welcome, ${admin.displayName}`;
    // Fix: show identity
    const gmailEl=document.getElementById('auth-identity-gmail');
    if(gmailEl) gmailEl.textContent=`${admin.gmail} • Enter personal password`;
    DOM.passwordInput.value='';
    DOM.passwordError?.classList.remove('show');
    if(DOM.attemptCounter) DOM.attemptCounter.textContent='';
    attemptCount=0;
    DOM.passwordInput?.focus();
}
function showDashboardScreen(){
    DOM.authGoogle?.classList.add('hidden');
    DOM.authPassword?.classList.add('hidden');
    DOM.dashboard?.classList.remove('hidden');
}

// Sidebar
function initSidebar(){
    DOM.tabs.forEach(tab=>{
        tab.addEventListener('click',()=>{
            playClick();
            const perm=tab.dataset.perm;
            if(perm && !userCan(perm)) return;
            DOM.tabs.forEach(t=>t.classList.remove('active'));
            tab.classList.add('active');
            DOM.tabContents.forEach(c=>c.classList.remove('active'));
            const content=document.getElementById(`tab-${tab.dataset.tab}`);
            if(content) content.classList.add('active');
            if(window.innerWidth<=900) DOM.sidebar?.classList.add('collapsed');
        });
    });
    DOM.sidebarToggle?.addEventListener('click',()=>{
        playClick();
        DOM.sidebar?.classList.toggle('collapsed');
    });
}
function filterTabsByPermission(){
    DOM.tabs.forEach(tab=>{
        const perm=tab.dataset.perm;
        if(!perm){ tab.classList.remove('hidden-perm'); return; }
        if(userCan(perm)) tab.classList.remove('hidden-perm');
        else tab.classList.add('hidden-perm');
    });
}

// Google Sign-In
async function handleGoogleSignIn(){
    playClick();
    DOM.googleBtn.disabled=true;
    DOM.googleBtn.innerHTML='<span>⏳ Signing in...</span>';
    DOM.authError.classList.remove('show');
    try{
        const result=await signInWithGoogle();
        const gmail=result.user.email;
        const admin=await getAdminByGmail(gmail);
        if(!admin){
            DOM.authError.textContent=`⛔ ACCESS DENIED — ${gmail} not authorized.`;
            DOM.authError.classList.add('show');
            const { addActivityLog } = await import('./firebase.js');
            await addActivityLog({gmail, displayName:result.user.displayName||gmail, role:'unknown', action:'failed login — Gmail not authorized', details:gmail});
            setTimeout(async()=>{ await signOutUser(); DOM.authError.classList.remove('show'); },3000);
            return;
        }
        currentAdmin=admin;
        currentFirebaseUser=result.user;
        showPasswordScreen(admin);
        await logActivity('passed Google auth — awaiting password', `Gmail: ${gmail}`);
    }catch(e){
        DOM.authError.textContent=`Error: ${e.message||'Google sign-in failed'}`;
        DOM.authError.classList.add('show');
    }finally{
        DOM.googleBtn.disabled=false;
        DOM.googleBtn.innerHTML='<span style="font-size:18px;">🔐</span> Sign in with Google';
    }
}
async function handlePasswordAuth(){
    playClick();
    const entered=DOM.passwordInput.value.trim();
    if(!entered){ DOM.passwordInput.focus(); return; }
    if(!currentAdmin){ DOM.passwordError.textContent='Session expired'; DOM.passwordError.classList.add('show'); setTimeout(()=>showGoogleScreen(),1500); return; }
    if(entered!==currentAdmin.password){
        attemptCount++;
        DOM.passwordError.textContent=`⛔ ACCESS DENIED — Wrong password (Attempt ${attemptCount})`;
        DOM.passwordError.classList.add('show');
        DOM.passwordInput.classList.add('shake');
        DOM.authPassword.classList.add('glitch');
        if(DOM.attemptCounter) DOM.attemptCounter.textContent=`Failed attempts: ${attemptCount} — ${3-attemptCount} tries left`;
        setTimeout(()=>{ DOM.passwordInput.classList.remove('shake'); DOM.authPassword.classList.remove('glitch'); },520);
        const { addActivityLog } = await import('./firebase.js');
        await addActivityLog({gmail:currentAdmin.gmail, displayName:currentAdmin.displayName, role:currentAdmin.role, action:'failed password attempt', details:`Attempt ${attemptCount}`});
        if(attemptCount>=3){
            setTimeout(async()=>{ await signOutUser(); currentAdmin=null; currentFirebaseUser=null; showGoogleScreen(); },1500);
        }
        return;
    }
    DOM.passwordError.classList.remove('show');
    if(DOM.passwordTerminal) DOM.passwordTerminal.textContent=`> ACCESS GRANTED. WELCOME, ${currentAdmin.role.toUpperCase()}.`;
    await logActivity('logged in', `Role: ${currentAdmin.role}`);
    try{ localStorage.setItem('devdna_admin_session', JSON.stringify({gmail:currentAdmin.gmail, timestamp:Date.now()})); }catch{}
    setTimeout(()=>{ showDashboardScreen(); initDashboard(); },700);
}

// Dashboard
function initDashboard(){
    if(!currentAdmin) return;
    if(DOM.sidebarAvatar) DOM.sidebarAvatar.src=currentAdmin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName)}&background=a855f7&color=fff`;
    if(DOM.sidebarName) DOM.sidebarName.innerHTML=`${currentAdmin.displayName} ${getRoleEmoji(currentAdmin.role)}`;
    if(DOM.sidebarRole){ DOM.sidebarRole.textContent=currentAdmin.role.toUpperCase(); DOM.sidebarRole.className=`sidebar-role ${getRoleBadgeClass(currentAdmin.role)}`; }
    filterTabsByPermission();
    initSidebar();

    if(questionsUnsub) questionsUnsub();
    questionsUnsub=subscribeToQuestions((qs)=>{ allQuestions=qs; renderQuestions(); renderDashboardStats(); });
    if(adminsUnsub) adminsUnsub();
    adminsUnsub=subscribeToAdmins((admins)=>{ allAdmins=admins; renderAdmins(); renderDashboardStats(); renderUsers(); });
    if(leaderboardUnsub) leaderboardUnsub();
    leaderboardUnsub=subscribeToLeaderboard((counts)=>{ renderLeaderboardStats(counts); renderDashboardStats(counts); });
    if(activityUnsub) activityUnsub();
    activityUnsub=subscribeToActivityLog((logs)=>{ activityLogs=logs; renderActivity(); renderDashboardRecent(); });
    if(settingsUnsub) settingsUnsub();
    import('./firebase.js').then(mod=>{
        settingsUnsub=mod.subscribeToSettings((settings)=>{
            updateEventBadge(settings.eventLive);
            if(DOM.overviewEvent){ DOM.overviewEvent.textContent=settings.eventLive?'LIVE':'CLOSED'; DOM.overviewEvent.style.color=settings.eventLive?'var(--neon-green)':'#ff5c5c'; }
            if(DOM.announcementInput && document.activeElement!==DOM.announcementInput){ DOM.announcementInput.value=settings.announcement||''; if(DOM.bannerPreview) DOM.bannerPreview.textContent=settings.announcement||'No banner'; }
            // Leaderboard Ctrl
            if(DOM.autoclearInterval) DOM.autoclearInterval.value=settings.leaderboardAutoClearDays||10;
            if(DOM.nextClearTime) DOM.nextClearTime.textContent=settings.nextAutoClearAt?new Date(settings.nextAutoClearAt).toLocaleString():'Never';
            if(DOM.freezeToggle) DOM.freezeToggle.checked=!!settings.leaderboardFrozen;
            updateAutoclearCountdown(settings);
        });
    });

    // Users
    if(usersUnsub) usersUnsub();
    usersUnsub=subscribeToUsers((users)=>{ allUsers=users; renderUsers(); renderBannedFeatured(); renderDashboardStats(); });

    // History
    if(historyUnsub) historyUnsub();
    historyUnsub=subscribeToLeaderboardHistory((history)=>{ leaderboardHistory=history; renderHistory(); });

    // Chat channels
    if(chatChannelsUnsub) chatChannelsUnsub();
    chatChannelsUnsub=subscribeToChatChannels((channels)=>{ chatChannels=channels; renderChatChannels(); });

    // Unread pings
    if(unreadUnsub) unreadUnsub();
    unreadUnsub=subscribeToUnreadPings(currentAdmin.gmail, (pings)=>{
        const badge=DOM.chatUnreadBadge;
        if(badge){
            if(pings.length>0){ badge.textContent=pings.length; badge.classList.remove('hidden'); }
            else badge.classList.add('hidden');
        }
    });

    renderThemeGrid();
    bindDashboardEvents();
}

function bindDashboardEvents(){
    DOM.startEventBtn && (DOM.startEventBtn.onclick=async()=>{
        playClick(); if(!userCan('event_control')) return alert('No permission'); DOM.startEventBtn.disabled=true; const mod=await import('./firebase.js'); await mod.updateEventStatus(true); await logActivity('started the event'); DOM.startEventBtn.disabled=false;
    });
    DOM.closeEventBtn && (DOM.closeEventBtn.onclick=async()=>{
        playClick(); if(!userCan('event_control')) return alert('No permission'); DOM.closeEventBtn.disabled=true; const mod=await import('./firebase.js'); await mod.updateEventStatus(false); await logActivity('closed the event'); DOM.closeEventBtn.disabled=false;
    });
    DOM.updateBannerBtn && (DOM.updateBannerBtn.onclick=async()=>{
        playClick(); if(!userCan('change_banner')) return alert('No permission'); const text=DOM.announcementInput.value.trim(); if(!text) return DOM.announcementInput.focus(); DOM.updateBannerBtn.disabled=true; const mod=await import('./firebase.js'); await mod.updateAnnouncement(text,true); await logActivity('updated banner',`"${text}"`); DOM.updateBannerBtn.textContent='✓ UPDATED'; setTimeout(()=>DOM.updateBannerBtn.textContent='UPDATE BANNER',1500); DOM.updateBannerBtn.disabled=false;
    });
    DOM.hideBannerBtn && (DOM.hideBannerBtn.onclick=async()=>{
        playClick(); if(!userCan('change_banner')) return alert('No permission'); DOM.hideBannerBtn.disabled=true; const mod=await import('./firebase.js'); const cur=DOM.announcementInput.value.trim(); await mod.updateAnnouncement(cur,false); await logActivity('hid banner'); DOM.hideBannerBtn.textContent='✓ HIDDEN'; setTimeout(()=>DOM.hideBannerBtn.textContent='HIDE BANNER',1500); DOM.hideBannerBtn.disabled=false;
    });
    DOM.announcementInput?.addEventListener('input',()=>{ if(DOM.bannerPreview) DOM.bannerPreview.textContent=DOM.announcementInput.value||'Live preview...'; });

    DOM.addQuestionBtn && (DOM.addQuestionBtn.onclick=()=>{ playClick(); if(!userCan('add_questions')) return alert('No permission'); openQuestionEditor(null); });
    DOM.qeCancel && (DOM.qeCancel.onclick=()=>{ playClick(); closeQuestionEditor(); });
    DOM.qeSave && (DOM.qeSave.onclick=async()=>{ playClick(); await saveQuestion(); });
    DOM.deleteQNo && (DOM.deleteQNo.onclick=()=>{ playClick(); DOM.deleteQuestionModal.classList.add('hidden'); deletingQuestionId=null; });
    DOM.deleteQYes && (DOM.deleteQYes.onclick=async()=>{
        playClick();
        if(deletingQuestionId){
            if(!userCan('delete_questions')) return alert('No permission');
            const mod=await import('./firebase.js');
            await mod.deleteQuestion(deletingQuestionId);
            await logActivity('deleted question',`ID: ${deletingQuestionId}`);
            deletingQuestionId=null;
            DOM.deleteQuestionModal.classList.add('hidden');
        }
    });

    DOM.clearBtn && (DOM.clearBtn.onclick=()=>{ playClick(); if(!userCan('clear_submissions')) return alert('No permission'); DOM.confirmModal.classList.remove('hidden'); });
    DOM.confirmNo && (DOM.confirmNo.onclick=()=>{ playClick(); DOM.confirmModal.classList.add('hidden'); });
    DOM.confirmYes && (DOM.confirmYes.onclick=async()=>{
        playClick(); DOM.confirmModal.classList.add('hidden'); DOM.clearBtn.textContent='CLEARING...'; const mod=await import('./firebase.js'); await mod.clearAllSubmissions(); await logActivity('cleared all submissions'); DOM.clearBtn.textContent='CLEAR ALL SUBMISSIONS';
    });
    DOM.exportBtn && (DOM.exportBtn.onclick=async()=>{
        playClick(); if(!userCan('download_data')) return alert('No permission'); const data=await getLeaderboardData(); const payload={exportedAt:new Date().toISOString(), counts:data}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`devdna-leaderboard-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); await logActivity('downloaded leaderboard data');
    });

    DOM.addAdminBtn && (DOM.addAdminBtn.onclick=()=>{
        playClick();
        // FIX 11.3: Only OWNER and ADMINISTRATOR can create admins
        if(currentAdmin.role!=='owner' && currentAdmin.role!=='administrator'){ alert('Only OWNER and ADMINISTRATOR can create admins'); return; }
        if(!userCan('manage_admins') && currentAdmin.role!=='owner' && currentAdmin.role!=='administrator') return alert('No permission');
        openAddAdminModal();
    });
    DOM.addAdminCancel && (DOM.addAdminCancel.onclick=()=>{ playClick(); DOM.addAdminModal.classList.add('hidden'); });
    DOM.addAdminCreate && (DOM.addAdminCreate.onclick=async()=>{ playClick(); await handleCreateAdmin(); });
    DOM.generatePassBtn && (DOM.generatePassBtn.onclick=()=>{ playClick(); DOM.newPassword.value=generateHardPassword(); });
    DOM.newIsAdmin && (DOM.newIsAdmin.onchange=()=>{ renderPermissionsCheckboxes(); });
    DOM.newRole && (DOM.newRole.onchange=()=>{ renderPermissionsCheckboxes(); });
    // Fake owner toggle
    const fakeToggle=document.getElementById('new-admin-display-as-owner');
    if(fakeToggle){
        // Only OWNER can see fake owner toggle
        if(currentAdmin?.role==='owner'){ document.getElementById('fake-owner-toggle-container')?.classList.remove('hidden'); }
        else { document.getElementById('fake-owner-toggle-container')?.classList.add('hidden'); }
    }

    DOM.editAdminCancel && (DOM.editAdminCancel.onclick=()=>{ playClick(); DOM.editAdminModal.classList.add('hidden'); editingAdminGmail=null; });
    DOM.editAdminSave && (DOM.editAdminSave.onclick=async()=>{ playClick(); await handleEditAdminSave(); });
    DOM.editAdminRemove && (DOM.editAdminRemove.onclick=async()=>{
        playClick(); if(!editingAdminGmail) return; const target=allAdmins.find(a=>a.gmail===editingAdminGmail); if(!canModifyAdmin(currentAdmin, target)){ alert('Cannot modify equal/higher rank or self'); return; } if(confirm(`Remove admin ${editingAdminGmail}?`)){ try{ await deleteAdmin(editingAdminGmail); await logActivity('removed admin',editingAdminGmail); DOM.editAdminModal.classList.add('hidden'); editingAdminGmail=null; }catch(e){ alert(e.message); } }
    });
    DOM.adminSearch && (DOM.adminSearch.oninput=()=>renderAdmins());

    DOM.clearActivityBtn && (DOM.clearActivityBtn.onclick=()=>{ playClick(); if(!userCan('clear_activity_log')) return alert('No permission'); DOM.clearLogModal.classList.remove('hidden'); });
    DOM.clearLogNo && (DOM.clearLogNo.onclick=()=>{ playClick(); DOM.clearLogModal.classList.add('hidden'); });
    DOM.clearLogYes && (DOM.clearLogYes.onclick=async()=>{ playClick(); DOM.clearLogModal.classList.add('hidden'); await clearActivityLog(); await addActivityLog({gmail:currentAdmin.gmail, displayName:currentAdmin.displayName, role:currentAdmin.role, action:'cleared activity log'}); });

    DOM.activitySearch && (DOM.activitySearch.oninput=()=>renderActivity());
    DOM.activityFilterRole && (DOM.activityFilterRole.onchange=()=>renderActivity());

    // Users tab
    DOM.usersSearch && (DOM.usersSearch.oninput=()=>renderUsers());
    DOM.usersSort && (DOM.usersSort.onchange=()=>renderUsers());

    // Leaderboard Ctrl
    DOM.saveAutoclearBtn && (DOM.saveAutoclearBtn.onclick=async()=>{
        playClick(); if(!userCan('manage_leaderboard')) return alert('No permission'); const val=DOM.autoclearInterval.value; const mod=await import('./firebase.js'); const days=val==='Never'? 'Never' : parseInt(val); const next=days==='Never'? null : Date.now()+days*24*60*60*1000; await mod.updateLeaderboardSettings({autoClearDays:days, nextClearAt:next}); await logActivity('changed auto-clear interval', `${days} days`); DOM.saveAutoclearBtn.textContent='✓ SAVED'; setTimeout(()=>DOM.saveAutoclearBtn.textContent='SAVE INTERVAL',1500);
    });
    DOM.manualClearNowBtn && (DOM.manualClearNowBtn.onclick=async()=>{
        playClick(); if(!userCan('manage_leaderboard')) return alert('No permission'); if(!confirm('Manual clear now? This will snapshot and reset user stats. Anonymous counter stays.')) return; const mod=await import('./firebase.js'); await mod.performAutoClear(currentAdmin.gmail); await logActivity('manually cleared leaderboard');
    });
    DOM.freezeToggle && (DOM.freezeToggle.onchange=async()=>{
        playClick(); if(!userCan('manage_leaderboard')) return alert('No permission'); const mod=await import('./firebase.js'); await mod.updateLeaderboardSettings({frozen:DOM.freezeToggle.checked}); await logActivity(DOM.freezeToggle.checked?'froze leaderboard':'unfroze leaderboard');
    });

    // History
    DOM.refreshHistoryBtn && (DOM.refreshHistoryBtn.onclick=()=>{ playClick(); renderHistory(); });

    // Chat
    DOM.newChannelBtn && (DOM.newChannelBtn.onclick=()=>{
        playClick(); if(currentAdmin.role!=='owner'){ alert('Only OWNER can create channels'); return; } DOM.chatChannelModal?.classList.remove('hidden');
    });
    document.getElementById('create-channel-cancel')?.addEventListener('click',()=>{ playClick(); DOM.chatChannelModal?.classList.add('hidden'); });
    document.getElementById('create-channel-create')?.addEventListener('click', async()=>{
        playClick();
        const name=DOM.newChannelName?.value.trim();
        const desc=DOM.newChannelDesc?.value.trim();
        const restricted=DOM.newChannelRestricted?.checked;
        if(!name){ alert('Channel name required'); return; }
        const mod=await import('./firebase.js');
        await mod.createChatChannel({name, description:desc, restricted});
        await logActivity('created channel', name);
        DOM.chatChannelModal?.classList.add('hidden');
        if(DOM.newChannelName) DOM.newChannelName.value='';
        if(DOM.newChannelDesc) DOM.newChannelDesc.value='';
    });
    DOM.chatSendBtn && (DOM.chatSendBtn.onclick=async()=>{ await handleChatSend(); });
    DOM.chatInput && (DOM.chatInput.addEventListener('keydown',(e)=>{
        if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleChatSend(); }
        if(e.key==='@'){
            // Show autocomplete
            showMentionAutocomplete();
        }
    }));

    // Logout
    DOM.logoutBtn && (DOM.logoutBtn.onclick=async()=>{
        playClick(); await logActivity('logged out'); await signOutUser(); currentAdmin=null; currentFirebaseUser=null; try{localStorage.removeItem('devdna_admin_session');}catch{} showGoogleScreen();
        if(questionsUnsub) questionsUnsub(); if(adminsUnsub) adminsUnsub(); if(leaderboardUnsub) leaderboardUnsub(); if(activityUnsub) activityUnsub(); if(settingsUnsub) settingsUnsub();
    });
    DOM.backToGoogle && (DOM.backToGoogle.onclick=async()=>{ playClick(); await signOutUser(); currentAdmin=null; currentFirebaseUser=null; showGoogleScreen(); });
}

function updateEventBadge(isLive){
    if(!DOM.eventBadge) return;
    if(isLive){ DOM.eventBadge.textContent='🟢 LIVE'; DOM.eventBadge.className='admin-status-badge badge-live'; }
    else{ DOM.eventBadge.textContent='🔴 CLOSED'; DOM.eventBadge.className='admin-status-badge badge-closed'; }
}

function renderDashboardStats(counts){
    const total = counts ? (counts.total||Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0)) : 0;
    if(DOM.overviewTotal) DOM.overviewTotal.textContent = counts ? (counts.total||0).toLocaleString() : '0';
    if(DOM.overviewAdmins) DOM.overviewAdmins.textContent = allAdmins.length.toString();
    if(counts && DOM.overviewPopular){
        const entries=Object.entries(counts).filter(([k])=>k!=='total').sort((a,b)=>b[1]-a[1]);
        if(entries.length>0){ const topKey=entries[0][0]; const arch=ARCHETYPES[topKey]; DOM.overviewPopular.textContent=arch?arch.name:topKey; }
    }
    if(DOM.dashboardStats){
        DOM.dashboardStats.innerHTML='';
        const source=counts||{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0};
        Object.keys(ARCHETYPES).forEach(key=>{
            const arch=ARCHETYPES[key]; const count=source[key]||0;
            const card=document.createElement('div'); card.className='stat-card';
            card.innerHTML=`<span class="stat-emoji">${arch.emoji}</span><div class="stat-name">${arch.name}</div><div class="stat-label">DEVELOPERS</div><span class="stat-count" style="color:${arch.color};">${count}</span>`;
            DOM.dashboardStats.appendChild(card);
        });
    }
}
function renderDashboardRecent(){
    if(!DOM.dashboardRecent) return;
    DOM.dashboardRecent.innerHTML='';
    const recent=activityLogs.slice(0,5);
    if(recent.length===0){ DOM.dashboardRecent.innerHTML='<div class="mono" style="font-size:11px; color:var(--text-muted);">No activity yet</div>'; return; }
    recent.forEach(log=>{
        const div=document.createElement('div'); div.className='activity-item';
        div.innerHTML=`<div><span>${getRoleEmoji(log.role)}</span><strong>${log.displayName}</strong> <span class="activity-time">${new Date(log.timestamp).toLocaleString()}</span></div><div>${log.action}${log.details?` — ${log.details}`:''}</div>`;
        DOM.dashboardRecent.appendChild(div);
    });
}
function renderLeaderboardStats(counts){
    const total=counts.total||Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0);
    if(DOM.totalSubs) DOM.totalSubs.textContent=total.toLocaleString();
    if(DOM.statsGrid){
        DOM.statsGrid.innerHTML='';
        Object.keys(ARCHETYPES).forEach(key=>{
            const arch=ARCHETYPES[key]; const count=counts[key]||0;
            const card=document.createElement('div'); card.className='stat-card';
            card.innerHTML=`<span class="stat-emoji">${arch.emoji}</span><div class="stat-name">${arch.name}</div><div class="stat-label">DEVELOPERS</div><span class="stat-count" style="color:${arch.color};">${count}</span>`;
            DOM.statsGrid.appendChild(card);
        });
    }
}

// Questions
function renderQuestions(){
    if(!DOM.questionsList) return;
    DOM.questionsList.innerHTML='';
    const filtered=[...allQuestions].sort((a,b)=>(a.order||0)-(b.order||0));
    filtered.forEach((q,idx)=>{
        const div=document.createElement('div'); div.className='question-item';
        const canEdit=userCan('edit_questions'); const canDelete=userCan('delete_questions');
        div.innerHTML=`<div class="question-item-header"><div style="display:flex; gap:10px; align-items:center;"><span class="question-item-order">#${q.order||idx+1}</span><span class="question-item-title">${q.text}</span></div><span>▼</span></div><div class="question-item-body"><div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">${(q.options||[]).map(opt=>{ const arch=ARCHETYPES[opt.archetype]||{emoji:'❓',name:opt.archetype}; return `<div class="q-option"><span class="q-option-emoji">${arch.emoji}</span><span class="q-option-text">${opt.text}</span><span class="q-option-arch" style="border-color:${arch.color}44; color:${arch.color};">${arch.name}</span></div>`; }).join('')}</div><div style="display:flex; gap:8px;">${canEdit?`<button class="btn-admin-blue q-edit-btn" data-id="${q.id}">✏️ Edit</button>`:''}${canDelete?`<button class="btn-admin-red q-delete-btn" data-id="${q.id}">❌ Delete</button>`:''}</div></div>`;
        const header=div.querySelector('.question-item-header');
        header.addEventListener('click',()=>{ playClick(); div.classList.toggle('expanded'); });
        div.querySelector('.q-edit-btn')?.addEventListener('click',(e)=>{ e.stopPropagation(); playClick(); openQuestionEditor(q.id); });
        div.querySelector('.q-delete-btn')?.addEventListener('click',(e)=>{ e.stopPropagation(); playClick(); deletingQuestionId=q.id; DOM.deleteQuestionModal?.classList.remove('hidden'); });
        DOM.questionsList.appendChild(div);
    });
    if(DOM.addQuestionBtn){ DOM.addQuestionBtn.style.display=userCan('add_questions')?'inline-flex':'none'; }
}
function openQuestionEditor(id){
    editingQuestionId=id;
    const q=allQuestions.find(x=>x.id===id);
    if(DOM.qeTitle) DOM.qeTitle.textContent=id?'Edit Question':'Add New Question';
    if(DOM.qeText) DOM.qeText.value=q?q.text:'';
    if(DOM.qeOptions){
        DOM.qeOptions.innerHTML='';
        for(let i=0;i<4;i++){
            const opt=q?.options?.[i]||{text:'',archetype:'frontend'};
            const row=document.createElement('div');
            row.style.cssText='display:flex; gap:8px; margin-bottom:8px; align-items:center;';
            row.innerHTML=`<span style="font-family:var(--font-mono); font-size:11px; width:20px;">${String.fromCharCode(65+i)}</span><input type="text" class="admin-input-sm qe-opt-text" placeholder="Answer text..." value="${opt.text.replace(/"/g,'&quot;')}" style="flex:1; margin-bottom:0;"><select class="admin-input-sm qe-opt-arch" style="max-width:140px; margin-bottom:0;"><option value="frontend" ${opt.archetype==='frontend'?'selected':''}>🎨 Frontend</option><option value="backend" ${opt.archetype==='backend'?'selected':''}>🛠 Backend</option><option value="fullstack" ${opt.archetype==='fullstack'?'selected':''}>⚡ Fullstack</option><option value="debugging" ${opt.archetype==='debugging'?'selected':''}>🐞 Debug</option><option value="ai" ${opt.archetype==='ai'?'selected':''}>🤖 AI</option><option value="security" ${opt.archetype==='security'?'selected':''}>🔒 Sec</option><option value="cloud" ${opt.archetype==='cloud'?'selected':''}>☁️ Cloud</option><option value="game" ${opt.archetype==='game'?'selected':''}>🎮 Game</option><option value="mobile" ${opt.archetype==='mobile'?'selected':''}>📱 Mobile</option><option value="data" ${opt.archetype==='data'?'selected':''}>🧠 Data</option></select>`;
            DOM.qeOptions.appendChild(row);
        }
    }
    DOM.questionEditorModal?.classList.remove('hidden');
}
function closeQuestionEditor(){ DOM.questionEditorModal?.classList.add('hidden'); editingQuestionId=null; }
async function saveQuestion(){
    const text=DOM.qeText.value.trim();
    if(!text){ alert('Question text required'); return; }
    const optRows=DOM.qeOptions.querySelectorAll('.qe-opt-text');
    const archRows=DOM.qeOptions.querySelectorAll('.qe-opt-arch');
    const options=[];
    for(let i=0;i<optRows.length;i++){
        const t=optRows[i].value.trim();
        const a=archRows[i].value;
        if(!t){ alert(`Option ${String.fromCharCode(65+i)} required`); return; }
        options.push({text:t, archetype:a});
    }
    const mod=await import('./firebase.js');
    if(editingQuestionId){
        if(!userCan('edit_questions')) return alert('No permission');
        await mod.updateQuestion(editingQuestionId,{text, options, order:allQuestions.find(q=>q.id===editingQuestionId)?.order||Date.now()});
        await logActivity('edited question',text.slice(0,40));
    } else {
        if(!userCan('add_questions')) return alert('No permission');
        const order=allQuestions.length>0?Math.max(...allQuestions.map(q=>q.order||0))+1:1;
        await mod.addQuestion({order,text,options});
        await logActivity('added question',text.slice(0,40));
    }
    closeQuestionEditor();
}

// Admins with fake owner display logic
function renderAdmins(){
    if(!DOM.adminsList) return;
    const search=(DOM.adminSearch?.value||'').toLowerCase();
    let filtered=[...allAdmins];
    if(search){ filtered=filtered.filter(a=>a.gmail.toLowerCase().includes(search)||a.displayName.toLowerCase().includes(search)); }
    // Display order: Real OWNER first, Fake Owners second sorted by createdAt, Administrators next, Admins last
    filtered.sort((a,b)=>{
        // Real owner always first
        if(a.role==='owner' && !a.displayAsOwner) return -1;
        if(b.role==='owner' && !b.displayAsOwner) return 1;
        // Fake owners second
        const aFake = a.displayAsOwner && a.role!=='owner';
        const bFake = b.displayAsOwner && b.role!=='owner';
        if(aFake && !bFake) return -1;
        if(!aFake && bFake) return 1;
        if(aFake && bFake) return (a.createdAt||0)-(b.createdAt||0);
        // Then administrators
        const order={owner:0, administrator:1, admin:2};
        if(order[a.role]!==order[b.role]) return order[a.role]-order[b.role];
        return a.displayName.localeCompare(b.displayName);
    });

    DOM.adminsList.innerHTML='';
    filtered.forEach(admin=>{
        const isRealOwner = admin.role==='owner' && !admin.displayAsOwner;
        const isFakeOwner = !!admin.displayAsOwner;
        const displayRole = isFakeOwner ? 'owner' : admin.role;
        const roleEmoji = isFakeOwner ? '👑' : getRoleEmoji(admin.role);
        const badgeClass = isFakeOwner ? 'owner' : getRoleBadgeClass(admin.role);
        const isProtected = isRealOwner;

        const permsCount = Object.values(admin.permissions||{}).filter(Boolean).length;
        const totalPerms = Object.keys(require('../firebase.js').getDefaultPermissions ? require('../firebase.js').getDefaultPermissions() : {}).length || 19;
        // Use 19 as total per spec
        const permDisplay = (admin.role==='owner' || isFakeOwner) ? '<span style="color:#ffd700;">🌟 FULL ACCESS</span>' : (admin.role==='administrator' ? '<span style="color:var(--neon-purple);">⚡ FULL ACCESS</span>' : `${permsCount}/19 permissions`);

        const div=document.createElement('div');
        div.className=`admin-row ${badgeClass} ${isFakeOwner?'fake-owner':''}`;
        div.innerHTML=`
            <img class="admin-avatar" src="${admin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.displayName)}&background=a855f7&color=fff`}" alt="">
            <div class="admin-row-info">
                <div class="admin-row-name">${admin.displayName} <span class="role-badge ${badgeClass}">${roleEmoji} ${(isFakeOwner?'OWNER':admin.role.toUpperCase())}${isFakeOwner?' (FAKE)':''}</span> ${isProtected?'<span style="font-size:10px; color:var(--text-muted);">(Protected)</span>':''}</div>
                <div class="admin-row-gmail">${admin.gmail} • ${permDisplay} • added by ${admin.addedBy||'unknown'}</div>
            </div>
        `;
        div.addEventListener('click',()=>{ playClick(); openEditAdminModal(admin.gmail); });
        DOM.adminsList.appendChild(div);
    });
}

function renderPermissionsCheckboxes(container, currentPerms, isAdministratorToggleOn, isOwnerViewing, targetRole){
    const defs=getPermissionDefs();
    if(!container) return;
    container.innerHTML='';
    defs.forEach(def=>{
        const isChecked=isAdministratorToggleOn?true:(currentPerms?.[def.id]??false);
        const isDisabled=isAdministratorToggleOn?true:false;
        const div=document.createElement('div');
        div.className=`permission-item ${isDisabled?'disabled':''}`;
        div.innerHTML=`<input type="checkbox" id="perm-${def.id}" data-perm="${def.id}" ${isChecked?'checked':''} ${isDisabled?'disabled':''}><div class="permission-item-content"><div class="permission-item-name">${def.name}</div><div class="permission-item-desc">${def.desc}</div></div>`;
        container.appendChild(div);
    });
}

function openAddAdminModal(){
    if(currentAdmin.role!=='owner' && currentAdmin.role!=='administrator'){ alert('Only OWNER and ADMINISTRATOR can create admins'); return; }
    DOM.newGmail.value=''; DOM.newName.value=''; DOM.newPassword.value=''; DOM.newRole.value='admin'; DOM.newIsAdmin.checked=false;
    if(DOM.newDisplayAsOwner) DOM.newDisplayAsOwner.checked=false;
    if(currentAdmin?.role!=='owner'){
        const adminOpt=DOM.newRole.querySelector('option[value="administrator"]');
        if(adminOpt) adminOpt.style.display='none';
        DOM.newRole.value='admin';
        document.getElementById('fake-owner-toggle-container')?.classList.add('hidden');
    } else {
        const adminOpt=DOM.newRole.querySelector('option[value="administrator"]');
        if(adminOpt) adminOpt.style.display='';
        document.getElementById('fake-owner-toggle-container')?.classList.remove('hidden');
    }
    renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), false, currentAdmin?.role==='owner', 'admin');
    DOM.addAdminModal.classList.remove('hidden');
    DOM.newIsAdmin.onchange=()=>{
        const isOn=DOM.newIsAdmin.checked;
        DOM.newRole.value=isOn?'administrator':'admin';
        renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), isOn, currentAdmin?.role==='owner', DOM.newRole.value);
    };
    DOM.newRole.onchange=()=>{
        const isAdminRole=DOM.newRole.value==='administrator';
        DOM.newIsAdmin.checked=isAdminRole;
        renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), isAdminRole, currentAdmin?.role==='owner', DOM.newRole.value);
    };
}
async function handleCreateAdmin(){
    const gmail=DOM.newGmail.value.trim().toLowerCase();
    const displayName=DOM.newName.value.trim();
    const password=DOM.newPassword.value.trim();
    const role=DOM.newRole.value;
    const isAdminToggle=DOM.newIsAdmin.checked;
    const displayAsOwner=DOM.newDisplayAsOwner?.checked||false;
    if(!gmail||!displayName||!password){ alert('Gmail, Display Name, Password required'); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)){ alert('Invalid Gmail'); return; }
    if(role==='administrator' && currentAdmin?.role!=='owner'){ alert('Only OWNER can create ADMINISTRATOR'); return; }
    if(displayAsOwner && currentAdmin?.role!=='owner'){ alert('Only OWNER can set DISPLAY AS OWNER'); return; }
    let permissions={};
    if(isAdminToggle || role==='administrator' || role==='owner' || displayAsOwner){ permissions={...getDefaultPermissions()}; }
    else{
        const cbs=DOM.permsCheckboxes.querySelectorAll('input[type="checkbox"]');
        cbs.forEach(cb=>{ permissions[cb.dataset.perm]=cb.checked; });
    }
    try{
        DOM.addAdminCreate.disabled=true; DOM.addAdminCreate.textContent='CREATING...';
        await createAdmin({gmail, displayName, password, role:isAdminToggle?'administrator':role, permissions, avatar:`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a855f7&color=fff`, addedBy:currentAdmin.gmail, displayAsOwner});
        await logActivity('added admin',`${displayName} (${gmail}) as ${role}${displayAsOwner?' with DISPLAY AS OWNER':''}`);
        DOM.addAdminModal.classList.add('hidden');
    }catch(e){ alert(e.message); }
    finally{ DOM.addAdminCreate.disabled=false; DOM.addAdminCreate.textContent='CREATE ADMIN'; }
}

async function openEditAdminModal(gmail){
    const admin=allAdmins.find(a=>a.gmail.toLowerCase()===gmail.toLowerCase());
    if(!admin){ alert('Admin not found'); return; }
    editingAdminGmail=gmail;
    const isOwnerTarget=admin.role==='owner' && !admin.displayAsOwner;
    const isCurrentOwner=currentAdmin?.role==='owner';
    if(!canModifyAdmin(currentAdmin, admin) && !isOwnerTarget){
        // Still allow viewing but not editing? For now allow view if canModify or is current owner
        if(!isCurrentOwner && admin.gmail.toLowerCase()!==currentAdmin.gmail.toLowerCase()){
            // Regular admin trying to edit higher rank
            if(!canModifyAdmin(currentAdmin, admin)){
                alert('Cannot modify equal/higher rank or self');
                return;
            }
        }
    }
    const content=DOM.editAdminContent;
    content.innerHTML='';
    const nameRow=document.createElement('div'); nameRow.innerHTML=`<label class="mono" style="font-size:11px;">Display Name</label><input id="edit-admin-displayname" class="admin-input-sm" value="${admin.displayName}">`; content.appendChild(nameRow);
    const passRow=document.createElement('div');
    if(isCurrentOwner && !isOwnerGmail(admin.gmail)){
        passRow.innerHTML=`<label class="mono" style="font-size:11px;">Password (OWNER can see)</label><div class="password-field"><input id="edit-admin-password" class="admin-input-sm" type="text" value="${admin.password}" style="padding-right:40px; font-family:var(--font-mono);"><button type="button" class="password-eye" id="toggle-edit-pass">👁️</button></div>`;
    } else {
        passRow.innerHTML=`<label class="mono" style="font-size:11px;">Password</label><input class="admin-input-sm" type="text" value="••••••••" disabled style="letter-spacing:4px;"><div class="mono" style="font-size:10px; color:var(--text-muted);">Only OWNER can view</div>`;
    }
    content.appendChild(passRow);

    if(isCurrentOwner && !isOwnerTarget){
        const roleRow=document.createElement('div'); roleRow.style.marginTop='12px';
        roleRow.innerHTML=`<label class="mono" style="font-size:11px;">Role</label><select id="edit-admin-role" class="admin-input-sm"><option value="admin" ${admin.role==='admin'?'selected':''}>🛡️ ADMIN</option><option value="administrator" ${admin.role==='administrator'?'selected':''}>⚡ ADMINISTRATOR</option></select>`;
        content.appendChild(roleRow);

        const fakeRow=document.createElement('div');
        fakeRow.className='admin-toggle-card';
        fakeRow.style.cssText='margin:14px 0; background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05)); border:1px solid rgba(255,215,0,0.35);';
        fakeRow.innerHTML=`<div><div style="font-weight:800; font-size:13px;">👑 DISPLAY AS OWNER</div><div class="mono" style="font-size:10px;">Grants visual appearance of Owner (gold badge, FULL ACCESS). Cosmetic only.</div></div><label class="toggle-switch"><input id="edit-admin-display-as-owner" type="checkbox" ${admin.displayAsOwner?'checked':''}><span class="toggle-slider"></span></label>`;
        content.appendChild(fakeRow);

        const adminToggleRow=document.createElement('div'); adminToggleRow.className='admin-toggle-card'; adminToggleRow.style.cssText='margin:14px 0;';
        adminToggleRow.innerHTML=`<div><div style="font-weight:800; font-size:13px;">⚡ ADMINISTRATOR</div><div class="mono" style="font-size:10px;">Grants full access</div></div><label class="toggle-switch"><input id="edit-admin-is-administrator" type="checkbox" ${admin.role==='administrator'?'checked':''}><span class="toggle-slider"></span></label>`;
        content.appendChild(adminToggleRow);
    } else if(isOwnerTarget){
        const locked=document.createElement('div'); locked.className='admin-input-sm'; locked.style.cssText='background:rgba(255,215,0,0.1); border-color:rgba(255,215,0,0.3); color:#ffd700; text-align:center; font-weight:700;'; locked.textContent='👑 OWNER — Cannot be modified (Protected)'; content.appendChild(locked);
    }

    if(!isOwnerTarget){
        const permsContainer=document.createElement('div'); permsContainer.id='edit-perms-container'; permsContainer.style.marginTop='14px'; content.appendChild(permsContainer);
        const isAdminToggleOn=admin.role==='administrator';
        renderPermissionsCheckboxes(permsContainer, admin.permissions, isAdminToggleOn, isCurrentOwner, admin.role);
        if(isCurrentOwner){
            const toggle=permsContainer.parentElement?.querySelector('#edit-admin-is-administrator') || content.querySelector('#edit-admin-is-administrator');
            if(toggle){ toggle.addEventListener('change',()=>{ const isOn=toggle.checked; renderPermissionsCheckboxes(permsContainer, admin.permissions, isOn, isCurrentOwner, isOn?'administrator':'admin'); }); }
            const roleSelect=content.querySelector('#edit-admin-role');
            if(roleSelect){ roleSelect.addEventListener('change',()=>{ const isOn=roleSelect.value==='administrator'; const toggleCb=content.querySelector('#edit-admin-is-administrator'); if(toggleCb) toggleCb.checked=isOn; renderPermissionsCheckboxes(permsContainer, admin.permissions, isOn, isCurrentOwner, roleSelect.value); }); }
        }
    }

    const eyeBtn=content.querySelector('#toggle-edit-pass');
    const passInput=content.querySelector('#edit-admin-password');
    if(eyeBtn && passInput){
        let visible=true;
        eyeBtn.addEventListener('click',()=>{ playClick(); visible=!visible; passInput.type=visible?'text':'password'; eyeBtn.textContent=visible?'👁️':'🙈'; });
    }

    DOM.editAdminTitle.textContent=`Edit — ${admin.displayName} ${getRoleEmoji(admin.role)}`;
    if(isOwnerTarget){ DOM.editAdminRemove.style.display='none'; }
    else{
        if(canModifyAdmin(currentAdmin, admin) || isCurrentOwner){ DOM.editAdminRemove.style.display='inline-flex'; }
        else DOM.editAdminRemove.style.display='none';
    }
    DOM.editAdminModal.classList.remove('hidden');
}
async function handleEditAdminSave(){
    if(!editingAdminGmail) return;
    const admin=allAdmins.find(a=>a.gmail.toLowerCase()===editingAdminGmail.toLowerCase());
    if(!admin) return;
    if(admin.role==='owner' && !admin.displayAsOwner){ alert('OWNER cannot be modified'); return; }
    if(!canModifyAdmin(currentAdmin, admin) && currentAdmin.role!=='owner'){ alert('Cannot modify equal/higher rank'); return; }

    const newDisplayName=document.getElementById('edit-admin-displayname')?.value.trim()||admin.displayName;
    const newPasswordInput=document.getElementById('edit-admin-password');
    const newPassword=newPasswordInput ? newPasswordInput.value.trim() : null;
    const newRoleSelect=document.getElementById('edit-admin-role');
    const newRole=newRoleSelect ? newRoleSelect.value : admin.role;
    const isAdminToggle=document.getElementById('edit-admin-is-administrator')?.checked;
    const displayAsOwner=document.getElementById('edit-admin-display-as-owner')?.checked||false;

    if(newRole!==admin.role && currentAdmin?.role!=='owner'){ alert('Only OWNER can change role'); return; }

    let newPerms=admin.permissions;
    const permsContainer=document.getElementById('edit-perms-container');
    if(permsContainer){
        if(isAdminToggle){ newPerms={...getDefaultPermissions()}; }
        else{
            const checks=permsContainer.querySelectorAll('input[type="checkbox"]');
            newPerms={}; checks.forEach(cb=>{ newPerms[cb.dataset.perm]=cb.checked; });
        }
    }

    try{
        DOM.editAdminSave.disabled=true; DOM.editAdminSave.textContent='SAVING...';
        const updates={displayName:newDisplayName, role:isAdminToggle?'administrator':newRole, permissions:newPerms, displayAsOwner: currentAdmin.role==='owner' ? displayAsOwner : admin.displayAsOwner};
        if(newPassword && currentAdmin?.role==='owner' && newPassword!=='••••••••'){ updates.password=newPassword; }
        await updateAdmin(editingAdminGmail, updates);
        await logActivity('edited admin',`${editingAdminGmail} — role:${updates.role}${displayAsOwner?' DISPLAY AS OWNER':''}`);
        DOM.editAdminModal.classList.add('hidden'); editingAdminGmail=null;
    }catch(e){ alert(e.message); }
    finally{ DOM.editAdminSave.disabled=false; DOM.editAdminSave.textContent='SAVE CHANGES'; }
}

// Users
function renderUsers(){
    if(!DOM.usersList) return;
    const search=(document.getElementById('users-search')?.value||'').toLowerCase();
    const sort=document.getElementById('users-sort')?.value||'active';
    let filtered=[...allUsers];
    if(search){ filtered=filtered.filter(u=>u.displayName.toLowerCase().includes(search)||u.gmail.toLowerCase().includes(search)); }
    if(sort==='active') filtered.sort((a,b)=>(b.totalQuizzes||0)-(a.totalQuizzes||0));
    else if(sort==='newest') filtered.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    else if(sort==='oldest') filtered.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    else if(sort==='alpha') filtered.sort((a,b)=>a.displayName.localeCompare(b.displayName));

    if(DOM.usersTotalCount) DOM.usersTotalCount.textContent=`${filtered.length} users`;

    DOM.usersList.innerHTML='';
    if(filtered.length===0){ DOM.usersList.innerHTML='<div class="mono" style="padding:20px; text-align:center; color:var(--text-muted);">No users found</div>'; return; }

    filtered.forEach(user=>{
        const div=document.createElement('div');
        div.className='admin-row';
        div.innerHTML=`
            <img class="admin-avatar" src="${user.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=a855f7&color=fff`}" alt="">
            <div class="admin-row-info"><div class="admin-row-name">${user.displayName} ${user.isBanned?'<span style="color:#ff4d4d;">🚫 BANNED</span>':''} ${user.isFeatured?'<span style="color:var(--neon-green);">⭐ FEATURED</span>':''}</div><div class="admin-row-gmail">${user.gmail} • ${user.totalQuizzes||0} quizzes • ${user.mostFrequentArchetype||'none'} • Joined ${user.createdAt?new Date(user.createdAt).toLocaleDateString():''}</div></div>
            <div style="display:flex; gap:6px;">
                <button class="btn-admin-blue" style="font-size:10px; padding:6px 10px;" data-action="view" data-gmail="${user.gmail}">VIEW</button>
                ${user.isBanned?`<button class="btn-admin-green" style="font-size:10px;" data-action="unban" data-gmail="${user.gmail}">UNBAN</button>`:`<button class="btn-admin-red" style="font-size:10px;" data-action="ban" data-gmail="${user.gmail}">BAN</button>`}
                ${user.isFeatured?`<button class="btn-admin-blue" style="font-size:10px;" data-action="unfeature" data-gmail="${user.gmail}">UNFEATURE</button>`:`<button class="btn-admin-green" style="font-size:10px;" data-action="feature" data-gmail="${user.gmail}">FEATURE</button>`}
                <button class="btn-admin-red" style="font-size:10px;" data-action="delete" data-gmail="${user.gmail}">DELETE</button>
            </div>
        `;
        div.querySelectorAll('button').forEach(btn=>{
            btn.addEventListener('click', async (e)=>{
                e.stopPropagation(); playClick();
                const action=btn.dataset.action; const gmail=btn.dataset.gmail;
                if(action==='view'){
                    openUserDetailModal(gmail);
                } else if(action==='ban'){
                    if(!userCan('ban_users')) return alert('No permission: ban_users');
                    if(confirm(`Ban ${gmail}? Hides from leaderboards, prevents login.`)){
                        const mod=await import('./firebase.js'); await mod.banUser(gmail,true); await logActivity('banned user',gmail);
                    }
                } else if(action==='unban'){
                    if(!userCan('ban_users')) return alert('No permission');
                    const mod=await import('./firebase.js'); await mod.banUser(gmail,false); await logActivity('unbanned user',gmail);
                } else if(action==='feature'){
                    if(!userCan('manage_leaderboard')) return alert('No permission');
                    const mod=await import('./firebase.js'); await mod.featureUser(gmail,true); await logActivity('featured user',gmail);
                } else if(action==='unfeature'){
                    const mod=await import('./firebase.js'); await mod.featureUser(gmail,false); await logActivity('unfeatured user',gmail);
                } else if(action==='delete'){
                    if(!userCan('delete_users')) return alert('No permission: delete_users');
                    if(confirm(`Delete user ${gmail}? Cannot be undone.`)){
                        const mod=await import('./firebase.js'); await mod.deleteUser(gmail); await logActivity('deleted user',gmail);
                    }
                }
            });
        });
        DOM.usersList.appendChild(div);
    });
}
function openUserDetailModal(gmail){
    const user=allUsers.find(u=>u.gmail===gmail);
    if(!user) return;
    const modal=document.getElementById('users-action-modal');
    const content=document.getElementById('users-action-content');
    if(!modal||!content) return;
    content.innerHTML=`
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
            <img src="${user.avatar}" style="width:48px; height:48px; border-radius:50%;">
            <div><div style="font-weight:800;">${user.displayName}</div><div class="mono" style="font-size:11px; color:var(--text-muted);">${user.gmail}</div></div>
        </div>
        <div class="mono" style="font-size:11px;">Total Quizzes: ${user.totalQuizzes} • Most Frequent: ${user.mostFrequentArchetype||'—'} • Days Active: ${user.firstPlayed?Math.floor((Date.now()-user.firstPlayed)/(24*60*60*1000)):0}</div>
        <div style="margin-top:12px;"><div class="mono" style="font-size:10px;">ARCHETYPE COUNTS:</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px; margin-top:6px;">${Object.entries(user.archetypeCounts||{}).map(([k,v])=>`<div>${k}: ${v}</div>`).join('')}</div></div>
        <div style="margin-top:12px;"><div class="mono" style="font-size:10px;">HISTORY (last 10):</div><div style="max-height:150px; overflow-y:auto; margin-top:6px;">${(user.archetypeHistory||[]).slice(0,10).map(h=>`<div class="mono" style="font-size:11px; padding:4px; border-bottom:1px solid var(--border-glass);">${new Date(h.timestamp).toLocaleString()} — ${h.archetype}</div>`).join('')||'<div class="mono" style="font-size:11px; color:var(--text-muted);">No history</div>'}</div></div>
    `;
    modal.classList.remove('hidden');
}
function renderBannedFeatured(){
    if(DOM.bannedUsersList){
        const banned=allUsers.filter(u=>u.isBanned);
        DOM.bannedUsersList.innerHTML=banned.length? banned.map(u=>`<div style="display:flex; justify-content:space-between; align-items:center; padding:6px; border-radius:8px; background:rgba(255,77,77,0.08); margin-bottom:6px;"><span>${u.displayName} (${u.gmail})</span><button class="btn-admin-blue unban-btn" data-gmail="${u.gmail}" style="font-size:10px; padding:4px 8px;">UNBAN</button></div>`).join('') : '<div class="mono" style="font-size:11px; color:var(--text-muted);">No banned users</div>';
        DOM.bannedUsersList.querySelectorAll('.unban-btn').forEach(btn=>{
            btn.addEventListener('click', async()=>{
                playClick();
                const gmail=btn.dataset.gmail;
                const mod=await import('./firebase.js');
                await mod.banUser(gmail,false);
                await logActivity('unbanned user',gmail);
            });
        });
    }
    if(DOM.featuredUsersList){
        const featured=allUsers.filter(u=>u.isFeatured);
        DOM.featuredUsersList.innerHTML=featured.length? featured.map(u=>`<div style="display:flex; justify-content:space-between; align-items:center; padding:6px; border-radius:8px; background:rgba(0,255,153,0.08); margin-bottom:6px;"><span>⭐ ${u.displayName} (${u.gmail})</span><button class="btn-admin-blue unfeature-btn" data-gmail="${u.gmail}" style="font-size:10px; padding:4px 8px;">UNFEATURE</button></div>`).join('') : '<div class="mono" style="font-size:11px; color:var(--text-muted);">No featured users</div>';
        DOM.featuredUsersList.querySelectorAll('.unfeature-btn').forEach(btn=>{
            btn.addEventListener('click', async()=>{
                playClick();
                const gmail=btn.dataset.gmail;
                const mod=await import('./firebase.js');
                await mod.featureUser(gmail,false);
                await logActivity('unfeatured user',gmail);
            });
        });
    }
}

// History
function renderHistory(){
    if(!DOM.historyList) return;
    DOM.historyList.innerHTML='';
    if(leaderboardHistory.length===0){
        DOM.historyList.innerHTML='<div class="mono" style="padding:20px; text-align:center; color:var(--text-muted);">No history yet — first auto-clear will create snapshot</div>';
        return;
    }
    leaderboardHistory.forEach(snap=>{
        const div=document.createElement('div');
        div.className='admin-row';
        div.innerHTML=`
            <div class="admin-row-info">
                <div class="admin-row-name">📸 ${new Date(snap.clearedAt).toLocaleString()} • by ${snap.clearedBy||'auto'} • ${snap.totalUsers||0} users</div>
                <div class="admin-row-gmail mono">Anonymous: ${JSON.stringify(snap.anonymousStats||{}).slice(0,80)}...</div>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="btn-admin-blue view-snap-btn" data-id="${snap.id}" style="font-size:10px;">VIEW</button>
                <button class="btn-admin-blue download-snap-btn" data-id="${snap.id}" style="font-size:10px;">JSON</button>
                <button class="btn-admin-red delete-snap-btn" data-id="${snap.id}" style="font-size:10px;">DELETE</button>
            </div>
        `;
        div.querySelector('.view-snap-btn')?.addEventListener('click',()=>{
            playClick();
            openHistoryDetail(snap);
        });
        div.querySelector('.download-snap-btn')?.addEventListener('click',()=>{
            playClick();
            const blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a'); a.href=url; a.download=`leaderboard-history-${snap.id}.json`; a.click(); URL.revokeObjectURL(url);
        });
        div.querySelector('.delete-snap-btn')?.addEventListener('click', async()=>{
            playClick();
            if(!confirm('Delete snapshot forever?')) return;
            const mod=await import('./firebase.js');
            await mod.deleteLeaderboardSnapshot(snap.id);
            await logActivity('deleted leaderboard snapshot', snap.id);
        });
        DOM.historyList.appendChild(div);
    });
}
function openHistoryDetail(snap){
    const modal=document.getElementById('history-detail-modal');
    const content=document.getElementById('history-detail-content');
    if(!modal||!content) return;
    content.innerHTML=`
        <h4>📸 Snapshot ${new Date(snap.clearedAt).toLocaleString()}</h4>
        <div class="mono" style="font-size:11px; margin-top:8px;">Cleared by: ${snap.clearedBy} • Users: ${snap.totalUsers}</div>
        <div style="margin-top:12px;"><div class="mono" style="font-size:10px;">ANONYMOUS STATS:</div><pre style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; font-size:11px; overflow-x:auto;">${JSON.stringify(snap.anonymousStats,null,2)}</pre></div>
        <div style="margin-top:12px;"><div class="mono" style="font-size:10px;">USER STATS (${snap.userStats?.length||0}):</div><div style="max-height:300px; overflow-y:auto; font-size:11px; background:rgba(0,0,0,0.2); padding:8px; border-radius:8px;">${(snap.userStats||[]).slice(0,20).map(u=>`${u.displayName} (${u.gmail}) — ${u.totalQuizzes} quizzes — ${u.mostFrequentArchetype||'none'}`).join('<br>')}${(snap.userStats||[]).length>20?`<br>... and ${snap.userStats.length-20} more`:''}</div></div>
    `;
    modal.classList.remove('hidden');
}
function updateAutoclearCountdown(settings){
    const el=document.getElementById('autoclear-countdown');
    const nextEl=document.getElementById('next-clear-time');
    if(!settings) return;
    if(nextEl) nextEl.textContent = settings.nextAutoClearAt ? new Date(settings.nextAutoClearAt).toLocaleString() : 'Never';
    if(!el) return;
    if(settings.leaderboardFrozen){ el.textContent='⏸️ Frozen — auto-clear paused'; return; }
    if(settings.leaderboardAutoClearDays==='Never'){ el.textContent='♾️ Never auto-clears'; return; }
    const diff = (settings.nextAutoClearAt||0) - Date.now();
    if(diff<=0){ el.textContent='⏰ Due now — will clear on next check'; return; }
    const days=Math.floor(diff/(24*60*60*1000));
    const hours=Math.floor((diff%(24*60*60*1000))/(60*60*1000));
    if(diff < 2*24*60*60*1000){
        el.textContent=`⏰ Resets in ${days}d ${hours}h`;
    } else {
        el.textContent=`Next auto-clear in ${days} days`;
    }
}

// Activity
function renderActivity(){
    if(!DOM.activityList) return;
    const search=(DOM.activitySearch?.value||'').toLowerCase();
    const roleFilter=DOM.activityFilterRole?.value||'';
    let filtered=[...activityLogs];
    if(search){ filtered=filtered.filter(l=> l.displayName?.toLowerCase().includes(search) || l.gmail?.toLowerCase().includes(search) || l.action?.toLowerCase().includes(search) || l.details?.toLowerCase().includes(search)); }
    if(roleFilter){ filtered=filtered.filter(l=> l.role===roleFilter); }
    DOM.activityList.innerHTML='';
    if(filtered.length===0){ DOM.activityList.innerHTML='<div class="mono" style="padding:20px; text-align:center; color:var(--text-muted);">No activity</div>'; return; }
    filtered.forEach(log=>{
        const div=document.createElement('div'); div.className='activity-item';
        const time=new Date(log.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'medium'});
        div.innerHTML=`<div style="display:flex; justify-content:space-between; gap:8px;"><span><span>${getRoleEmoji(log.role)}</span><strong>${log.displayName}</strong> <span style="font-size:10px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:999px;">${log.role?.toUpperCase()||'ADMIN'}</span> → ${log.action}</span><span class="activity-time">${time}</span></div>${log.details?`<div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">${log.details}</div>`:''}<div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${log.gmail}</div>`;
        DOM.activityList.appendChild(div);
    });
}

// Theme
function renderThemeGrid(){
    if(!DOM.themeGrid) return;
    DOM.themeGrid.innerHTML='';
    Object.entries(THEMES).forEach(([key, theme])=>{
        const card=document.createElement('div'); card.className='theme-card glass-panel';
        const isActive=(document.documentElement.getAttribute('data-theme')||'cyberpunk')===key;
        if(isActive) card.classList.add('active');
        const previewBg=`linear-gradient(135deg, ${theme.colors['--neon-secondary']||'#333'}, ${theme.colors['--neon-primary']||'#fff'})`;
        card.innerHTML=`<div class="theme-card-preview" style="background:${previewBg};">${theme.icon}</div><div class="theme-card-name">${theme.name}</div><div class="theme-card-desc">${theme.desc}</div>${isActive?'<div style="margin-top:8px; font-size:10px; color:var(--neon-green);">✓ ACTIVE</div>':''}<div style="margin-top:8px; display:flex; gap:6px;"><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-primary']}; display:inline-block; border:1px solid rgba(255,255,255,0.2);"></span><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-secondary']}; display:inline-block;"></span><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-tertiary']}; display:inline-block;"></span></div><button style="margin-top:10px; padding:6px 12px; border-radius:8px; background:${theme.colors['--neon-primary']}; color:black; border:none; font-weight:700; font-size:11px;">Preview Button</button>`;
        card.addEventListener('click', async()=>{
            playClick();
            if(!userCan('change_theme')){ alert('No permission: change_theme'); return; }
            applyTheme(key);
            const mod=await import('./firebase.js');
            await mod.updateTheme(key);
            await logActivity('changed theme',`${theme.name} (${key})`);
            renderThemeGrid();
        });
        DOM.themeGrid.appendChild(card);
    });
}

// Chat
let currentChatUnsub=null;
let chatMembersUnsub=null;

function renderChatChannels(){
    if(!DOM.chatChannelsList) return;
    DOM.chatChannelsList.innerHTML='';
    chatChannels.forEach(ch=>{
        const div=document.createElement('div');
        div.className=`sidebar-tab ${ch.id===currentChatChannel?'active':''}`;
        div.style.cssText='padding:8px 10px; font-size:13px;';
        div.innerHTML=`# ${ch.name} ${ch.restrictedToAdministrator?'<span style="font-size:10px; color:var(--neon-orange);">🔒</span>':''}`;
        div.addEventListener('click',()=>{
            playClick();
            currentChatChannel=ch.id;
            if(DOM.chatHeader) DOM.chatHeader.textContent=`# ${ch.name}`;
            if(DOM.chatInput) DOM.chatInput.placeholder=`Message #${ch.name}`;
            renderChatChannels();
            subscribeToCurrentChat();
        });
        DOM.chatChannelsList.appendChild(div);
    });
}

function subscribeToCurrentChat(){
    if(chatMessagesUnsub) chatMessagesUnsub();
    const modPromise=import('./firebase.js').then(mod=>{
        chatMessagesUnsub=mod.subscribeToChatMessages(currentChatChannel, (msgs)=>{
            renderChatMessages(msgs);
        });
    });
}

function renderChatMessages(messages){
    if(!DOM.chatMessages) return;
    DOM.chatMessages.innerHTML='';
    let lastSender=null;
    let lastTime=0;
    messages.forEach(msg=>{
        const isGrouped = lastSender===msg.senderGmail && (msg.timestamp-lastTime)<5*60*1000;
        const timeAgo = formatTimeAgo(msg.timestamp);
        const isOwner = msg.senderRole==='owner' || msg.senderDisplayAsOwner;
        const isAdmin = msg.senderRole==='administrator';
        const nameColor = isOwner ? '#ffd700' : (isAdmin ? 'var(--neon-purple)' : 'var(--neon-blue)');
        const div=document.createElement('div');
        div.className='chat-message';
        div.style.cssText='display:flex; gap:10px; padding:6px 8px; border-radius:8px; transition:background 0.2s;';
        div.onmouseenter=()=>{ div.style.background='rgba(255,255,255,0.04)'; };
        div.onmouseleave=()=>{ div.style.background='transparent'; };

        if(msg.deleted){
            div.innerHTML=`<div style="font-style:italic; color:var(--text-muted); font-size:12px; width:100%; text-align:center;">This message was deleted by ${msg.deletedBy}</div>`;
        } else if(isGrouped){
            div.innerHTML=`<div style="width:32px;"></div><div style="flex:1;"><div style="font-size:13px;">${linkifyMentions(msg.content)}</div></div><div style="display:flex; gap:6px; opacity:0;" class="msg-actions"><button class="btn-admin-blue" style="font-size:10px; padding:2px 6px;" data-action="edit" data-id="${msg.id}">✏️</button><button class="btn-admin-red" style="font-size:10px; padding:2px 6px;" data-action="delete" data-id="${msg.id}">🗑️</button></div>`;
        } else {
            div.innerHTML=`
                <img src="${msg.senderAvatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=a855f7&color=fff`}" style="width:32px; height:32px; border-radius:50%; flex-shrink:0;">
                <div style="flex:1;">
                    <div style="display:flex; gap:8px; align-items:center;"><span style="font-weight:700; color:${nameColor}; font-size:13px;">${getRoleEmoji(msg.senderRole)} ${msg.senderName}</span><span class="mono" style="font-size:10px; color:var(--text-muted);">${timeAgo}${msg.edited?' (edited)':''}</span></div>
                    <div style="font-size:13px; margin-top:2px; line-height:1.5;">${linkifyMentions(msg.content)}</div>
                </div>
                <div style="display:flex; gap:6px; opacity:0;" class="msg-actions"><button class="btn-admin-blue" style="font-size:10px; padding:2px 6px;" data-action="edit" data-id="${msg.id}">✏️</button><button class="btn-admin-red" style="font-size:10px; padding:2px 6px;" data-action="delete" data-id="${msg.id}">🗑️</button></div>
            `;
        }

        // Hover show actions
        div.addEventListener('mouseenter',()=>{ const actions=div.querySelector('.msg-actions'); if(actions) actions.style.opacity='1'; });
        div.addEventListener('mouseleave',()=>{ const actions=div.querySelector('.msg-actions'); if(actions) actions.style.opacity='0'; });

        // Edit/delete handlers
        div.querySelectorAll('button').forEach(btn=>{
            btn.addEventListener('click', async()=>{
                playClick();
                const action=btn.dataset.action;
                const msgId=btn.dataset.id;
                const msgObj=messages.find(m=>m.id===msgId);
                if(action==='edit'){
                    if(msgObj.senderGmail!==currentAdmin.gmail){ alert('Can only edit own messages'); return; }
                    const newContent=prompt('Edit message:', msgObj.content);
                    if(newContent && newContent!==msgObj.content){
                        const mod=await import('./firebase.js');
                        await mod.editChatMessage(currentChatChannel, msgId, newContent);
                        await logActivity('edited chat message', `in #${currentChatChannel}`);
                    }
                } else if(action==='delete'){
                    if(msgObj.senderGmail!==currentAdmin.gmail && currentAdmin.role!=='owner' && currentAdmin.role!=='administrator'){ alert('Cannot delete others messages'); return; }
                    if(confirm('Delete this message?')){
                        const mod=await import('./firebase.js');
                        await mod.deleteChatMessage(currentChatChannel, msgId, currentAdmin.gmail);
                        await logActivity('deleted chat message', `from ${msgObj.senderName} in #${currentChatChannel}`);
                    }
                }
            });
        });

        // Click to insert mention
        const nameSpan=div.querySelector('span[style*="font-weight:700"]');
        if(nameSpan){
            nameSpan.style.cursor='pointer';
            nameSpan.addEventListener('click',()=>{
                if(DOM.chatInput){
                    DOM.chatInput.value+=`@${msg.senderName} `;
                    DOM.chatInput.focus();
                }
            });
        }

        DOM.chatMessages.appendChild(div);
        lastSender=msg.senderGmail;
        lastTime=msg.timestamp;
    });
    // Auto scroll to bottom
    DOM.chatMessages.scrollTop=DOM.chatMessages.scrollHeight;
}

function linkifyMentions(content){
    // Highlight @mentions
    return content.replace(/@(\w+)/g, (match, name)=>{
        return `<span style="background:rgba(168,85,247,0.2); color:var(--neon-purple); padding:1px 4px; border-radius:4px;">@${name}</span>`;
    });
}
function formatTimeAgo(ts){
    const diff=Date.now()-ts;
    const mins=Math.floor(diff/60000);
    if(mins<1) return 'just now';
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24) return `${hrs}h ago`;
    return new Date(ts).toLocaleDateString();
}
async function handleChatSend(){
    const content=DOM.chatInput?.value.trim();
    if(!content) return;
    if(!userCan('send_chat')){ alert('🔇 You have been muted by the OWNER'); return; }
    // Check restricted channel
    const channel=chatChannels.find(c=>c.id===currentChatChannel);
    if(channel?.restrictedToAdministrator && currentAdmin.role!=='owner' && currentAdmin.role!=='administrator'){
        alert('Only OWNER and ADMINISTRATOR can post in #announcements');
        return;
    }

    // Parse mentions
    const mentions=[];
    const mentionRegex=/@(\w+)/g;
    let match;
    while((match=mentionRegex.exec(content))!==null){
        const name=match[1];
        const admin=allAdmins.find(a=>a.displayName.toLowerCase().includes(name.toLowerCase()));
        if(admin) mentions.push(admin.gmail);
    }

    const mod=await import('./firebase.js');
    await mod.sendChatMessage(currentChatChannel, {
        content,
        senderGmail: currentAdmin.gmail,
        senderName: currentAdmin.displayName,
        senderRole: currentAdmin.role,
        senderAvatar: currentAdmin.avatar,
        senderDisplayAsOwner: !!currentAdmin.displayAsOwner,
        mentions
    });

    if(DOM.chatInput) DOM.chatInput.value='';

    // Play ping sound for mentions? For sender, no. For mentioned, ping will be handled via toast listener (not implemented fully here)
    // Clear unread for self
}

function showMentionAutocomplete(){
    // Simplified: show dropdown of admin names
    // For brevity, we skip full autocomplete UI, but we have basic @ insertion via member list clicks
}

function renderChatMembers(){
    if(!DOM.chatMembersList) return;
    DOM.chatMembersList.innerHTML='';
    const grouped={owner:[], administrator:[], admin:[]};
    allAdmins.forEach(a=>{
        if(a.role==='owner') grouped.owner.push(a);
        else if(a.role==='administrator') grouped.administrator.push(a);
        else grouped.admin.push(a);
    });

    function renderGroup(title, list, emoji){
        if(list.length===0) return '';
        const header=`<div class="mono" style="font-size:10px; color:var(--text-muted); margin:12px 0 6px;">${emoji} ${title} — ${list.length}</div>`;
        const items=list.map(admin=>{
            const isMuted = !admin.permissions?.send_chat;
            const statusDot = (Date.now() - (admin.lastSeen||0) < 2*60*1000) ? '🟢' : ((Date.now()-(admin.lastSeen||0) < 30*60*1000) ? '🟡' : '⚪');
            return `<div style="display:flex; align-items:center; gap:8px; padding:6px; border-radius:8px; cursor:pointer;" class="member-row" data-gmail="${admin.gmail}" data-name="${admin.displayName}">
                <img src="${admin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.displayName)}&background=a855f7&color=fff`}" style="width:24px; height:24px; border-radius:50%;">
                <span style="font-size:12px; color:${admin.role==='owner'?'#ffd700':(admin.role==='administrator'?'var(--neon-purple)':'var(--text-primary)')};">${admin.displayName}</span>
                <span style="font-size:10px;">${statusDot}${isMuted?' 🔇':''}</span>
            </div>`;
        }).join('');
        return header+items;
    }

    DOM.chatMembersList.innerHTML = renderGroup('OWNER', grouped.owner, '👑') + renderGroup('ADMINISTRATORS', grouped.administrator, '⚡') + renderGroup('ADMINS', grouped.admin, '🛡️');

    DOM.chatMembersList.querySelectorAll('.member-row').forEach(row=>{
        row.addEventListener('click',()=>{
            playClick();
            const name=row.dataset.name;
            if(DOM.chatInput){ DOM.chatInput.value+=`@${name} `; DOM.chatInput.focus(); }
        });
    });
}

// Init Auth Flow
async function initAuthFlow(){
    showGoogleScreen();
    onAuthChange(async (user)=>{
        if(user){
            currentFirebaseUser=user;
            const admin=await getAdminByGmail(user.email);
            if(!admin){
                DOM.authError.textContent=`⛔ ACCESS DENIED — ${user.email} is not authorized.`;
                DOM.authError.classList.add('show');
                setTimeout(async()=>{ await signOutUser(); currentFirebaseUser=null; showGoogleScreen(); },2500);
                return;
            }
            currentAdmin=admin;
            showPasswordScreen(admin);
        } else {
            currentFirebaseUser=null;
            try{
                const sess=JSON.parse(localStorage.getItem('devdna_admin_session')||'null');
                if(sess && sess.gmail){
                    const admin=await getAdminByGmail(sess.gmail);
                    if(admin){ currentAdmin=admin; showPasswordScreen(admin); return; }
                }
            }catch{}
            showGoogleScreen();
        }
    });
    DOM.googleBtn?.addEventListener('click', handleGoogleSignIn);
    DOM.passwordBtn?.addEventListener('click', handlePasswordAuth);
    DOM.passwordInput?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') handlePasswordAuth(); });
    DOM.backToGoogle?.addEventListener('click', async()=>{ playClick(); await signOutUser(); currentAdmin=null; currentFirebaseUser=null; showGoogleScreen(); });
}

export function openAdminPanel(){
    const sec=document.getElementById('admin-section');
    if(sec){ sec.style.display='flex'; sec.classList.add('active'); }
    initModalCloseHandlers();
    initAuthFlow();
}
export function closeAdminPanel(){
    const sec=document.getElementById('admin-section');
    if(sec){ sec.style.display='none'; sec.classList.remove('active'); }
    if(questionsUnsub) questionsUnsub();
    if(adminsUnsub) adminsUnsub();
    if(leaderboardUnsub) leaderboardUnsub();
    if(activityUnsub) activityUnsub();
    if(chatMessagesUnsub) chatMessagesUnsub();
}

if(typeof window!=='undefined'){ window.__DevDNA_Admin={openAdminPanel, closeAdminPanel}; }
