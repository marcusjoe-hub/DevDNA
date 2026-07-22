/**
 * DevDNA v3 - Admin Panel with Google Auth + Roles + Permissions + Questions + Activity + Themes
 * Owner: Marcus (OWNER_GMAIL_PLACEHOLDER) — hardcoded, cannot be removed/demoted
 */

import { 
    OWNER_CONFIG,
    signInWithGoogle, signOutUser, onAuthChange,
    getAdminByGmail, getAllAdmins, subscribeToAdmins, createAdmin, updateAdmin, deleteAdmin,
    getDefaultPermissions, getPermissionDefs, sanitizeGmail,
    subscribeToLeaderboard, clearAllSubmissions, getLeaderboardData,
    subscribeToSettings, updateEventStatus, updateAnnouncement, updateTheme,
    getQuestions, subscribeToQuestions, addQuestion, updateQuestion, deleteQuestion, seedQuestionsIfEmpty,
    addActivityLog, subscribeToActivityLog, clearActivityLog,
    isFirebaseConfigured
} from './firebase.js';
import { THEMES, applyTheme } from './themes.js';

// DOM
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
    // Tabs
    tabs: document.querySelectorAll('.sidebar-tab'),
    tabContents: document.querySelectorAll('.admin-tab-content'),
    // Dashboard overview
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
    // Leaderboard
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
    permsCheckboxes: document.getElementById('permissions-checkboxes'),
    addAdminCancel: document.getElementById('add-admin-cancel'),
    addAdminCreate: document.getElementById('add-admin-create'),
    editAdminModal: document.getElementById('edit-admin-modal'),
    editAdminTitle: document.getElementById('edit-admin-title'),
    editAdminContent: document.getElementById('edit-admin-content'),
    editAdminRemove: document.getElementById('edit-admin-remove'),
    editAdminCancel: document.getElementById('edit-admin-cancel'),
    editAdminSave: document.getElementById('edit-admin-save'),
    // Activity
    activityList: document.getElementById('activity-list'),
    activitySearch: document.getElementById('activity-search'),
    activityFilterRole: document.getElementById('activity-filter-role'),
    clearActivityBtn: document.getElementById('clear-activity-btn'),
    clearLogModal: document.getElementById('clear-log-modal'),
    clearLogNo: document.getElementById('clear-log-no'),
    clearLogYes: document.getElementById('clear-log-yes'),
    // Theme
    themeGrid: document.getElementById('theme-grid')
};

let currentFirebaseUser = null;
let currentAdmin = null;
let allAdmins = [];
let allQuestions = [];
let activityLogs = [];
let attemptCount = 0;
let editingQuestionId = null;
let deletingQuestionId = null;
let editingAdminGmail = null;
let questionsUnsub = null;
let adminsUnsub = null;
let leaderboardUnsub = null;
let settingsUnsub = null;
let activityUnsub = null;

const ARCHETYPES = {
    frontend: { name:'Frontend Wizard', emoji:'🎨', color:'#00ccff' },
    backend: { name:'Backend Architect', emoji:'🛠', color:'#00ff99' },
    fullstack: { name:'Full Stack Ninja', emoji:'⚡', color:'#a855f7' },
    debugging: { name:'Debugging Detective', emoji:'🐞', color:'#ff8a00' },
    ai: { name:'AI Explorer', emoji:'🤖', color:'#00ffff' }
};

// Helpers
function playClick(){ try{ window.__DevDNA?.playSFX?.('click'); }catch{} }
function playError(){ try{ window.__DevDNA?.playSFX?.('error'); }catch{} }
function getRoleEmoji(role){ if(role==='owner') return '👑'; if(role==='administrator') return '⚡'; return '🛡️'; }
function getRoleBadgeClass(role){ if(role==='owner') return 'owner'; if(role==='administrator') return 'administrator'; return 'admin'; }
function isOwnerGmail(gmail){ return gmail?.toLowerCase() === OWNER_CONFIG.gmail.toLowerCase(); }
function userCan(permId){
    if(!currentAdmin) return false;
    if(currentAdmin.role==='owner') return true;
    if(currentAdmin.role==='administrator') return true;
    return !!currentAdmin.permissions?.[permId];
}
function generateHardPassword(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd=''; for(let i=0;i<16;i++) pwd+=chars[Math.floor(Math.random()*chars.length)];
    return pwd;
}
function sanitizeForId(gmail){ return gmail.toLowerCase().replace(/[^a-z0-9]/g,'_'); }

// FIX 6: Modal close helpers - ❌ button, ESC, overlay click
function closeModalById(id){
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.add('hidden');
    // Cleanup state
    if(id==='question-editor-modal') editingQuestionId=null;
    if(id==='delete-question-modal') deletingQuestionId=null;
    if(id==='add-admin-modal'){
        // nothing extra
    }
    if(id==='edit-admin-modal') editingAdminGmail=null;
}
let modalHandlersInitialized=false;
function closeAllModals(){
    document.querySelectorAll('.admin-confirm-modal').forEach(m=>{
        if(!m.classList.contains('hidden')){
            m.classList.add('hidden');
        }
    });
    editingQuestionId=null;
    deletingQuestionId=null;
    // don't clear editingAdminGmail here? closeAll should clear all
    if(document.getElementById('edit-admin-modal')?.classList.contains('hidden')){
        editingAdminGmail=null;
    }
}
function initModalCloseHandlers(){
    if(modalHandlersInitialized) return;
    modalHandlersInitialized=true;
    // ❌ close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
            playClick();
            const targetId = btn.dataset.close;
            if(targetId) closeModalById(targetId);
            else {
                const modal = btn.closest('.admin-confirm-modal');
                if(modal) modal.classList.add('hidden');
            }
        });
    });
    // Click outside modal (on overlay backdrop) closes it
    document.querySelectorAll('.admin-confirm-modal').forEach(modal=>{
        modal.addEventListener('click', (e)=>{
            if(e.target === modal){
                playClick();
                modal.classList.add('hidden');
                // cleanup
                if(modal.id==='question-editor-modal') editingQuestionId=null;
                if(modal.id==='delete-question-modal') deletingQuestionId=null;
                if(modal.id==='edit-admin-modal') editingAdminGmail=null;
            }
        });
    });
    // ESC key closes any open modal
    document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape'){
            const openModals = Array.from(document.querySelectorAll('.admin-confirm-modal')).filter(m=>!m.classList.contains('hidden'));
            if(openModals.length>0){
                playClick();
                openModals.forEach(m=>m.classList.add('hidden'));
                editingQuestionId=null;
                deletingQuestionId=null;
                // keep editingAdminGmail? close all should clear
                const editModal = document.getElementById('edit-admin-modal');
                if(editModal && !editModal.classList.contains('hidden')){
                    // will be hidden above, but also clear
                } else {
                    // if edit modal was open, clear gmail
                    if(openModals.some(m=>m.id==='edit-admin-modal')) editingAdminGmail=null;
                }
            }
        }
    });
}

