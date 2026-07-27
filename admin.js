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
    updateChatPreferences, getChatPreferences,
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
    // Chat clear modals
    clearAllMessagesBtn: document.getElementById('clear-all-messages-btn'),
    clearAllChannelsBtn: document.getElementById('clear-all-channels-btn'),
    clearChatModal: document.getElementById('clear-chat-modal'),
    clearChatChannelName: document.getElementById('clear-chat-channel-name'),
    clearChatCancel: document.getElementById('clear-chat-cancel'),
    clearChatConfirm: document.getElementById('clear-chat-confirm'),
    clearAllChannelsModal: document.getElementById('clear-all-channels-modal'),
    clearAllChannelsCancel: document.getElementById('clear-all-channels-cancel'),
    clearAllChannelsConfirm: document.getElementById('clear-all-channels-confirm'),
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
let chatPreferences={playSound:true, showToasts:true, showBadges:true}; // FIX 3: chat notif settings
// PART 3+4: Centralized notification pipeline - ping audio preload, user interaction flag, debounce, title, OS notification
let pingAudio=null;
let userInteractedAdmin=false;
let pendingPingsQueue=[];
let lastPingSoundTime=0;
let pingTimestamps=[]; // for debouncing 5+ within 2s
let originalDocTitle=typeof document!=='undefined' ? document.title : 'DevDNA Admin';
let isFirstPingLoad=true;
let browserNotifPermissionAsked=false;
let attemptCount=0;
let editingQuestionId=null;
let deletingQuestionId=null;
let editingAdminGmail=null;
let selectedUserGmail=null;
let effectiveOwnerGmail=null; // Security overhaul: owner Gmail from Firestore /settings/main/ownerGmail
let questionsUnsub=null, adminsUnsub=null, leaderboardUnsub=null, settingsUnsub=null, activityUnsub=null, usersUnsub=null, historyUnsub=null, chatChannelsUnsub=null, unreadUnsub=null;
let modalHandlersInitialized=false;
// PART 3: Render debouncing/deduplication to stop console spam
let lastAdminHash=null;
let renderDebounceTimer=null;
let lastUsersHash=null;
let usersRenderTimer=null;
let lastMembersHash=null;
let membersRenderTimer=null;

function hashAdmins(admins){
    try{
        return admins.map(a => `${a.gmail}|${a.role}|${a.displayAsOwner}|${a.displayName}|${JSON.stringify(a.permissions)}`).sort().join('||');
    }catch{ return Date.now().toString(); }
}
function scheduleRenderAdmins(admins){
    const newHash=hashAdmins(admins);
    if(newHash===lastAdminHash){
        console.log('[DevDNA v1.0] Skipping duplicate admin render');
        return;
    }
    lastAdminHash=newHash;
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer=setTimeout(()=>renderAdmins(admins), 100);
}

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
function isOwnerGmail(gmail){
    if(!gmail) return false;
    const lower = gmail.toLowerCase();
    // Check effective owner from Firestore if available
    if(effectiveOwnerGmail && lower===effectiveOwnerGmail.toLowerCase()) return true;
    // Fallback to OWNER_CONFIG only if not migrated
    if(OWNER_CONFIG.gmail !== 'MIGRATED_TO_FIRESTORE' && !OWNER_CONFIG._deprecated){
        if(lower===OWNER_CONFIG.gmail.toLowerCase()) return true;
    }
    return false;
}
function getEffectiveOwnerGmail(){
    if(effectiveOwnerGmail) return effectiveOwnerGmail;
    if(OWNER_CONFIG.gmail !== 'MIGRATED_TO_FIRESTORE' && !OWNER_CONFIG._deprecated) return OWNER_CONFIG.gmail;
    return effectiveOwnerGmail || OWNER_CONFIG.gmail;
}
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

function canViewPassword(currentAdmin, targetAdmin){
    console.log('[DevDNA v1.0] Password view attempt by:', currentAdmin?.role, currentAdmin?.gmail, 'target:', targetAdmin?.gmail, targetAdmin?.role);
    if(!currentAdmin || !targetAdmin) return false;
    // Cannot view own password (already knows it)
    if(currentAdmin.gmail.toLowerCase()===targetAdmin.gmail.toLowerCase()) return false;
    // OWNER sees everyone's password
    if(currentAdmin.role==='owner') return true;
    // ADMINISTRATOR sees ONLY regular admins' passwords
    if(currentAdmin.role==='administrator'){
        if(targetAdmin.role==='owner') return false;
        if(targetAdmin.role==='administrator') return false;
        if(targetAdmin.role==='admin') return true;
    }
    return false;
}

function canResetPassword(currentAdmin, targetAdmin){
    if(!currentAdmin || !targetAdmin) return false;
    if(currentAdmin.gmail.toLowerCase()===targetAdmin.gmail.toLowerCase()) return false; // No self-reset via this flow
    if(currentAdmin.role==='owner') return true; // Owner resets anyone
    if(currentAdmin.role==='administrator' && targetAdmin.role==='admin'){
        return true; // Administrator resets regular admins
    }
    return false;
}