// Activity logger wrapper
async function logActivity(action, details=''){
    if(!currentAdmin) return;
    try{
        await addActivityLog({
            gmail: currentAdmin.gmail,
            displayName: currentAdmin.displayName,
            role: currentAdmin.role,
            action,
            details
        });
    }catch(e){ console.warn('log failed',e); }
}

// Auth Screens
function showGoogleScreen(){
    DOM.authGoogle?.classList.remove('hidden');
    DOM.authPassword?.classList.add('hidden');
    DOM.dashboard?.classList.add('hidden');
}
function showPasswordScreen(admin){
    DOM.authGoogle?.classList.add('hidden');
    DOM.authPassword?.classList.remove('hidden');
    DOM.dashboard?.classList.add('hidden');
    if(DOM.identityName) DOM.identityName.textContent = `Welcome, ${admin.displayName}`;
    if(DOM.identityGmail) DOM.identityGmail.textContent = `${admin.gmail} • Enter personal password`;
    DOM.passwordInput.value='';
    DOM.passwordError.classList.remove('show');
    DOM.attemptCounter.textContent='';
    attemptCount=0;
    DOM.passwordInput.focus();
}
function showDashboardScreen(){
    DOM.authGoogle?.classList.add('hidden');
    DOM.authPassword?.classList.add('hidden');
    DOM.dashboard?.classList.remove('hidden');
}

// Sidebar tabs
function initSidebar(){
    DOM.tabs.forEach(tab=>{
        tab.addEventListener('click', ()=>{
            playClick();
            const target = tab.dataset.tab;
            // permission check
            const perm = tab.dataset.perm;
            if(perm && !userCan(perm)){
                // hide not allowed
                return;
            }
            DOM.tabs.forEach(t=>t.classList.remove('active'));
            tab.classList.add('active');
            DOM.tabContents.forEach(c=>c.classList.remove('active'));
            const content = document.getElementById(`tab-${target}`);
            if(content) content.classList.add('active');
            // mobile collapse
            if(window.innerWidth<=900){
                DOM.sidebar?.classList.add('collapsed');
            }
        });
    });
    DOM.sidebarToggle?.addEventListener('click', ()=>{
        playClick();
        DOM.sidebar?.classList.toggle('collapsed');
    });
}

function filterTabsByPermission(){
    DOM.tabs.forEach(tab=>{
        const perm = tab.dataset.perm;
        if(!perm) { tab.classList.remove('hidden-perm'); return; } // Dashboard always visible
        if(userCan(perm)){
            tab.classList.remove('hidden-perm');
        } else {
            tab.classList.add('hidden-perm');
        }
    });
}

// Google Sign-In Flow
async function handleGoogleSignIn(){
    playClick();
    DOM.googleBtn.disabled=true;
    DOM.googleBtn.innerHTML='<span class="btn-inner" style="justify-content:center;">⏳ Signing in...</span>';
    DOM.authError.classList.remove('show');
    try{
        const result = await signInWithGoogle();
        const user = result.user;
        currentFirebaseUser = user;
        const gmail = user.email;
        console.log('[DevDNA Admin] Google signed in:', gmail);
        
        // Check if admin exists
        const admin = await getAdminByGmail(gmail);
        if(!admin){
            // NOT authorized
            DOM.authError.textContent = `⛔ ACCESS DENIED — This Gmail (${gmail}) is not authorized.`;
            DOM.authError.classList.add('show');
            await addActivityLog({gmail, displayName:user.displayName||gmail, role:'unknown', action:'failed login attempt — Gmail not authorized', details:gmail});
            setTimeout(async ()=>{
                await signOutUser();
                currentFirebaseUser=null;
                DOM.authError.classList.remove('show');
            }, 3000);
            playError();
            if(navigator.vibrate) navigator.vibrate([50,30,50]);
            return;
        }

        // Authorized — go to password screen
        currentAdmin = admin;
        showPasswordScreen(admin);
        await logActivity('passed Google auth — awaiting password', `Gmail: ${gmail}`);

    }catch(e){
        console.error('Google sign-in failed',e);
        DOM.authError.textContent = `Error: ${e.message||'Google sign-in failed'}`;
        DOM.authError.classList.add('show');
    }finally{
        DOM.googleBtn.disabled=false;
        DOM.googleBtn.innerHTML='<span class="btn-inner" style="justify-content:center;"><span style="font-size:18px;">🔐</span> Sign in with Google</span>';
    }
}

// Password Auth Flow
async function handlePasswordAuth(){
    playClick();
    const entered = DOM.passwordInput.value.trim();
    if(!entered){
        DOM.passwordInput.focus();
        return;
    }
    if(!currentAdmin){
        DOM.passwordError.textContent='Session expired — please sign in again';
        DOM.passwordError.classList.add('show');
        setTimeout(()=>showGoogleScreen(),1500);
        return;
    }

    // Check password
    if(entered !== currentAdmin.password){
        attemptCount++;
        DOM.passwordError.textContent = `⛔ ACCESS DENIED — Wrong password (Attempt ${attemptCount})`;
        DOM.passwordError.classList.add('show');
        DOM.passwordInput.classList.add('shake');
        DOM.authPassword.classList.add('glitch');
        DOM.attemptCounter.textContent = `Failed attempts: ${attemptCount} — ${3-attemptCount} tries left before auto-logout`;
        setTimeout(()=>{
            DOM.passwordInput.classList.remove('shake');
            DOM.authPassword.classList.remove('glitch');
        },520);
        playError();
        if(navigator.vibrate) navigator.vibrate([50,30,50]);

        await addActivityLog({gmail:currentAdmin.gmail, displayName:currentAdmin.displayName, role:currentAdmin.role, action:'failed password attempt', details:`Attempt ${attemptCount}`});

        if(attemptCount>=3){
            setTimeout(async ()=>{
                await signOutUser();
                currentAdmin=null;
                currentFirebaseUser=null;
                showGoogleScreen();
                DOM.passwordError.classList.remove('show');
            },1500);
        }
        return;
    }

    // Correct password
    DOM.passwordError.classList.remove('show');
    DOM.passwordInput.classList.remove('shake');
    if(DOM.passwordTerminal) DOM.passwordTerminal.textContent = `> ACCESS GRANTED. WELCOME, ${currentAdmin.role.toUpperCase()}.`;
    
    await logActivity('logged in', `Role: ${currentAdmin.role}`);

    // Persist session
    try{
        localStorage.setItem('devdna_admin_session', JSON.stringify({gmail: currentAdmin.gmail, timestamp: Date.now()}));
    }catch{}

    setTimeout(()=>{
        showDashboardScreen();
        initDashboard();
    },700);
}

// Dashboard Init
function initDashboard(){
    if(!currentAdmin) return;

    // Sidebar user info
    if(DOM.sidebarAvatar) DOM.sidebarAvatar.src = currentAdmin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName)}&background=a855f7&color=fff`;
    if(DOM.sidebarName) DOM.sidebarName.innerHTML = `${currentAdmin.displayName} ${getRoleEmoji(currentAdmin.role)}`;
    if(DOM.sidebarRole) {
        DOM.sidebarRole.textContent = currentAdmin.role.toUpperCase();
        DOM.sidebarRole.className = `sidebar-role ${getRoleBadgeClass(currentAdmin.role)}`;
    }

    filterTabsByPermission();
    initSidebar();

    // Subscribe to data
    if(questionsUnsub) questionsUnsub();
    questionsUnsub = subscribeToQuestions((qs)=>{
        allQuestions = qs;
        renderQuestions();
        renderDashboardStats(); // for popular?
    });

    if(adminsUnsub) adminsUnsub();
    adminsUnsub = subscribeToAdmins((admins)=>{
        allAdmins = admins;
        renderAdmins();
        renderDashboardStats();
    });

    if(leaderboardUnsub) leaderboardUnsub();
    leaderboardUnsub = subscribeToLeaderboard((counts)=>{
        renderLeaderboardStats(counts);
        renderDashboardStats(counts);
    });

    if(activityUnsub) activityUnsub();
    activityUnsub = subscribeToActivityLog((logs)=>{
        activityLogs = logs;
        renderActivity();
        renderDashboardRecent();
    });

    if(settingsUnsub) settingsUnsub();
    // settings handled in main script.js, but we also need for event badge
    import('./firebase.js').then(mod=>{
        settingsUnsub = mod.subscribeToSettings((settings)=>{
            updateEventBadge(settings.eventLive);
            if(DOM.overviewEvent) DOM.overviewEvent.textContent = settings.eventLive ? 'LIVE' : 'CLOSED';
            if(DOM.overviewEvent) DOM.overviewEvent.style.color = settings.eventLive ? 'var(--neon-green)' : '#ff5c5c';
            if(DOM.announcementInput && document.activeElement!==DOM.announcementInput){
                DOM.announcementInput.value = settings.announcement||'';
                if(DOM.bannerPreview) DOM.bannerPreview.textContent = settings.announcement||'No banner';
            }
        });
    });

    renderThemeGrid();
    bindDashboardEvents();
}

function bindDashboardEvents(){
    // Event
    DOM.startEventBtn && (DOM.startEventBtn.onclick = async ()=>{
        playClick();
        if(!userCan('event_control')) return alert('No permission: event_control');
        DOM.startEventBtn.disabled=true;
        const mod = await import('./firebase.js');
        await mod.updateEventStatus(true);
        await logActivity('started the event');
        DOM.startEventBtn.disabled=false;
    });
    DOM.closeEventBtn && (DOM.closeEventBtn.onclick = async ()=>{
        playClick();
        if(!userCan('event_control')) return alert('No permission');
        DOM.closeEventBtn.disabled=true;
        const mod = await import('./firebase.js');
        await mod.updateEventStatus(false);
        await logActivity('closed the event');
        DOM.closeEventBtn.disabled=false;
    });
    // Banner
    DOM.updateBannerBtn && (DOM.updateBannerBtn.onclick = async ()=>{
        playClick();
        if(!userCan('change_banner')) return alert('No permission: change_banner');
        const text = DOM.announcementInput.value.trim();
        if(!text) return DOM.announcementInput.focus();
        DOM.updateBannerBtn.disabled=true;
        const mod = await import('./firebase.js');
        await mod.updateAnnouncement(text, true);
        await logActivity('updated banner', `"${text}"`);
        DOM.updateBannerBtn.textContent='✓ UPDATED';
        setTimeout(()=>DOM.updateBannerBtn.textContent='UPDATE BANNER',1500);
        DOM.updateBannerBtn.disabled=false;
    });
    DOM.hideBannerBtn && (DOM.hideBannerBtn.onclick = async ()=>{
        playClick();
        if(!userCan('change_banner')) return alert('No permission');
        DOM.hideBannerBtn.disabled=true;
        const mod = await import('./firebase.js');
        const current = DOM.announcementInput.value.trim();
        await mod.updateAnnouncement(current, false);
        await logActivity('hid banner');
        DOM.hideBannerBtn.textContent='✓ HIDDEN';
        setTimeout(()=>DOM.hideBannerBtn.textContent='HIDE BANNER',1500);
        DOM.hideBannerBtn.disabled=false;
    });
    DOM.announcementInput?.addEventListener('input', ()=>{
        if(DOM.bannerPreview) DOM.bannerPreview.textContent = DOM.announcementInput.value || 'Live preview...';
    });

    // Questions
    DOM.addQuestionBtn && (DOM.addQuestionBtn.onclick = ()=>{
        playClick();
        if(!userCan('add_questions')) return alert('No permission: add_questions');
        openQuestionEditor(null);
    });
    DOM.qeCancel && (DOM.qeCancel.onclick = ()=>{ playClick(); closeQuestionEditor(); });
    DOM.qeSave && (DOM.qeSave.onclick = async ()=>{
        playClick();
        await saveQuestion();
    });
    DOM.deleteQNo && (DOM.deleteQNo.onclick = ()=>{ playClick(); DOM.deleteQuestionModal.classList.add('hidden'); deletingQuestionId=null; });
    DOM.deleteQYes && (DOM.deleteQYes.onclick = async ()=>{
        playClick();
        if(deletingQuestionId){
            if(!userCan('delete_questions')) return alert('No permission');
            await deleteQuestion(deletingQuestionId);
            await logActivity('deleted question', `ID: ${deletingQuestionId}`);
            deletingQuestionId=null;
            DOM.deleteQuestionModal.classList.add('hidden');
        }
    });

    // Leaderboard
    DOM.clearBtn && (DOM.clearBtn.onclick = ()=>{
        playClick();
        if(!userCan('clear_submissions')) return alert('No permission: clear_submissions');
        DOM.confirmModal.classList.remove('hidden');
    });
    DOM.confirmNo && (DOM.confirmNo.onclick = ()=>{ playClick(); DOM.confirmModal.classList.add('hidden'); });
    DOM.confirmYes && (DOM.confirmYes.onclick = async ()=>{
        playClick();
        DOM.confirmModal.classList.add('hidden');
        DOM.clearBtn.textContent='CLEARING...';
        const mod = await import('./firebase.js');
        await mod.clearAllSubmissions();
        await logActivity('cleared all submissions');
        DOM.clearBtn.textContent='CLEAR ALL SUBMISSIONS';
    });
    DOM.exportBtn && (DOM.exportBtn.onclick = async ()=>{
        playClick();
        if(!userCan('download_data')) return alert('No permission: download_data');
        const data = await getLeaderboardData();
        const payload = { exportedAt:new Date().toISOString(), counts:data };
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download=`devdna-leaderboard-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
        await logActivity('downloaded leaderboard data');
    });

    // Admins
    DOM.addAdminBtn && (DOM.addAdminBtn.onclick = ()=>{
        playClick();
        if(!userCan('manage_admins')) return alert('No permission: manage_admins');
        openAddAdminModal();
    });
    DOM.addAdminCancel && (DOM.addAdminCancel.onclick = ()=>{ playClick(); DOM.addAdminModal.classList.add('hidden'); });
    DOM.addAdminCreate && (DOM.addAdminCreate.onclick = async ()=>{ playClick(); await handleCreateAdmin(); });
    DOM.generatePassBtn && (DOM.generatePassBtn.onclick = ()=>{ playClick(); DOM.newPassword.value = generateHardPassword(); });
    DOM.newIsAdmin && (DOM.newIsAdmin.onchange = ()=>{ renderPermissionsCheckboxes(); });
    DOM.newRole && (DOM.newRole.onchange = ()=>{ renderPermissionsCheckboxes(); });

    DOM.editAdminCancel && (DOM.editAdminCancel.onclick = ()=>{ playClick(); DOM.editAdminModal.classList.add('hidden'); editingAdminGmail=null; });
    DOM.editAdminSave && (DOM.editAdminSave.onclick = async ()=>{ playClick(); await handleEditAdminSave(); });
    DOM.editAdminRemove && (DOM.editAdminRemove.onclick = async ()=>{
        playClick();
        if(!editingAdminGmail) return;
        if(!userCan('manage_admins')) return alert('No permission');
        if(isOwnerGmail(editingAdminGmail)){ alert('OWNER cannot be removed — EVER'); return; }
        if(confirm(`Remove admin ${editingAdminGmail}?`)){
            try{
                await deleteAdmin(editingAdminGmail);
                await logActivity('removed admin', editingAdminGmail);
                DOM.editAdminModal.classList.add('hidden');
                editingAdminGmail=null;
            }catch(e){ alert(e.message); }
        }
    });

    DOM.adminSearch && (DOM.adminSearch.oninput = ()=>renderAdmins());

    // Activity
    DOM.clearActivityBtn && (DOM.clearActivityBtn.onclick = ()=>{
        playClick();
        if(!userCan('clear_activity_log')) return alert('No permission: clear_activity_log');
        DOM.clearLogModal.classList.remove('hidden');
    });
    DOM.clearLogNo && (DOM.clearLogNo.onclick = ()=>{ playClick(); DOM.clearLogModal.classList.add('hidden'); });
    DOM.clearLogYes && (DOM.clearLogYes.onclick = async ()=>{
        playClick();
        DOM.clearLogModal.classList.add('hidden');
        await clearActivityLog();
        // log this clear after clearing? Add new entry after clear
        await addActivityLog({gmail:currentAdmin.gmail, displayName:currentAdmin.displayName, role:currentAdmin.role, action:'cleared activity log'});
    });
    DOM.activitySearch && (DOM.activitySearch.oninput = ()=>renderActivity());
    DOM.activityFilterRole && (DOM.activityFilterRole.onchange = ()=>renderActivity());

    // Theme
    // rendered in renderThemeGrid, clicks handled there

    // Logout
    DOM.logoutBtn && (DOM.logoutBtn.onclick = async ()=>{
        playClick();
        await logActivity('logged out');
        await signOutUser();
        currentAdmin=null;
        currentFirebaseUser=null;
        try{ localStorage.removeItem('devdna_admin_session'); }catch{}
        showGoogleScreen();
        // unsubscribe
        if(questionsUnsub) questionsUnsub();
        if(adminsUnsub) adminsUnsub();
        if(leaderboardUnsub) leaderboardUnsub();
        if(activityUnsub) activityUnsub();
        if(settingsUnsub) settingsUnsub();
    });

    // Back to google
    DOM.backToGoogle && (DOM.backToGoogle.onclick = async ()=>{
        playClick();
        await signOutUser();
        currentAdmin=null;
        currentFirebaseUser=null;
        showGoogleScreen();
    });
}