function generateTempPassword(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    return Array.from({length:20}, ()=> chars[Math.floor(Math.random()*chars.length)]).join('');
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
            // FIX 4: #general Messages Don't Load on First Visit — auto-load default channel when Chat tab opens
            // PART 2: Clear stuck unread badge after 1 sec if still viewing chat
            if(tab.dataset.tab==='chat'){
                if(DOM.chatHeader) DOM.chatHeader.textContent=`# ${currentChatChannel}`;
                if(DOM.chatInput) DOM.chatInput.placeholder=`Message #${currentChatChannel}`;
                subscribeToCurrentChat();
                // PART 2: Wait 1 sec then mark as read if still visible
                setTimeout(()=>{
                    const chatContent=document.getElementById('tab-chat');
                    if(chatContent && chatContent.classList.contains('active')){
                        console.log('[DevDNA v1.0] Chat tab still visible after 1s - auto-clearing pings');
                        markAllPingsAsRead();
                    }
                }, 1000);
                // PART 2: If initial pings were stuck from previous session and chat tab already open, clear them
                if(isFirstPingLoad && unreadPings.length>0){
                    console.log('[DevDNA v1.0] Initial pings loaded while on Chat tab - will auto-clear');
                    setTimeout(()=>markAllPingsAsRead(), 1500);
                }
            }
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
    // Handle clear chat buttons visibility
    if(DOM.clearAllMessagesBtn){
        if(userCan('clear_chat')) DOM.clearAllMessagesBtn.style.display='inline-flex';
        else DOM.clearAllMessagesBtn.style.display='none';
    }
    if(DOM.clearAllChannelsBtn){
        if(currentAdmin?.role==='owner') DOM.clearAllChannelsBtn.classList.remove('hidden');
        else DOM.clearAllChannelsBtn.classList.add('hidden');
    }
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
    // PART 2: Use verifyPassword (SHA-256) with auto-migration from plaintext
    let isValid=false;
    try{
        const { verifyPassword, isPasswordHashed, sha256Hash, updateAdmin } = await import('./firebase.js');
        isValid = await verifyPassword(entered, currentAdmin.password);
        if(!isValid){
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
        // Successful login — check if password needs migration from plaintext to hash
        if(!isPasswordHashed(currentAdmin.password)){
            try{
                const newHash = await sha256Hash(entered);
                await updateAdmin(currentAdmin.gmail, { password: newHash });
                currentAdmin.password = newHash; // update local copy
                console.log('[DevDNA v1.0] 🔒 Password migrated to hash for:', currentAdmin.gmail);
                await logActivity('password_migrated', `Plaintext password auto-migrated to SHA-256 hash on login for ${currentAdmin.gmail}`);
            }catch(e){
                console.warn('[DevDNA v1.0] Password migration failed', e);
            }
        }
        // PART 3: Check mustChangePassword flag after reset
        if(currentAdmin.mustChangePassword){
            console.log('[DevDNA v1.0] Must change password flag detected for', currentAdmin.gmail);
            DOM.passwordError.classList.remove('show');
            if(DOM.passwordTerminal) DOM.passwordTerminal.textContent=`> PASSWORD RESET DETECTED. MUST CHANGE PASSWORD.`;
            // Show mandatory change screen instead of dashboard
            showMandatoryPasswordChangeScreen();
            return;
        }
    }catch(e){
        console.warn('[DevDNA v1.0] verifyPassword failed, fallback to direct compare', e);
        // Fallback to old direct compare for safety during migration
        if(entered!==currentAdmin.password){
            attemptCount++;
            DOM.passwordError.textContent=`⛔ ACCESS DENIED — Wrong password (Attempt ${attemptCount})`;
            DOM.passwordError.classList.add('show');
            return;
        }
    }
    DOM.passwordError.classList.remove('show');
    if(DOM.passwordTerminal) DOM.passwordTerminal.textContent=`> ACCESS GRANTED. WELCOME, ${currentAdmin.role.toUpperCase()}.`;
    await logActivity('logged in', `Role: ${currentAdmin.role}`);
    try{ localStorage.setItem('devdna_admin_session', JSON.stringify({gmail:currentAdmin.gmail, timestamp:Date.now()})); }catch{}
    setTimeout(()=>{ showDashboardScreen(); initDashboard(); },700);
}

function showMandatoryPasswordChangeScreen(){
    // PART 3: Force password change after reset
    const authPasswordDiv = DOM.authPassword;
    if(!authPasswordDiv) return;
    authPasswordDiv.innerHTML=`
        <div class="admin-label">PASSWORD RESET REQUIRED</div>
        <h2 class="admin-title">Change Your Password</h2>
        <p class="admin-sub">Your password was reset by ${currentAdmin.passwordResetBy||'admin'}. You must set a new password (min 12 chars) before accessing panel.</p>
        <div style="margin-top:18px;">
            <label class="mono" style="font-size:11px;">New Password (min 12 chars):</label>
            <input id="mandatory-new-password" class="admin-input" type="password" placeholder="New password...">
            <label class="mono" style="font-size:11px; margin-top:12px; display:block;">Confirm New Password:</label>
            <input id="mandatory-confirm-password" class="admin-input" type="password" placeholder="Confirm...">
        </div>
        <button id="mandatory-change-btn" class="btn btn-primary admin-btn" style="width:100%; margin-top:16px;">CHANGE PASSWORD & CONTINUE</button>
        <div id="mandatory-error" class="admin-error mono" style="margin-top:12px;"></div>
    `;
    const newPassInput = document.getElementById('mandatory-new-password');
    const confirmInput = document.getElementById('mandatory-confirm-password');
    const changeBtn = document.getElementById('mandatory-change-btn');
    const errorEl = document.getElementById('mandatory-error');

    changeBtn?.addEventListener('click', async ()=>{
        const pwd = newPassInput?.value?.trim() || '';
        const confirm = confirmInput?.value?.trim() || '';
        if(errorEl){ errorEl.classList.remove('show'); errorEl.textContent=''; }
        if(pwd.length < 12){
            if(errorEl){ errorEl.textContent='⛔ Password must be at least 12 characters.'; errorEl.classList.add('show'); }
            newPassInput?.classList.add('shake');
            setTimeout(()=>newPassInput?.classList.remove('shake'), 420);
            return;
        }
        if(pwd !== confirm){
            if(errorEl){ errorEl.textContent='⛔ Passwords do not match.'; errorEl.classList.add('show'); }
            confirmInput?.classList.add('shake');
            setTimeout(()=>confirmInput?.classList.remove('shake'), 420);
            return;
        }
        changeBtn.disabled=true;
        changeBtn.textContent='CHANGING...';
        try{
            const { sha256Hash, updateAdmin } = await import('./firebase.js');
            const hashed = await sha256Hash(pwd);
            await updateAdmin(currentAdmin.gmail, { password: hashed, mustChangePassword: false, passwordResetAt: null, passwordResetBy: null });
            currentAdmin.password = hashed;
            currentAdmin.mustChangePassword = false;
            console.log('[DevDNA v1.0] Mandatory password change completed for', currentAdmin.gmail);
            await logActivity('password_changed_after_reset', `Changed password after reset for ${currentAdmin.gmail}`);
            // Proceed to dashboard
            showDashboardScreen();
            initDashboard();
        }catch(err){
            console.error('[DevDNA v1.0] Mandatory password change failed', err);
            if(errorEl){ errorEl.textContent='Failed: '+(err.message||'Unknown'); errorEl.classList.add('show'); }
        }finally{
            changeBtn.disabled=false;
            changeBtn.textContent='CHANGE PASSWORD & CONTINUE';
        }
    });
}

// Dashboard - FIX: Made async to allow await import for heartbeat (Bug fix for SyntaxError: Unexpected reserved word)
async function initDashboard(){
    if(!currentAdmin) return;
    if(DOM.sidebarAvatar) DOM.sidebarAvatar.src=currentAdmin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName)}&background=a855f7&color=fff`;
    if(DOM.sidebarName) DOM.sidebarName.innerHTML=`${currentAdmin.displayName} ${getRoleEmoji(currentAdmin.role)}`;
    if(DOM.sidebarRole){ DOM.sidebarRole.textContent=currentAdmin.role.toUpperCase(); DOM.sidebarRole.className=`sidebar-role ${getRoleBadgeClass(currentAdmin.role)}`; }
    filterTabsByPermission();
    initSidebar();

    if(questionsUnsub) questionsUnsub();
    questionsUnsub=subscribeToQuestions((qs)=>{ allQuestions=qs; renderQuestions(); renderDashboardStats(); });
    if(adminsUnsub) adminsUnsub();
    adminsUnsub=subscribeToAdmins((admins)=>{
        console.log('[DevDNA v1.0] Admins snapshot received:', admins.length);
        allAdmins=admins;
        // PART 3: Use debounced render to stop spam
        scheduleRenderAdmins(admins);
        renderDashboardStats();
        renderUsers();
        renderChatMembers();
    });
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
            if(DOM.autoclearInterval) DOM.autoclearInterval.value=settings.leaderboardAutoClearDays||10;
            if(DOM.nextClearTime) DOM.nextClearTime.textContent=settings.nextAutoClearAt?new Date(settings.nextAutoClearAt).toLocaleString():'Never';
            if(DOM.freezeToggle) DOM.freezeToggle.checked=!!settings.leaderboardFrozen;
            if(settings.ownerGmail){
                effectiveOwnerGmail = settings.ownerGmail;
                console.log('[DevDNA v1.0] Effective owner Gmail from Firestore:', effectiveOwnerGmail);
            }
            // FIX 4: Theme outline instant - only apply if actually different (another admin changed in another tab)
            if(settings.theme && settings.theme!==currentAppliedTheme){
                applyTheme(settings.theme);
                updateThemeCardOutline(settings.theme);
                currentAppliedTheme = settings.theme;
            }
            updateAutoclearCountdown(settings);
        });
    });

    if(usersUnsub) usersUnsub();
    usersUnsub=subscribeToUsers((users)=>{ allUsers=users; renderUsers(); renderBannedFeatured(); renderDashboardStats(); });

    if(historyUnsub) historyUnsub();
    historyUnsub=subscribeToLeaderboardHistory((history)=>{ leaderboardHistory=history; renderHistory(); });

    if(chatChannelsUnsub) chatChannelsUnsub();
    chatChannelsUnsub=subscribeToChatChannels((channels)=>{
        chatChannels=channels;
        renderChatChannels();
        // FIX 4: Automatically load and subscribe to DEFAULT channel (#general) on Chat tab open / first visit
        if(chatChannels.length>0 && !chatMessagesUnsub){
            // If current channel not in list, default to general
            if(!chatChannels.find(c=>c.id===currentChatChannel)){
                currentChatChannel = chatChannels[0]?.id || 'general';
            }
            if(DOM.chatHeader) DOM.chatHeader.textContent=`# ${currentChatChannel}`;
            if(DOM.chatInput) DOM.chatInput.placeholder=`Message #${currentChatChannel}`;
            subscribeToCurrentChat();
        }
    });

    // PART 1: Preload ping audio with cache-busting, error handling, volume
    try{
        pingAudio=new Audio('audio/ping.mp3?v=1');
        pingAudio.preload='auto';
        pingAudio.volume=0.15;
        pingAudio.addEventListener('error', (e)=>{
            console.warn('[DevDNA v1.0] Ping audio failed to load:', e);
        });
        pingAudio.addEventListener('canplaythrough', ()=>{
            console.log('[DevDNA v1.0] Ping audio ready');
        });
        try{ pingAudio.load(); }catch{}
    }catch(e){ console.warn('[DevDNA v1.0] pingAudio init failed', e); }

    // PART 3: Autoplay compliance - track user interaction
    const markAdminInteracted=()=>{
        if(!userInteractedAdmin){
            userInteractedAdmin=true;
            console.log('[DevDNA v1.0] Admin user interacted - audio unlocked');
            // Play queued pings if any
            if(pendingPingsQueue.length>0){
                console.log(`[DevDNA v1.0] Playing ${pendingPingsQueue.length} queued pings`);
                pendingPingsQueue.forEach(p=>{ playPingSoundWithDebounce(p); });
                pendingPingsQueue=[];
            }
        }
    };
    document.addEventListener('click', markAdminInteracted);
    document.addEventListener('keydown', markAdminInteracted);

    // PART 4: Browser Notification API permission request (once)
    try{
        if('Notification' in window && Notification.permission==='default' && !browserNotifPermissionAsked){
            browserNotifPermissionAsked=true;
            setTimeout(()=>{
                Notification.requestPermission().then(perm=>{
                    console.log('[DevDNA v1.0] Notification permission:', perm);
                    try{ localStorage.setItem('devdna_notif_perm', perm); }catch{}
                }).catch(()=>{});
            }, 2000); // ask after 2s to not be intrusive
        }
    }catch{}

    if(unreadUnsub) unreadUnsub();
    let lastPingCount=0;
    // Load chat preferences
    try{
        const { getChatPreferences } = await import('./firebase.js');
        const prefs = await getChatPreferences(currentAdmin.gmail);
        if(prefs) chatPreferences = {...chatPreferences, ...prefs};
        console.log('[DevDNA v1.0] Chat preferences loaded', chatPreferences);
    }catch(e){ console.warn('[DevDNA v1.0] Failed to load chat prefs', e); }

    isFirstPingLoad=true;
    unreadUnsub=subscribeToUnreadPings(currentAdmin.gmail, (pings)=>{
        console.log('[DevDNA v1.0] Unread pings received:', pings.length, 'items');
        const badge=DOM.chatUnreadBadge;
        // PART 2: Self-ping should ALSO trigger - do NOT exclude current user gmail
        // PART 4: Update document.title with unread count, badge handling with preferences
        if(badge){
            if(chatPreferences.showBadges!==false && pings.length>0){
                badge.textContent=pings.length;
                badge.classList.remove('hidden');
                // PART 3: Visual pulse animation when new ping arrives
                badge.classList.add('ping-pulse');
                setTimeout(()=>badge.classList.remove('ping-pulse'), 800);
            } else {
                badge.classList.add('hidden');
            }
        }
        // Update document.title
        if(pings.length>0){
            document.title=`(${pings.length}) ${originalDocTitle}`;
        } else {
            document.title=originalDocTitle;
        }

        // Determine new pings - FIX 2: Fix self-ping detection, first load should not spam but first real ping after empty should trigger
        if(isFirstPingLoad){
            lastPingCount=pings.length;
            isFirstPingLoad=false;
            console.log('[DevDNA v1.0] Initial pings loaded:', pings.length);
        } else if(pings.length>lastPingCount){
            const newPingsCount=pings.length-lastPingCount;
            const newPings=pings.slice(0, newPingsCount);
            console.log(`[DevDNA v1.0] ${newPingsCount} new ping(s) detected (including self-pings)`);
            newPings.forEach(ping=>{
                // PART 4: Centralized notifyAdmin
                notifyAdmin(ping);
            });
        } else if(pings.length<lastPingCount){
            // Pings cleared
            console.log('[DevDNA v1.0] Pings cleared, was', lastPingCount, 'now', pings.length);
        }
        lastPingCount=pings.length;
        unreadPings=pings;
    });

    // Heartbeat every 30s to update lastSeen for active admin counting (Bug 3) - FIXED: now inside async function, await allowed
    try{
        const mod = await import('./firebase.js');
        if(mod.updateAdminLastSeen && currentAdmin?.gmail){
            mod.updateAdminLastSeen(currentAdmin.gmail);
            if(window._adminHeartbeat) clearInterval(window._adminHeartbeat);
            window._adminHeartbeat = setInterval(()=>{
                if(currentAdmin?.gmail){
                    mod.updateAdminLastSeen(currentAdmin.gmail).catch(()=>{});
                }
            }, 30000);
        }
    }catch(e){ console.warn('[DevDNA v1.0] Heartbeat init failed', e); }

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
    DOM.clearAllMessagesBtn && (DOM.clearAllMessagesBtn.onclick=()=>{
        playClick();
        if(!userCan('clear_chat')){ alert('No permission: clear_chat'); return; }
        // Show confirmation with channel name
        if(DOM.clearChatChannelName) DOM.clearChatChannelName.textContent = '# ' + currentChatChannel;
        DOM.clearChatModal?.classList.remove('hidden');
    });
    DOM.clearAllChannelsBtn && (DOM.clearAllChannelsBtn.onclick=()=>{
        playClick();
        if(currentAdmin.role!=='owner'){ alert('Only OWNER can clear all channels'); return; }
        DOM.clearAllChannelsModal?.classList.remove('hidden');
    });
    // Clear chat modals handlers
    document.getElementById('clear-chat-cancel')?.addEventListener('click',()=>{ playClick(); DOM.clearChatModal?.classList.add('hidden'); });
    document.getElementById('clear-chat-confirm')?.addEventListener('click', async()=>{
        playClick();
        DOM.clearChatModal?.classList.add('hidden');
        const mod=await import('./firebase.js');
        await mod.clearAllChannelMessages(currentChatChannel);
        const toast=document.getElementById('copy-toast');
        if(toast){ toast.textContent=`🧹 All messages in #${currentChatChannel} cleared`; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(()=>{ toast.classList.remove('show'); toast.classList.add('hidden'); },2500); }
        await logActivity('cleared all messages', `in #${currentChatChannel}`);
    });
    document.getElementById('clear-all-channels-cancel')?.addEventListener('click',()=>{ playClick(); DOM.clearAllChannelsModal?.classList.add('hidden'); });
    document.getElementById('clear-all-channels-confirm')?.addEventListener('click', async()=>{
        playClick();
        DOM.clearAllChannelsModal?.classList.add('hidden');
        if(!confirm('This will delete ALL messages across ALL channels. This CANNOT be undone. Are you absolutely sure?')) return;
        const mod=await import('./firebase.js');
        await mod.clearAllChatMessages();
        const toast=document.getElementById('copy-toast');
        if(toast){ toast.textContent=`☢️ All messages across all channels cleared`; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(()=>{ toast.classList.remove('show'); toast.classList.add('hidden'); },3000); }
        await logActivity('cleared all messages across all channels');
    });

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
        // FIX 3: Handle @ mention autocomplete navigation
        if(handleMentionKeydown(e)) return; // if autocomplete handled arrow/Enter/Escape, stop
        if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleChatSend(); }
    }));
    DOM.chatInput && (DOM.chatInput.addEventListener('input',()=>{
        // Show autocomplete as user types after @
        const val=DOM.chatInput.value;
        const cursor=DOM.chatInput.selectionStart;
        const textBefore=val.slice(0,cursor);
        if(/@\w*$/.test(textBefore)){
            showMentionAutocomplete();
        } else {
            const ac=document.getElementById('mention-autocomplete');
            if(ac && !ac.classList.contains('hidden')){
                // Keep showing if still has @ query, else hide
                if(!/@\w*$/.test(textBefore)){
                    hideMentionAutocomplete();
                }
            }
        }
    }));
    // Click outside autocomplete hides it
    document.addEventListener('click',(e)=>{
        const ac=document.getElementById('mention-autocomplete');
        if(ac && !ac.contains(e.target) && e.target!==DOM.chatInput){
            hideMentionAutocomplete();
        }
    });

    // FIX 3: Chat Settings Button Does Nothing — add modal with preferences
    DOM.chatNotifSettingsBtn && (DOM.chatNotifSettingsBtn.onclick=async()=>{
        playClick();
        const modal=document.getElementById('chat-notif-settings-modal');
        if(!modal) return;
        // Load prefs
        try{
            const mod=await import('./firebase.js');
            const prefs=await mod.getChatPreferences(currentAdmin.gmail);
            chatPreferences = {...chatPreferences, ...prefs};
        }catch{}
        const playEl=document.getElementById('notif-play-sound');
        const toastEl=document.getElementById('notif-show-toasts');
        const badgeEl=document.getElementById('notif-show-badges');
        if(playEl) playEl.checked = chatPreferences.playSound!==false;
        if(toastEl) toastEl.checked = chatPreferences.showToasts!==false;
        if(badgeEl) badgeEl.checked = chatPreferences.showBadges!==false;
        modal.classList.remove('hidden');
    });
    document.getElementById('notif-settings-cancel')?.addEventListener('click',()=>{
        playClick();
        document.getElementById('chat-notif-settings-modal')?.classList.add('hidden');
    });
    document.getElementById('notif-settings-save')?.addEventListener('click', async()=>{
        playClick();
        const playEl=document.getElementById('notif-play-sound');
        const toastEl=document.getElementById('notif-show-toasts');
        const badgeEl=document.getElementById('notif-show-badges');
        chatPreferences = {
            playSound: playEl ? playEl.checked : true,
            showToasts: toastEl ? toastEl.checked : true,
            showBadges: badgeEl ? badgeEl.checked : true
        };
        try{
            const mod=await import('./firebase.js');
            await mod.updateChatPreferences(currentAdmin.gmail, chatPreferences);
            await logActivity('updated chat notification settings', JSON.stringify(chatPreferences));
        }catch(e){ console.warn('Failed to save chat prefs', e); }
        document.getElementById('chat-notif-settings-modal')?.classList.add('hidden');
        const badge=DOM.chatUnreadBadge;
        if(badge){
            if(chatPreferences.showBadges===false) badge.classList.add('hidden');
            else if(unreadPings.length>0){ badge.textContent=unreadPings.length; badge.classList.remove('hidden'); }
        }
        const toast=document.getElementById('copy-toast');
        if(toast){
            toast.textContent='🔔 Chat notification settings saved';
            toast.classList.remove('hidden'); toast.classList.add('show');
            setTimeout(()=>{ toast.classList.remove('show'); toast.classList.add('hidden'); }, 2000);
        }
    });

    // PART 3: Reset Password modals
    document.getElementById('reset-password-cancel')?.addEventListener('click',()=>{
        playClick();
        document.getElementById('reset-password-confirm-modal')?.classList.add('hidden');
        pendingResetTargetGmail=null;
    });
    document.getElementById('reset-password-confirm')?.addEventListener('click', async()=>{
        playClick();
        await handleResetPasswordConfirm();
    });
    document.getElementById('copy-temp-password-btn')?.addEventListener('click', async()=>{
        playClick();
        const tempPwd = pendingTempPassword || document.getElementById('reset-temp-password-display')?.textContent || '';
        if(!tempPwd) return;
        try{
            if(navigator.clipboard && window.isSecureContext){
                await navigator.clipboard.writeText(tempPwd);
            }else{
                const ta=document.createElement('textarea');
                ta.value=tempPwd;
                ta.style.position='fixed';
                ta.style.opacity='0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            const btn=document.getElementById('copy-temp-password-btn');
            if(btn){ btn.textContent='✓ Copied!'; setTimeout(()=>btn.textContent='📋 COPY',1500); }
        }catch(e){
            alert('Copy failed, please manually copy: '+tempPwd);
        }
    });
    document.getElementById('reset-success-done-btn')?.addEventListener('click',()=>{
        playClick();
        document.getElementById('reset-password-success-modal')?.classList.add('hidden');
        pendingResetTargetGmail=null;
        pendingTempPassword=null;
        const toast=document.getElementById('copy-toast');
        if(toast){
            toast.textContent='✅ Password reset complete - temp password shown once';
            toast.classList.remove('hidden'); toast.classList.add('show');
            setTimeout(()=>{ toast.classList.remove('show'); toast.classList.add('hidden'); },2500);
        }
    });

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
let currentAppliedTheme = null;
function updateThemeCardOutline(themeKey){
    document.querySelectorAll('.theme-card').forEach(card=>{
        card.classList.remove('theme-card-active');
        card.classList.remove('active');
        const badge=card.querySelector('.active-badge');
        if(badge) badge.remove();
    });
    const newActive = document.querySelector(`.theme-card[data-theme="${themeKey}"]`);
    if(newActive){
        newActive.classList.add('theme-card-active');
        newActive.classList.add('active');
        if(!newActive.querySelector('.active-badge')){
            const badge=document.createElement('div');
            badge.className='active-badge';
            badge.style.cssText='margin-top:8px; font-size:10px; color:var(--neon-green); font-weight:700;';
            badge.textContent='✓ ACTIVE';
            newActive.appendChild(badge);
        }
    }
}

function handleThemeCardClick(themeKey, theme){
    // 1. INSTANT visual update (before any async work)
    document.querySelectorAll('.theme-card').forEach(card=>{
        card.classList.remove('theme-card-active');
        card.classList.remove('active');
        const badge=card.querySelector('.active-badge');
        if(badge) badge.remove();
    });
    const newActiveCard = document.querySelector(`.theme-card[data-theme="${themeKey}"]`);
    if(newActiveCard){
        newActiveCard.classList.add('theme-card-active');
        newActiveCard.classList.add('active');
        if(!newActiveCard.querySelector('.active-badge')){
            const badge=document.createElement('div');
            badge.className='active-badge';
            badge.style.cssText='margin-top:8px; font-size:10px; color:var(--neon-green); font-weight:700;';
            badge.textContent='✓ ACTIVE';
            newActiveCard.appendChild(badge);
        }
    }
    // 2. Apply theme colors (starts 0.5s CSS transition — KEEP THIS)
    applyTheme(themeKey);
    currentAppliedTheme = themeKey;
    // 3. Write to Firestore in background (don't await for UI)
    import('./firebase.js').then(mod=>{
        mod.updateTheme(themeKey).then(()=>{
            logActivity('changed theme', `${theme.name} (${themeKey})`);
        }).catch(err=>{
            console.warn('[DevDNA v1.0] Theme save failed:', err);
        });
    });
}

function renderThemeGrid(){
    if(!DOM.themeGrid) return;
    DOM.themeGrid.innerHTML='';
    const activeTheme = document.documentElement.getAttribute('data-theme')||'cyberpunk';
    if(!currentAppliedTheme) currentAppliedTheme = activeTheme;
    Object.entries(THEMES).forEach(([key, theme])=>{
        const card=document.createElement('div'); 
        card.className='theme-card glass-panel';
        card.dataset.theme=key;
        const isActive=activeTheme===key;
        if(isActive){
            card.classList.add('active');
            card.classList.add('theme-card-active');
        }
        const previewBg=`linear-gradient(135deg, ${theme.colors['--neon-secondary']||'#333'}, ${theme.colors['--neon-primary']||'#fff'})`;
        card.innerHTML=`<div class="theme-card-preview" style="background:${previewBg};">${theme.icon}</div><div class="theme-card-name">${theme.name}</div><div class="theme-card-desc">${theme.desc}</div>${isActive?'<div class="active-badge" style="margin-top:8px; font-size:10px; color:var(--neon-green); font-weight:700;">✓ ACTIVE</div>':''}<div style="margin-top:8px; display:flex; gap:6px;"><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-primary']}; display:inline-block; border:1px solid rgba(255,255,255,0.2);"></span><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-secondary']}; display:inline-block;"></span><span style="width:16px; height:16px; border-radius:50%; background:${theme.colors['--neon-tertiary']}; display:inline-block;"></span></div><button style="margin-top:10px; padding:6px 12px; border-radius:8px; background:${theme.colors['--neon-primary']}; color:black; border:none; font-weight:700; font-size:11px;">Preview Button</button>`;
        card.addEventListener('click', ()=>{
            playClick();
            if(!userCan('change_theme')){ alert('No permission: change_theme'); return; }
            handleThemeCardClick(key, theme);
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

    // FIX 4: One-time cleanup - if all messages in #announcements are marked deleted incorrectly (no deletedBy), fix them
    if(currentChatChannel==='announcements'){
        const corrupted = messages.filter(m=>m.deleted && !m.deletedBy);
        if(corrupted.length>0 && corrupted.length===messages.length){
            console.warn('[DevDNA v1.0] Detected all announcements messages wrongly marked deleted — cleaning up');
            // Fix display: treat as not deleted for now, and schedule cleanup in Firestore
            messages.forEach(m=>{
                if(m.deleted && !m.deletedBy){
                    m.deleted = false; // Fix for display
                    // Also attempt to fix in Firestore (fire and forget)
                    import('./firebase.js').then(mod=>{
                        if(mod.editChatMessage){
                            // Actually we need to set deleted:false — we don't have function, so delete and recreate? Simpler: update doc directly
                            // For now just fix display, admin can manually delete if needed
                        }
                    });
                }
            });
        }
    }

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

        // FIX 4: Only show deleted if deleted===true AND has deletedBy (safeguard against corrupted data)
        if(msg.deleted && msg.deletedBy){
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
    const input = DOM.chatInput;
    const autocompleteEl = document.getElementById('mention-autocomplete');
    if(!input || !autocompleteEl) return;

    const cursorPos = input.selectionStart;
    const textBefore = input.value.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/); // @ at end with optional partial

    if(!atMatch){
        autocompleteEl.classList.add('hidden');
        autocompleteEl.style.display='none';
        return;
    }

    const query = atMatch[1].toLowerCase(); // partial after @
    const filtered = allAdmins.filter(a=> a.displayName.toLowerCase().includes(query));

    if(filtered.length===0){
        autocompleteEl.classList.add('hidden');
        autocompleteEl.style.display='none';
        return;
    }

    // Render dropdown
    autocompleteEl.innerHTML='';
    filtered.forEach((admin, idx)=>{
        const div=document.createElement('div');
        div.className='mention-item';
        if(idx===0) div.classList.add('active');
        div.innerHTML=`
            <img src="${admin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.displayName)}&background=a855f7&color=fff`}" alt="">
            <div class="mention-item-info">
                <span class="mention-item-name">${admin.displayName}</span>
                <span class="mention-item-role">${getRoleEmoji(admin.role)} ${admin.role.toUpperCase()} ${admin.lastSeen && Date.now()-admin.lastSeen<5*60*1000?'🟢':''}</span>
            </div>
            <span style="font-size:10px; color:var(--text-muted);">${admin.role==='owner'?'👑':''}</span>
        `;
        div.addEventListener('click',()=>{
            selectMention(admin.displayName, atMatch[0].length);
        });
        autocompleteEl.appendChild(div);
    });

    autocompleteEl.classList.remove('hidden');
    autocompleteEl.style.display='block';
    autocompleteEl.dataset.queryLength = atMatch[0].length;
    autocompleteEl.dataset.query = query;
    autocompleteEl.dataset.startPos = cursorPos - atMatch[0].length;
}

function hideMentionAutocomplete(){
    const el=document.getElementById('mention-autocomplete');
    if(el){ el.classList.add('hidden'); el.style.display='none'; }
}

function selectMention(displayName, lengthToReplace){
    const input=DOM.chatInput;
    const autocompleteEl=document.getElementById('mention-autocomplete');
    if(!input || !autocompleteEl) return;
    const cursorPos=input.selectionStart;
    const startPos = parseInt(autocompleteEl.dataset.startPos) || (cursorPos - lengthToReplace);
    const before=input.value.slice(0, startPos);
    const after=input.value.slice(cursorPos);
    input.value = before + '@' + displayName + ' ' + after;
    input.selectionStart = input.selectionEnd = before.length + displayName.length + 2;
    hideMentionAutocomplete();
    input.focus();
}

function handleMentionKeydown(e){
    const autocompleteEl=document.getElementById('mention-autocomplete');
    if(!autocompleteEl || autocompleteEl.classList.contains('hidden')) return false;

    const items=autocompleteEl.querySelectorAll('.mention-item');
    let activeIdx=Array.from(items).findIndex(i=>i.classList.contains('active'));

    if(e.key==='ArrowDown'){
        e.preventDefault();
        if(activeIdx>=0) items[activeIdx].classList.remove('active');
        activeIdx=(activeIdx+1)%items.length;
        items[activeIdx].classList.add('active');
        items[activeIdx].scrollIntoView({block:'nearest'});
        return true;
    } else if(e.key==='ArrowUp'){
        e.preventDefault();
        if(activeIdx>=0) items[activeIdx].classList.remove('active');
        activeIdx=activeIdx<=0?items.length-1:activeIdx-1;
        items[activeIdx].classList.add('active');
        items[activeIdx].scrollIntoView({block:'nearest'});
        return true;
    } else if(e.key==='Enter'){
        if(activeIdx>=0){
            e.preventDefault();
            const name=items[activeIdx].querySelector('.mention-item-name')?.textContent;
            if(name){
                const len=parseInt(autocompleteEl.dataset.queryLength)||0;
                selectMention(name, len);
            }
            return true;
        }
    } else if(e.key==='Escape'){
        hideMentionAutocomplete();
        return true;
    }
    return false;
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

let pendingResetTargetGmail=null;
let pendingTempPassword=null;

function openResetPasswordConfirm(gmail){
    const target = allAdmins.find(a=>a.gmail.toLowerCase()===gmail.toLowerCase());
    if(!target){
        alert('Admin not found');
        return;
    }
    if(!canResetPassword(currentAdmin, target)){
        alert('You cannot reset this admin\'s password (rank protection)');
        return;
    }
    pendingResetTargetGmail=gmail;
    const infoEl=document.getElementById('reset-target-info');
    if(infoEl){
        infoEl.innerHTML=`
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${target.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(target.displayName)}&background=a855f7&color=fff`}" style="width:36px; height:36px; border-radius:50%;">
                <div>
                    <div style="font-weight:800;">👤 ${target.displayName}</div>
                    <div class="mono" style="font-size:11px; color:var(--text-muted);">📧 ${target.gmail}</div>
                    <div><span class="role-badge ${getRoleBadgeClass(target.role)}">${getRoleEmoji(target.role)} ${target.role.toUpperCase()}</span></div>
                </div>
            </div>
        `;
    }
    document.getElementById('reset-password-confirm-modal')?.classList.remove('hidden');
}

async function handleResetPasswordConfirm(){
    if(!pendingResetTargetGmail) return;
    const target = allAdmins.find(a=>a.gmail.toLowerCase()===pendingResetTargetGmail.toLowerCase());
    if(!target) return;
    const confirmModal=document.getElementById('reset-password-confirm-modal');
    const successModal=document.getElementById('reset-password-success-modal');
    const confirmBtn=document.getElementById('reset-password-confirm');
    if(confirmBtn){ confirmBtn.disabled=true; confirmBtn.textContent='RESETTING...'; }
    try{
        const tempPassword = generateTempPassword();
        pendingTempPassword=tempPassword;
        const { sha256Hash, updateAdmin } = await import('./firebase.js');
        const hashedTemp = await sha256Hash(tempPassword);
        await updateAdmin(target.gmail, {
            password: hashedTemp,
            mustChangePassword: true,
            passwordResetAt: Date.now(),
            passwordResetBy: currentAdmin.gmail
        });
        await logActivity('password_reset', `reset password for ${target.displayName} (${target.role}) by ${currentAdmin.displayName}`);
        console.log('[DevDNA v1.0] Password reset for', target.gmail);

        // Show success modal with temp password once
        if(confirmModal) confirmModal.classList.add('hidden');
        const nameEl=document.getElementById('reset-success-name');
        const displayEl=document.getElementById('reset-temp-password-display');
        if(nameEl) nameEl.textContent=target.displayName;
        if(displayEl) displayEl.textContent=tempPassword;
        if(successModal) successModal.classList.remove('hidden');
    }catch(e){
        console.error('[DevDNA v1.0] Password reset failed', e);
        alert('Reset failed: '+(e.message||'Unknown'));
    }finally{
        if(confirmBtn){ confirmBtn.disabled=false; confirmBtn.textContent='RESET PASSWORD'; }
    }
}

// Bind reset password modal handlers in bindDashboardEvents - we will also add here as fallback

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