function updateEventBadge(isLive){
    if(!DOM.eventBadge) return;
    if(isLive){
        DOM.eventBadge.textContent='🟢 LIVE';
        DOM.eventBadge.className='admin-status-badge badge-live';
    }else{
        DOM.eventBadge.textContent='🔴 CLOSED';
        DOM.eventBadge.className='admin-status-badge badge-closed';
    }
}

function renderDashboardStats(counts){
    // counts optional — if not provided, use last known from leaderboard
    // Overview total
    const total = counts ? (counts.total || Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0)) : (document.getElementById('admin-total-subs')?.textContent || 0);
    if(DOM.overviewTotal) DOM.overviewTotal.textContent = counts ? (counts.total||0).toLocaleString() : total;
    if(DOM.overviewAdmins) DOM.overviewAdmins.textContent = allAdmins.length.toString();
    // Most popular
    if(counts && DOM.overviewPopular){
        const entries = Object.entries(counts).filter(([k])=>k!=='total');
        const sorted = entries.sort((a,b)=>b[1]-a[1]);
        if(sorted.length>0){
            const topKey = sorted[0][0];
            const arch = ARCHETYPES[topKey];
            DOM.overviewPopular.textContent = arch ? arch.name : topKey;
        }
    }
    // stats grid
    if(DOM.dashboardStats){
        DOM.dashboardStats.innerHTML='';
        const source = counts || {frontend:0,backend:0,fullstack:0,debugging:0,ai:0};
        Object.keys(ARCHETYPES).forEach(key=>{
            const arch=ARCHETYPES[key];
            const count=source[key]||0;
            const card=document.createElement('div');
            card.className='stat-card';
            card.innerHTML=`<span class="stat-emoji">${arch.emoji}</span><div class="stat-name">${arch.name}</div><div class="stat-label">DEVELOPERS</div><span class="stat-count" style="color:${arch.color}; text-shadow:0 0 14px ${arch.color},0 0 32px ${arch.color};">${count}</span>`;
            DOM.dashboardStats.appendChild(card);
        });
    }
}
function renderDashboardRecent(){
    if(!DOM.dashboardRecent) return;
    DOM.dashboardRecent.innerHTML='';
    const recent = activityLogs.slice(0,5);
    if(recent.length===0){
        DOM.dashboardRecent.innerHTML='<div class="mono" style="font-size:11px; color:var(--text-muted);">No activity yet</div>';
        return;
    }
    recent.forEach(log=>{
        const div=document.createElement('div');
        div.className='activity-item';
        div.innerHTML=`<div><span class="role-emoji">${getRoleEmoji(log.role)}</span><strong>${log.displayName}</strong> <span class="activity-time">${new Date(log.timestamp).toLocaleString()}</span></div><div>${log.action}${log.details?` — ${log.details}`:''}</div>`;
        DOM.dashboardRecent.appendChild(div);
    });
}

function renderLeaderboardStats(counts){
    const total = counts.total || Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0);
    if(DOM.totalSubs) DOM.totalSubs.textContent = total.toLocaleString();
    if(DOM.statsGrid){
        DOM.statsGrid.innerHTML='';
        Object.keys(ARCHETYPES).forEach(key=>{
            const arch=ARCHETYPES[key];
            const count=counts[key]||0;
            const card=document.createElement('div');
            card.className='stat-card';
            card.innerHTML=`<span class="stat-emoji">${arch.emoji}</span><div class="stat-name">${arch.name}</div><div class="stat-label">DEVELOPERS</div><span class="stat-count" style="color:${arch.color}; text-shadow:0 0 14px ${arch.color},0 0 32px ${arch.color};">${count}</span>`;
            DOM.statsGrid.appendChild(card);
        });
    }
}

// Questions
function renderQuestions(){
    if(!DOM.questionsList) return;
    DOM.questionsList.innerHTML='';
    const filtered = [...allQuestions].sort((a,b)=>(a.order||0)-(b.order||0));
    filtered.forEach((q, idx)=>{
        const div=document.createElement('div');
        div.className='question-item';
        const canEdit = userCan('edit_questions');
        const canDelete = userCan('delete_questions');
        div.innerHTML=`
            <div class="question-item-header"><div style="display:flex; gap:10px; align-items:center;"><span class="question-item-order">#${q.order||idx+1}</span><span class="question-item-title">${q.text}</span></div><span style="font-size:12px;">▼</span></div>
            <div class="question-item-body">
                <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                    ${(q.options||[]).map(opt=>{
                        const arch=ARCHETYPES[opt.archetype]||{emoji:'❓', name:opt.archetype};
                        return `<div class="q-option"><span class="q-option-emoji">${arch.emoji}</span><span class="q-option-text">${opt.text}</span><span class="q-option-arch" style="border-color:${arch.color}44; color:${arch.color};">${arch.name}</span></div>`;
                    }).join('')}
                </div>
                <div style="display:flex; gap:8px;">
                    ${canEdit?`<button class="btn-admin-blue q-edit-btn" data-id="${q.id}">✏️ Edit</button>`:''}
                    ${canDelete?`<button class="btn-admin-red q-delete-btn" data-id="${q.id}">❌ Delete</button>`:''}
                </div>
            </div>
        `;
        const header=div.querySelector('.question-item-header');
        header.addEventListener('click',()=>{
            playClick();
            div.classList.toggle('expanded');
        });
        const editBtn=div.querySelector('.q-edit-btn');
        if(editBtn) editBtn.addEventListener('click',(e)=>{
            e.stopPropagation(); playClick();
            openQuestionEditor(q.id);
        });
        const delBtn=div.querySelector('.q-delete-btn');
        if(delBtn) delBtn.addEventListener('click',(e)=>{
            e.stopPropagation(); playClick();
            deletingQuestionId=q.id;
            DOM.deleteQuestionModal?.classList.remove('hidden');
        });
        DOM.questionsList.appendChild(div);
    });
    // Add question button visibility
    if(DOM.addQuestionBtn){
        if(userCan('add_questions')) DOM.addQuestionBtn.style.display='inline-flex';
        else DOM.addQuestionBtn.style.display='none';
    }
}

function openQuestionEditor(id){
    editingQuestionId=id;
    const q = allQuestions.find(x=>x.id===id);
    if(DOM.qeTitle) DOM.qeTitle.textContent = id ? 'Edit Question' : 'Add New Question';
    if(DOM.qeText) DOM.qeText.value = q ? q.text : '';
    // Render 4 options inputs
    if(DOM.qeOptions){
        DOM.qeOptions.innerHTML='';
        for(let i=0;i<4;i++){
            const opt = q?.options?.[i] || {text:'', archetype:'frontend'};
            const row=document.createElement('div');
            row.style.cssText='display:flex; gap:8px; margin-bottom:8px; align-items:center;';
            row.innerHTML=`
                <span style="font-family:var(--font-mono); font-size:11px; width:20px;">${String.fromCharCode(65+i)}</span>
                <input type="text" class="admin-input-sm qe-opt-text" placeholder="Answer text..." value="${opt.text.replace(/"/g,'&quot;')}" style="flex:1; margin-bottom:0;">
                <select class="admin-input-sm qe-opt-arch" style="max-width:140px; margin-bottom:0;">
                    <option value="frontend" ${opt.archetype==='frontend'?'selected':''}>🎨 Frontend</option>
                    <option value="backend" ${opt.archetype==='backend'?'selected':''}>🛠 Backend</option>
                    <option value="fullstack" ${opt.archetype==='fullstack'?'selected':''}>⚡ Fullstack</option>
                    <option value="debugging" ${opt.archetype==='debugging'?'selected':''}>🐞 Debugging</option>
                    <option value="ai" ${opt.archetype==='ai'?'selected':''}>🤖 AI</option>
                </select>
            `;
            DOM.qeOptions.appendChild(row);
        }
    }
    DOM.questionEditorModal?.classList.remove('hidden');
}
function closeQuestionEditor(){
    DOM.questionEditorModal?.classList.add('hidden');
    editingQuestionId=null;
}
async function saveQuestion(){
    const text = DOM.qeText.value.trim();
    if(!text){ alert('Question text required'); return; }
    const optRows = DOM.qeOptions.querySelectorAll('.qe-opt-text');
    const archRows = DOM.qeOptions.querySelectorAll('.qe-opt-arch');
    const options=[];
    for(let i=0;i<optRows.length;i++){
        const t=optRows[i].value.trim();
        const a=archRows[i].value;
        if(!t){ alert(`Option ${String.fromCharCode(65+i)} text required`); return; }
        options.push({text:t, archetype:a});
    }
    if(options.length!==4){ alert('Exactly 4 options required'); return; }

    const mod = await import('./firebase.js');
    if(editingQuestionId){
        if(!userCan('edit_questions')) return alert('No permission: edit_questions');
        await mod.updateQuestion(editingQuestionId, {text, options, order: allQuestions.find(q=>q.id===editingQuestionId)?.order || Date.now()});
        await logActivity('edited question', text.slice(0,40));
    } else {
        if(!userCan('add_questions')) return alert('No permission: add_questions');
        const order = allQuestions.length>0 ? Math.max(...allQuestions.map(q=>q.order||0))+1 : 1;
        await mod.addQuestion({order, text, options});
        await logActivity('added question', text.slice(0,40));
    }
    closeQuestionEditor();
}

// Admins
function renderAdmins(){
    if(!DOM.adminsList) return;
    const search = (DOM.adminSearch?.value||'').toLowerCase();
    let filtered = [...allAdmins];
    if(search){
        filtered = filtered.filter(a=> a.gmail.toLowerCase().includes(search) || a.displayName.toLowerCase().includes(search));
    }
    // Sort: owner first, then administrator, then admin, then by name
    filtered.sort((a,b)=>{
        const order = {owner:0, administrator:1, admin:2};
        if(order[a.role]!==order[b.role]) return order[a.role]-order[b.role];
        return a.displayName.localeCompare(b.displayName);
    });
    DOM.adminsList.innerHTML='';
    filtered.forEach(admin=>{
        const isOwner = admin.role==='owner';
        const div=document.createElement('div');
        div.className=`admin-row ${getRoleBadgeClass(admin.role)}`;
        div.innerHTML=`
            <img class="admin-avatar" src="${admin.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.displayName)}&background=a855f7&color=fff`}" alt="">
            <div class="admin-row-info">
                <div class="admin-row-name">${admin.displayName} <span class="role-badge ${getRoleBadgeClass(admin.role)}">${getRoleEmoji(admin.role)} ${admin.role.toUpperCase()}</span>${isOwner?'<span style="font-size:10px; color:var(--text-muted);">(Protected)</span>':''}</div>
                <div class="admin-row-gmail">${admin.gmail} • added by ${admin.addedBy||'unknown'}</div>
            </div>
            <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">${Object.values(admin.permissions||{}).filter(Boolean).length}/12 perms</span>
        `;
        div.addEventListener('click',()=>{
            playClick();
            openEditAdminModal(admin.gmail);
        });
        DOM.adminsList.appendChild(div);
    });
}

function renderPermissionsCheckboxes(container, currentPerms, isAdministratorToggleOn, isOwnerViewing, targetRole){
    // currentPerms: permissions object for target admin
    // isAdministratorToggleOn: if true, all checked disabled
    // isOwnerViewing: if current user is owner, can see passwords etc — for perms, owner can edit
    // targetRole: role of target admin
    const defs = getPermissionDefs();
    if(!container) return;
    container.innerHTML='';
    defs.forEach(def=>{
        const isChecked = isAdministratorToggleOn ? true : (currentPerms?.[def.id] ?? false);
        const isDisabled = isAdministratorToggleOn ? true : false;
        const div=document.createElement('div');
        div.className=`permission-item ${isDisabled?'disabled':''}`;
        div.innerHTML=`
            <input type="checkbox" id="perm-${def.id}" data-perm="${def.id}" ${isChecked?'checked':''} ${isDisabled?'disabled':''}>
            <div class="permission-item-content">
                <div class="permission-item-name">${def.name}</div>
                <div class="permission-item-desc">${def.desc}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function openAddAdminModal(){
    if(!userCan('manage_admins')) { alert('No permission: manage_admins'); return; }
    DOM.newGmail.value='';
    DOM.newName.value='';
    DOM.newPassword.value='';
    DOM.newRole.value='admin';
    DOM.newIsAdmin.checked=false;
    
    // Only OWNER can see ADMINISTRATOR option
    if(currentAdmin?.role!=='owner'){
        // remove administrator option if not owner
        const adminOpt = DOM.newRole.querySelector('option[value="administrator"]');
        if(adminOpt) adminOpt.style.display='none';
        DOM.newRole.value='admin';
    } else {
        const adminOpt = DOM.newRole.querySelector('option[value="administrator"]');
        if(adminOpt) adminOpt.style.display='';
    }

    renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), false, currentAdmin?.role==='owner', 'admin');
    DOM.addAdminModal.classList.remove('hidden');

    // toggle handler
    DOM.newIsAdmin.onchange = ()=>{
        const isOn = DOM.newIsAdmin.checked;
        if(isOn){
            DOM.newRole.value='administrator';
        } else {
            DOM.newRole.value='admin';
        }
        renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), isOn, currentAdmin?.role==='owner', DOM.newRole.value);
    };
    DOM.newRole.onchange = ()=>{
        const isAdminRole = DOM.newRole.value==='administrator';
        DOM.newIsAdmin.checked = isAdminRole;
        renderPermissionsCheckboxes(DOM.permsCheckboxes, getDefaultPermissions(), isAdminRole, currentAdmin?.role==='owner', DOM.newRole.value);
    };
}

async function handleCreateAdmin(){
    const gmail = DOM.newGmail.value.trim().toLowerCase();
    const displayName = DOM.newName.value.trim();
    const password = DOM.newPassword.value.trim();
    const role = DOM.newRole.value;
    const isAdminToggle = DOM.newIsAdmin.checked;

    if(!gmail || !displayName || !password){ alert('Gmail, Display Name, Password required'); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)){ alert('Invalid Gmail format'); return; }

    // Only owner can create administrator
    if(role==='administrator' && currentAdmin?.role!=='owner'){
        alert('Only OWNER can create ADMINISTRATOR');
        return;
    }

    // Collect permissions
    let permissions = {};
    if(isAdminToggle || role==='administrator' || role==='owner'){
        permissions = {...getDefaultPermissions()};
    } else {
        const checkboxes = DOM.permsCheckboxes.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb=>{
            permissions[cb.dataset.perm] = cb.checked;
        });
    }

    try{
        DOM.addAdminCreate.disabled=true;
        DOM.addAdminCreate.textContent='CREATING...';
        await createAdmin({
            gmail,
            displayName,
            password,
            role: isAdminToggle ? 'administrator' : role,
            permissions,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a855f7&color=fff`,
            addedBy: currentAdmin.gmail
        });
        await logActivity('added admin', `${displayName} (${gmail}) as ${role}`);
        DOM.addAdminModal.classList.add('hidden');
    }catch(e){
        alert(e.message);
    }finally{
        DOM.addAdminCreate.disabled=false;
        DOM.addAdminCreate.textContent='CREATE ADMIN';
    }
}

async function openEditAdminModal(gmail){
    const admin = allAdmins.find(a=>a.gmail.toLowerCase()===gmail.toLowerCase());
    if(!admin){ alert('Admin not found'); return; }
    editingAdminGmail = gmail;
    const isOwnerTarget = admin.role==='owner';
    const isCurrentOwner = currentAdmin?.role==='owner';
    const canEdit = userCan('manage_admins') || isCurrentOwner;

    // Build edit content
    const content = DOM.editAdminContent;
    content.innerHTML='';

    // Display name
    const nameRow = document.createElement('div');
    nameRow.innerHTML=`<label class="mono" style="font-size:11px;">Display Name</label><input id="edit-admin-displayname" class="admin-input-sm" value="${admin.displayName}">`;
    content.appendChild(nameRow);

    // Password visibility per spec
    const passRow = document.createElement('div');
    if(isCurrentOwner && !isOwnerGmail(admin.gmail)){
        // OWNER viewing — show password with eye toggle
        passRow.innerHTML=`
            <label class="mono" style="font-size:11px;">Password ${admin.role!=='owner' ? '(OWNER can see)' : ''}</label>
            <div class="password-field"><input id="edit-admin-password" class="admin-input-sm" type="text" value="${admin.password}" style="padding-right:40px; font-family:var(--font-mono);"><button type="button" class="password-eye" id="toggle-edit-pass">👁️</button></div>
        `;
    } else {
        // Not owner — show masked, no reveal
        passRow.innerHTML=`
            <label class="mono" style="font-size:11px;">Password</label>
            <input class="admin-input-sm" type="text" value="••••••••" disabled style="letter-spacing:4px;">
            <div class="mono" style="font-size:10px; color:var(--text-muted);">Only OWNER can view passwords — shows ••••••••</div>
        `;
    }
    content.appendChild(passRow);

    // Role toggle (only OWNER)
    if(isCurrentOwner && !isOwnerTarget){
        const roleRow = document.createElement('div');
        roleRow.style.marginTop='12px';
        roleRow.innerHTML=`
            <label class="mono" style="font-size:11px;">Role</label>
            <select id="edit-admin-role" class="admin-input-sm">
                <option value="admin" ${admin.role==='admin'?'selected':''}>🛡️ ADMIN</option>
                <option value="administrator" ${admin.role==='administrator'?'selected':''}>⚡ ADMINISTRATOR</option>
                ${isOwnerTarget?'<option value="owner" selected>👑 OWNER (locked)</option>':''}
            </select>
            <div class="mono" style="font-size:10px; color:var(--text-muted);">Owner cannot be demoted — EVER. Only OWNER can promote/demote ADMINISTRATOR.</div>
        `;
        content.appendChild(roleRow);

        // Administrator toggle
        const adminToggleRow = document.createElement('div');
        adminToggleRow.className='admin-toggle-card';
        adminToggleRow.style.cssText='margin:14px 0;';
        adminToggleRow.innerHTML=`
            <div><div style="font-family:var(--font-display); font-weight:800; font-size:13px;">⚡ ADMINISTRATOR</div><div class="mono" style="font-size:10px; color:var(--text-secondary);">Grants full access</div></div>
            <label class="toggle-switch"><input id="edit-admin-is-administrator" type="checkbox" ${admin.role==='administrator'?'checked':''}><span class="toggle-slider"></span></label>
        `;
        content.appendChild(adminToggleRow);
    } else if(isOwnerTarget){
        const locked = document.createElement('div');
        locked.className='admin-input-sm';
        locked.style.cssText='background:rgba(255,215,0,0.1); border-color:rgba(255,215,0,0.3); color:#ffd700; text-align:center; font-weight:700;';
        locked.textContent='👑 OWNER — Cannot be modified (Protected)';
        content.appendChild(locked);
    }

    // Permissions (if not owner and not administrator toggle on)
    if(!isOwnerTarget){
        const permsContainer = document.createElement('div');
        permsContainer.id='edit-perms-container';
        permsContainer.style.marginTop='14px';
        content.appendChild(permsContainer);

        const isAdminToggleOn = admin.role==='administrator';
        renderPermissionsCheckboxes(permsContainer, admin.permissions, isAdminToggleOn, isCurrentOwner, admin.role);

        // If owner, add listeners for toggle
        if(isCurrentOwner){
            const toggle = permsContainer.parentElement?.querySelector('#edit-admin-is-administrator') || content.querySelector('#edit-admin-is-administrator');
            if(toggle){
                toggle.addEventListener('change', ()=>{
                    const isOn = toggle.checked;
                    renderPermissionsCheckboxes(permsContainer, admin.permissions, isOn, isCurrentOwner, isOn?'administrator':'admin');
                });
            }
            const roleSelect = content.querySelector('#edit-admin-role');
            if(roleSelect){
                roleSelect.addEventListener('change', ()=>{
                    const isOn = roleSelect.value==='administrator';
                    const toggleCb = content.querySelector('#edit-admin-is-administrator');
                    if(toggleCb) toggleCb.checked = isOn;
                    renderPermissionsCheckboxes(permsContainer, admin.permissions, isOn, isCurrentOwner, roleSelect.value);
                });
            }
        }
    }

    // Eye toggle
    const eyeBtn = content.querySelector('#toggle-edit-pass');
    const passInput = content.querySelector('#edit-admin-password');
    if(eyeBtn && passInput){
        let visible=true;
        eyeBtn.addEventListener('click',()=>{
            playClick();
            visible=!visible;
            passInput.type = visible?'text':'password';
            eyeBtn.textContent = visible?'👁️':'🙈';
        });
    }

    DOM.editAdminTitle.textContent = `Edit — ${admin.displayName} ${getRoleEmoji(admin.role)}`;
    
    // Remove button visibility: owner cannot be removed, also check permission
    if(isOwnerTarget){
        DOM.editAdminRemove.style.display='none';
    } else {
        if(userCan('manage_admins') || isCurrentOwner){
            DOM.editAdminRemove.style.display='inline-flex';
        } else {
            DOM.editAdminRemove.style.display='none';
        }
    }

    DOM.editAdminModal.classList.remove('hidden');
}

async function handleEditAdminSave(){
    if(!editingAdminGmail) return;
    const admin = allAdmins.find(a=>a.gmail.toLowerCase()===editingAdminGmail.toLowerCase());
    if(!admin) return;

    if(admin.role==='owner'){
        alert('OWNER cannot be modified');
        return;
    }

    const newDisplayName = document.getElementById('edit-admin-displayname')?.value.trim() || admin.displayName;
    const newPasswordInput = document.getElementById('edit-admin-password');
    const newPassword = newPasswordInput ? newPasswordInput.value.trim() : null;
    const newRoleSelect = document.getElementById('edit-admin-role');
    const newRole = newRoleSelect ? newRoleSelect.value : admin.role;
    const isAdminToggle = document.getElementById('edit-admin-is-administrator')?.checked;

    // Only owner can change role to/from administrator
    if(newRole!==admin.role && currentAdmin?.role!=='owner'){
        alert('Only OWNER can change role to ADMINISTRATOR');
        return;
    }

    // Collect permissions if admin role
    let newPerms = admin.permissions;
    const permsContainer = document.getElementById('edit-perms-container');
    if(permsContainer){
        if(isAdminToggle){
            newPerms = {...getDefaultPermissions()};
        } else {
            const checks = permsContainer.querySelectorAll('input[type="checkbox"]');
            newPerms = {};
            checks.forEach(cb=>{ newPerms[cb.dataset.perm]=cb.checked; });
        }
    }

    try{
        DOM.editAdminSave.disabled=true;
        DOM.editAdminSave.textContent='SAVING...';
        const updates = {
            displayName: newDisplayName,
            role: isAdminToggle ? 'administrator' : newRole,
            permissions: newPerms
        };
        if(newPassword && currentAdmin?.role==='owner' && newPassword!=='••••••••'){
            updates.password = newPassword;
        }
        await updateAdmin(editingAdminGmail, updates);
        await logActivity('edited admin', `${editingAdminGmail} — role:${updates.role}`);
        DOM.editAdminModal.classList.add('hidden');
        editingAdminGmail=null;
    }catch(e){
        alert(e.message);
    }finally{
        DOM.editAdminSave.disabled=false;
        DOM.editAdminSave.textContent='SAVE CHANGES';
    }
}

// Activity
function renderActivity(){
    if(!DOM.activityList) return;
    const search = (DOM.activitySearch?.value||'').toLowerCase();
    const roleFilter = DOM.activityFilterRole?.value||'';
    let filtered = [...activityLogs];
    if(search){
        filtered = filtered.filter(l=> 
            l.displayName?.toLowerCase().includes(search) ||
            l.gmail?.toLowerCase().includes(search) ||
            l.action?.toLowerCase().includes(search) ||
            l.details?.toLowerCase().includes(search)
        );
    }
    if(roleFilter){
        filtered = filtered.filter(l=> l.role===roleFilter);
    }
    DOM.activityList.innerHTML='';
    if(filtered.length===0){
        DOM.activityList.innerHTML='<div class="mono" style="font-size:12px; color:var(--text-muted); padding:20px; text-align:center;">No activity matching filter</div>';
        return;
    }
    filtered.forEach(log=>{
        const div=document.createElement('div');
        div.className='activity-item';
        const time = new Date(log.timestamp).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'medium'});
        div.innerHTML=`
            <div style="display:flex; justify-content:space-between; gap:8px;">
                <span><span class="role-emoji">${getRoleEmoji(log.role)}</span><strong>${log.displayName}</strong> <span style="font-size:10px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:999px;">${log.role?.toUpperCase()||'ADMIN'}</span> → ${log.action}</span>
                <span class="activity-time">${time}</span>
            </div>
            ${log.details?`<div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">${log.details}</div>`:''}
            <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${log.gmail}</div>
        `;
        DOM.activityList.appendChild(div);
    });
}

// Theme
function renderThemeGrid(){
    if(!DOM.themeGrid) return;
    DOM.themeGrid.innerHTML='';
    Object.entries(THEMES).forEach(([key, theme])=>{
        const card=document.createElement('div');
        card.className='theme-card glass-panel';
        const isActive = (document.documentElement.getAttribute('data-theme')||'cyberpunk')===key;
        if(isActive) card.classList.add('active');
        const previewBg = `linear-gradient(135deg, ${theme.colors['--neon-secondary']||'#333'}, ${theme.colors['--neon-primary']||'#fff'})`;
        card.innerHTML=`
            <div class="theme-card-preview" style="background:${previewBg};">${theme.icon}</div>
            <div class="theme-card-name">${theme.name}</div>
            <div class="theme-card-desc">${theme.desc}</div>
            ${isActive?'<div style="margin-top:8px; font-size:10px; color:var(--neon-green);">✓ ACTIVE</div>':''}
        `;
        card.addEventListener('click', async ()=>{
            playClick();
            if(!userCan('change_theme')){ alert('No permission: change_theme'); return; }
            applyTheme(key);
            const mod = await import('./firebase.js');
            await mod.updateTheme(key);
            await logActivity('changed theme', `${theme.name} (${key})`);
            renderThemeGrid();
        });
        DOM.themeGrid.appendChild(card);
    });
}

// Init Auth Flow
async function initAuthFlow(){
    showGoogleScreen();

    // Listen to Firebase Auth state
    onAuthChange(async (user)=>{
        if(user){
            currentFirebaseUser = user;
            // Check if admin exists
            const admin = await getAdminByGmail(user.email);
            if(!admin){
                // Not authorized — show error and sign out
                DOM.authError.textContent = `⛔ ACCESS DENIED — ${user.email} is not authorized.`;
                DOM.authError.classList.add('show');
                setTimeout(async ()=>{
                    await signOutUser();
                    currentFirebaseUser=null;
                    showGoogleScreen();
                }, 2500);
                return;
            }
            currentAdmin = admin;
            showPasswordScreen(admin);
        } else {
            // No user
            currentFirebaseUser=null;
            // Check if there's stored session (mock mode)
            try{
                const sess = JSON.parse(localStorage.getItem('devdna_admin_session')||'null');
                if(sess && sess.gmail){
                    const admin = await getAdminByGmail(sess.gmail);
                    if(admin){
                        currentAdmin=admin;
                        showPasswordScreen(admin);
                        return;
                    }
                }
            }catch{}
            showGoogleScreen();
        }
    });

    // Button handlers
    DOM.googleBtn?.addEventListener('click', handleGoogleSignIn);
    DOM.passwordBtn?.addEventListener('click', handlePasswordAuth);
    DOM.passwordInput?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') handlePasswordAuth(); });
    DOM.backToGoogle?.addEventListener('click', async ()=>{
        playClick();
        await signOutUser();
        currentAdmin=null;
        currentFirebaseUser=null;
        showGoogleScreen();
    });
}

// Public API
export function openAdminPanel(){
    const sec = document.getElementById('admin-section');
    if(sec){ sec.style.display='flex'; sec.classList.add('active'); }
    initModalCloseHandlers(); // FIX 6: Ensure close buttons, ESC, overlay work
    initAuthFlow();
}

export function closeAdminPanel(){
    const sec = document.getElementById('admin-section');
    if(sec){ sec.style.display='none'; sec.classList.remove('active'); }
    // Unsubs
    if(questionsUnsub) questionsUnsub();
    if(adminsUnsub) adminsUnsub();
    if(leaderboardUnsub) leaderboardUnsub();
    if(activityUnsub) activityUnsub();
}

if(typeof window!=='undefined'){
    window.__DevDNA_Admin = { openAdminPanel, closeAdminPanel };
}
