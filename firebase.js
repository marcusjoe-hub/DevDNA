/**
 * DevDNA v3 - Firebase Integration + Google Auth + Roles + Questions + Activity Log + Themes
 * 
 * Firestore Structure:
 * 
 * /settings/main {
 *   eventLive: boolean,
 *   announcement: string,
 *   announcementVisible: boolean,
 *   theme: string ("cyberpunk" | "matrix" | "blood" | "ocean" | "sunset" | "monochrome"),
 *   updatedAt: number
 * }
 * 
 * /devdna_leaderboard/global { frontend, backend, fullstack, debugging, ai, total }
 * 
 * /admins/{gmail_sanitized} {
 *   gmail: string,
 *   displayName: string,
 *   password: string (plain text per spec Option A),
 *   role: "owner" | "administrator" | "admin",
 *   permissions: { 12 booleans },
 *   avatar: string (Google profile pic),
 *   createdAt: number,
 *   addedBy: string (gmail)
 * }
 * 
 * /questions/{question_id} { order, text, options: [{text, archetype}] }
 * /activity_log/{log_id} { timestamp, gmail, displayName, role, action, details }
 * 
 * Owner auto-seed: OWNER_GMAIL_PLACEHOLDER@gmail.com / OWNER_PASSWORD_PLACEHOLDER
 * Protected — recreates if deleted
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, getDocs, addDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// ============================================================================
// 🔧 REPLACE WITH YOUR OWN FIREBASE CONFIG
// ============================================================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// ============================================================================
// 👑 OWNER CONFIGURATION - REPLACE BEFORE GITHUB UPLOAD
// ============================================================================
export const OWNER_CONFIG = {
    gmail: "OWNER_GMAIL_PLACEHOLDER@gmail.com", // Replace with real owner Gmail
    displayName: "Marcus",
    password: "OWNER_PASSWORD_PLACEHOLDER", // Replace with real owner password
    role: "owner"
};
// ============================================================================

const isConfigured = !Object.values(firebaseConfig).some(v => typeof v === 'string' && v.includes('YOUR_'));

let db = null;
let auth = null;
let app = null;
let firebaseInitialized = false;

// Local fallback
const STORAGE_KEY_COUNTS = 'devdna_fallback_counts_v1';
const STORAGE_KEY_SETTINGS = 'devdna_fallback_settings_v1';
const STORAGE_KEY_ADMINS = 'devdna_fallback_admins_v1';
const STORAGE_KEY_QUESTIONS = 'devdna_fallback_questions_v1';
const STORAGE_KEY_ACTIVITY = 'devdna_fallback_activity_v1';

const defaultCounts = { frontend:0, backend:0, fullstack:0, debugging:0, ai:0, total:0 };
const defaultSettings = {
    eventLive: true,
    announcement: "🎉 Welcome to Tec Toc 2026!",
    announcementVisible: false,
    theme: "cyberpunk",
    updatedAt: Date.now()
};

const DEFAULT_PERMISSIONS = {
    event_control: true,
    change_banner: true,
    clear_submissions: true,
    download_data: true,
    edit_questions: true,
    add_questions: true,
    delete_questions: true,
    manage_admins: true,
    set_permissions: true,
    view_stats: true,
    change_theme: true,
    clear_activity_log: true
};

const PERMISSION_DEFS = [
    { id: 'event_control', name: '🎬 Event Control', desc: 'Start or close the event, locking/unlocking the quiz.' },
    { id: 'change_banner', name: '📢 Change Announcement Banner', desc: 'Update or hide the announcement banner shown on the main site.' },
    { id: 'clear_submissions', name: '🗑️ Clear Submissions', desc: 'Wipe all leaderboard data. Cannot be undone.' },
    { id: 'download_data', name: '💾 Download Leaderboard Data', desc: 'Export all leaderboard data as JSON file.' },
    { id: 'edit_questions', name: '✏️ Edit Questions', desc: 'Modify existing quiz questions and answer options in real-time.' },
    { id: 'add_questions', name: '➕ Add Questions', desc: 'Create brand new quiz questions.' },
    { id: 'delete_questions', name: '❌ Delete Questions', desc: 'Remove quiz questions permanently.' },
    { id: 'manage_admins', name: '👥 Manage Admins', desc: 'Add or remove other regular admins (not administrators).' },
    { id: 'set_permissions', name: '🔧 Set Permissions', desc: 'Change permissions for existing admins.' },
    { id: 'view_stats', name: '📊 View Stats', desc: 'Access to archetype statistics dashboard.' },
    { id: 'change_theme', name: '🎨 Change Site Theme', desc: 'Switch site color themes for all visitors.' },
    { id: 'clear_activity_log', name: '🧹 Clear Activity Log', desc: 'Wipe the entire activity log history.' }
];

// Local helpers
function getFallback(key, def){ try{ const raw=localStorage.getItem(key); if(raw){ const parsed=JSON.parse(raw); if(key===STORAGE_KEY_COUNTS && parsed.total===556 && parsed.frontend===127){ localStorage.setItem(key, JSON.stringify(defaultCounts)); return {...defaultCounts}; } return parsed; } localStorage.setItem(key, JSON.stringify(def)); return {...def}; }catch{ return {...def}; } }
function setFallback(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }
function getFallbackCounts(){ return getFallback(STORAGE_KEY_COUNTS, defaultCounts); }
function setFallbackCounts(c){ setFallback(STORAGE_KEY_COUNTS,c); triggerMockLeaderboard(); }
function getFallbackSettings(){ return getFallback(STORAGE_KEY_SETTINGS, defaultSettings); }
function setFallbackSettings(s){ setFallback(STORAGE_KEY_SETTINGS,s); triggerMockSettings(); }
function getFallbackAdmins(){ return getFallback(STORAGE_KEY_ADMINS, []); }
function setFallbackAdmins(a){ setFallback(STORAGE_KEY_ADMINS,a); triggerMockAdmins(); }
function getFallbackQuestions(){ return getFallback(STORAGE_KEY_QUESTIONS, []); }
function setFallbackQuestions(q){ setFallback(STORAGE_KEY_QUESTIONS,q); triggerMockQuestions(); }
function getFallbackActivity(){ return getFallback(STORAGE_KEY_ACTIVITY, []); }
function setFallbackActivity(a){ setFallback(STORAGE_KEY_ACTIVITY,a); triggerMockActivity(); }

let mockLeaderboardListeners=[], mockSettingsListeners=[], mockAdminsListeners=[], mockQuestionsListeners=[], mockActivityListeners=[];
function triggerMockLeaderboard(){ const c=getFallbackCounts(); mockLeaderboardListeners.forEach(cb=>{try{cb(c);}catch{}}); }
function triggerMockSettings(){ const s=getFallbackSettings(); mockSettingsListeners.forEach(cb=>{try{cb(s);}catch{}}); }
function triggerMockAdmins(){ const a=getFallbackAdmins(); mockAdminsListeners.forEach(cb=>{try{cb(a);}catch{}}); }
function triggerMockQuestions(){ const q=getFallbackQuestions(); mockQuestionsListeners.forEach(cb=>{try{cb(q);}catch{}}); }
function triggerMockActivity(){ const a=getFallbackActivity(); mockActivityListeners.forEach(cb=>{try{cb(a);}catch{}}); }

if(typeof window!=='undefined'){
    window.addEventListener('storage',(e)=>{
        if(e.key===STORAGE_KEY_COUNTS) triggerMockLeaderboard();
        if(e.key===STORAGE_KEY_SETTINGS) triggerMockSettings();
        if(e.key===STORAGE_KEY_ADMINS) triggerMockAdmins();
        if(e.key===STORAGE_KEY_QUESTIONS) triggerMockQuestions();
        if(e.key===STORAGE_KEY_ACTIVITY) triggerMockActivity();
    });
}

// Init Firebase
if(isConfigured){
    try{
        app=initializeApp(firebaseConfig);
        db=getFirestore(app);
        auth=getAuth(app);
        firebaseInitialized=true;
        console.log('[DevDNA] Firebase v3 initialized ✔');
    }catch(err){
        console.warn('[DevDNA] Firebase init failed, mock mode:',err);
        firebaseInitialized=false;
    }
}else{
    console.warn('[DevDNA] Firebase not configured — mock mode');
}

// Helpers
function sanitizeGmail(gmail){ return gmail.toLowerCase().replace(/[^a-z0-9]/g,'_'); }

// Ensure Owner exists (protected, recreates if deleted)
async function ensureOwnerExists(){
    if(!firebaseInitialized) {
        // mock: ensure owner in local
        const admins=getFallbackAdmins();
        const ownerSanitized=sanitizeGmail(OWNER_CONFIG.gmail);
        if(!admins.find(a=>sanitizeGmail(a.gmail)===ownerSanitized)){
            admins.push({
                gmail: OWNER_CONFIG.gmail,
                displayName: OWNER_CONFIG.displayName,
                password: OWNER_CONFIG.password,
                role: 'owner',
                permissions: {...DEFAULT_PERMISSIONS},
                avatar: "",
                createdAt: Date.now(),
                addedBy: "system"
            });
            setFallbackAdmins(admins);
            console.log('[DevDNA] Mock owner seeded');
        }
        return;
    }
    try{
        const ownerId=sanitizeGmail(OWNER_CONFIG.gmail);
        const ref=doc(db,'admins',ownerId);
        const snap=await getDoc(ref);
        if(!snap.exists()){
            await setDoc(ref,{
                gmail: OWNER_CONFIG.gmail,
                displayName: OWNER_CONFIG.displayName,
                password: OWNER_CONFIG.password,
                role: 'owner',
                permissions: {...DEFAULT_PERMISSIONS},
                avatar: "",
                createdAt: Date.now(),
                addedBy: "system"
            });
            console.log('[DevDNA] Owner auto-seeded:', OWNER_CONFIG.gmail);
        }
    }catch(e){ console.warn('[DevDNA] ensureOwnerExists failed',e); }
}

// Ensure docs
async function ensureDocs(){
    if(!firebaseInitialized) return;
    try{
        const lbRef=doc(db,'devdna_leaderboard','global');
        const lbSnap=await getDoc(lbRef);
        if(!lbSnap.exists()){
            await setDoc(lbRef,{...defaultCounts, total:0, updatedAt:Date.now()});
        }
        const settingsRef=doc(db,'settings','main');
        const settingsSnap=await getDoc(settingsRef);
        if(!settingsSnap.exists()){
            await setDoc(settingsRef,{...defaultSettings, updatedAt:Date.now()});
        }
        await ensureOwnerExists();
    }catch(e){ console.warn('[DevDNA] ensureDocs failed',e); }
}
if(firebaseInitialized) ensureDocs();

// ============================================================================
// LEADERBOARD
// ============================================================================
export async function incrementArchetype(key){
    const valid=['frontend','backend','fullstack','debugging','ai']; if(!valid.includes(key)) return;
    if(firebaseInitialized){
        try{
            const ref=doc(db,'devdna_leaderboard','global');
            await updateDoc(ref,{[key]:increment(1), total:increment(1), updatedAt:Date.now()});
        }catch{
            try{
                const ref=doc(db,'devdna_leaderboard','global');
                const snap=await getDoc(ref);
                if(!snap.exists()){
                    await setDoc(ref,{frontend:key==='frontend'?1:0, backend:key==='backend'?1:0, fullstack:key==='fullstack'?1:0, debugging:key==='debugging'?1:0, ai:key==='ai'?1:0, total:1, updatedAt:Date.now()});
                }else{ await updateDoc(ref,{[key]:increment(1), total:increment(1)}); }
            }catch{
                const c=getFallbackCounts(); c[key]=(c[key]||0)+1; c.total=(c.total||0)+1; setFallbackCounts(c);
            }
        }
    }else{
        const c=getFallbackCounts(); c[key]=(c[key]||0)+1; c.total=Object.keys(c).filter(k=>k!=='total').reduce((s,k)=>s+(c[k]||0),0); setFallbackCounts(c);
    }
}
export function subscribeToLeaderboard(cb){
    if(firebaseInitialized){
        const ref=doc(db,'devdna_leaderboard','global');
        return onSnapshot(ref,(snap)=>{
            if(snap.exists()){
                const d=snap.data();
                cb({frontend:d.frontend||0, backend:d.backend||0, fullstack:d.fullstack||0, debugging:d.debugging||0, ai:d.ai||0, total:d.total||0});
            }else cb(getFallbackCounts());
        },()=>cb(getFallbackCounts()));
    }else{
        mockLeaderboardListeners.push(cb);
        setTimeout(()=>cb(getFallbackCounts()),100);
        return ()=>{ mockLeaderboardListeners=mockLeaderboardListeners.filter(c=>c!==cb); };
    }
}
export async function clearAllSubmissions(){
    if(firebaseInitialized){
        const ref=doc(db,'devdna_leaderboard','global');
        await setDoc(ref,{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,total:0,updatedAt:Date.now()});
    }else{
        setFallbackCounts({frontend:0,backend:0,fullstack:0,debugging:0,ai:0,total:0});
    }
}
export async function getLeaderboardData(){
    if(firebaseInitialized){
        try{ const ref=doc(db,'devdna_leaderboard','global'); const snap=await getDoc(ref); if(snap.exists()) return snap.data(); return getFallbackCounts(); }catch{ return getFallbackCounts(); }
    }else return getFallbackCounts();
}

// ============================================================================
// SETTINGS & THEME
// ============================================================================
export function subscribeToSettings(cb){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        return onSnapshot(ref,(snap)=>{
            if(snap.exists()){
                const d=snap.data();
                cb({eventLive:d.eventLive??true, announcement:d.announcement??"", announcementVisible:d.announcementVisible??false, theme:d.theme||'cyberpunk'});
            }else cb({...defaultSettings});
        },()=>cb(getFallbackSettings()));
    }else{
        mockSettingsListeners.push(cb);
        setTimeout(()=>cb(getFallbackSettings()),100);
        return ()=>{ mockSettingsListeners=mockSettingsListeners.filter(c=>c!==cb); };
    }
}
export async function updateEventStatus(isLive){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        try{ await updateDoc(ref,{eventLive:isLive, updatedAt:Date.now()}); }catch{ await setDoc(ref,{...defaultSettings,eventLive:isLive,updatedAt:Date.now()},{merge:true}); }
        try{ await setDoc(doc(db,'settings','eventStatus'),{live:isLive},{merge:true}); }catch{}
    }else{
        const s=getFallbackSettings(); s.eventLive=isLive; setFallbackSettings(s);
    }
}
export async function updateAnnouncement(text,visible){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        try{ await updateDoc(ref,{announcement:text, announcementVisible:visible, updatedAt:Date.now()}); }catch{ await setDoc(ref,{...defaultSettings,announcement:text,announcementVisible:visible,updatedAt:Date.now()},{merge:true}); }
        try{ await setDoc(doc(db,'settings','announcement'),{text,visible},{merge:true}); }catch{}
    }else{
        const s=getFallbackSettings(); s.announcement=text; s.announcementVisible=visible; setFallbackSettings(s);
    }
}
export async function updateTheme(themeKey){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        try{ await updateDoc(ref,{theme:themeKey, updatedAt:Date.now()}); }catch{ await setDoc(ref,{...defaultSettings,theme:themeKey,updatedAt:Date.now()},{merge:true}); }
    }else{
        const s=getFallbackSettings(); s.theme=themeKey; setFallbackSettings(s);
    }
}

// ============================================================================
// AUTH
// ============================================================================
const googleProvider = typeof window!=='undefined' && firebaseInitialized ? new GoogleAuthProvider() : null;

export function getAuthInstance(){ return auth; }

export async function signInWithGoogle(){
    if(!firebaseInitialized || !auth || !googleProvider){
        // mock: simulate google sign in prompt
        const mockGmail = prompt('Mock Google Sign-In — Enter Gmail to simulate:','test@gmail.com');
        if(!mockGmail) throw new Error('Cancelled');
        return { user: { email: mockGmail, displayName: mockGmail.split('@')[0], photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(mockGmail)}&background=a855f7&color=fff` } };
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result;
}
export async function signOutUser(){
    if(firebaseInitialized && auth){
        try{ await signOut(auth); }catch{}
    }
    try{ localStorage.removeItem('devdna_admin_session'); }catch{}
}
export function onAuthChange(cb){
    if(firebaseInitialized && auth){
        return onAuthStateChanged(auth, cb);
    }else{
        // mock: immediately call with null
        setTimeout(()=>cb(null),0);
        return ()=>{};
    }
}

// ============================================================================
// ADMINS
// ============================================================================
export async function getAdminByGmail(gmail){
    const id=sanitizeGmail(gmail);
    if(firebaseInitialized){
        try{
            const ref=doc(db,'admins',id);
            const snap=await getDoc(ref);
            if(snap.exists()) return snap.data();
            return null;
        }catch{ return null; }
    }else{
        const admins=getFallbackAdmins();
        return admins.find(a=>sanitizeGmail(a.gmail)===id) || null;
    }
}
export async function getAllAdmins(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'admins');
            const snaps=await getDocs(col);
            const list=[];
            snaps.forEach(d=>list.push(d.data()));
            // ensure owner exists in list
            if(!list.find(a=>sanitizeGmail(a.gmail)===sanitizeGmail(OWNER_CONFIG.gmail))){
                await ensureOwnerExists();
                // retry
                const snap2=await getDocs(col);
                const list2=[]; snap2.forEach(d=>list2.push(d.data()));
                return list2;
            }
            return list;
        }catch{
            return getFallbackAdmins();
        }
    }else{
        return getFallbackAdmins();
    }
}
export function subscribeToAdmins(cb){
    if(firebaseInitialized){
        const col=collection(db,'admins');
        return onSnapshot(col,(snaps)=>{
            const list=[]; snaps.forEach(d=>list.push(d.data())); cb(list);
        },()=>cb(getFallbackAdmins()));
    }else{
        mockAdminsListeners.push(cb);
        setTimeout(()=>cb(getFallbackAdmins()),100);
        return ()=>{ mockAdminsListeners=mockAdminsListeners.filter(c=>c!==cb); };
    }
}
export async function createAdmin({gmail, displayName, password, role, permissions, avatar, addedBy}){
    const id=sanitizeGmail(gmail);
    // Prevent duplicate
    const existing=await getAdminByGmail(gmail);
    if(existing) throw new Error('Admin with this Gmail already exists');
    
    // Role validation: only owner can create administrator — enforced in UI, but double-check via addedBy role?
    // We allow here, UI enforces
    
    const data={
        gmail: gmail.toLowerCase(),
        displayName,
        password, // plain text per spec Option A
        role: role || 'admin',
        permissions: role==='owner' || role==='administrator' ? {...DEFAULT_PERMISSIONS} : (permissions||{...DEFAULT_PERMISSIONS}),
        avatar: avatar||"",
        createdAt: Date.now(),
        addedBy: addedBy||"unknown"
    };
    if(firebaseInitialized){
        await setDoc(doc(db,'admins',id), data);
    }else{
        const admins=getFallbackAdmins();
        admins.push(data);
        setFallbackAdmins(admins);
    }
    return data;
}
export async function updateAdmin(gmail, updates){
    const id=sanitizeGmail(gmail);
    // Prevent owner demotion/removal
    if(sanitizeGmail(gmail)===sanitizeGmail(OWNER_CONFIG.gmail)){
        if(updates.role && updates.role!=='owner'){
            throw new Error('OWNER cannot be demoted — EVER');
        }
    }
    if(firebaseInitialized){
        const ref=doc(db,'admins',id);
        await updateDoc(ref,{...updates, updatedAt:Date.now()});
    }else{
        const admins=getFallbackAdmins();
        const idx=admins.findIndex(a=>sanitizeGmail(a.gmail)===id);
        if(idx>=0){ admins[idx]={...admins[idx],...updates}; setFallbackAdmins(admins); }
    }
}
export async function deleteAdmin(gmail){
    const id=sanitizeGmail(gmail);
    if(sanitizeGmail(gmail)===sanitizeGmail(OWNER_CONFIG.gmail)){
        throw new Error('OWNER cannot be removed — EVER');
    }
    if(firebaseInitialized){
        await deleteDoc(doc(db,'admins',id));
    }else{
        const admins=getFallbackAdmins().filter(a=>sanitizeGmail(a.gmail)!==id);
        setFallbackAdmins(admins);
    }
}
export function getDefaultPermissions(){ return {...DEFAULT_PERMISSIONS}; }
export function getPermissionDefs(){ return [...PERMISSION_DEFS]; }

// ============================================================================
// QUESTIONS
// ============================================================================
export async function getQuestions(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'questions');
            const q=query(col, orderBy('order','asc'));
            const snaps=await getDocs(q);
            const list=[];
            snaps.forEach(d=>{ const data=d.data(); list.push({id:d.id, ...data}); });
            return list;
        }catch{ return getFallbackQuestions(); }
    }else{
        return getFallbackQuestions();
    }
}
export function subscribeToQuestions(cb){
    if(firebaseInitialized){
        const col=collection(db,'questions');
        const q=query(col, orderBy('order','asc'));
        return onSnapshot(q,(snaps)=>{
            const list=[]; snaps.forEach(d=>{ list.push({id:d.id, ...d.data()}); }); cb(list);
        },()=>cb(getFallbackQuestions()));
    }else{
        mockQuestionsListeners.push(cb);
        setTimeout(()=>cb(getFallbackQuestions()),100);
        return ()=>{ mockQuestionsListeners=mockQuestionsListeners.filter(c=>c!==cb); };
    }
}
export async function seedQuestionsIfEmpty(hardcoded){
    const existing=await getQuestions();
    if(existing.length>0) return existing;
    // seed
    console.log('[DevDNA] Seeding questions from hardcoded 12...');
    for(let i=0;i<hardcoded.length;i++){
        const q=hardcoded[i];
        await addQuestion({order:i+1, text:q.q, options:q.options.map(o=>({text:o.text, archetype:o.archetype}))});
    }
    return await getQuestions();
}
export async function addQuestion({order, text, options}){
    if(firebaseInitialized){
        const col=collection(db,'questions');
        const docRef=await addDoc(col,{order:order||Date.now(), text, options, createdAt:Date.now()});
        return docRef.id;
    }else{
        const list=getFallbackQuestions();
        const id='q_'+Date.now();
        list.push({id, order:order||list.length+1, text, options});
        setFallbackQuestions(list);
        return id;
    }
}
export async function updateQuestion(id, {order, text, options}){
    if(firebaseInitialized){
        const ref=doc(db,'questions',id);
        await updateDoc(ref,{order, text, options, updatedAt:Date.now()});
    }else{
        const list=getFallbackQuestions();
        const idx=list.findIndex(q=>q.id===id);
        if(idx>=0){ list[idx]={...list[idx], order, text, options}; setFallbackQuestions(list); }
    }
}
export async function deleteQuestion(id){
    if(firebaseInitialized){
        await deleteDoc(doc(db,'questions',id));
    }else{
        const list=getFallbackQuestions().filter(q=>q.id!==id);
        setFallbackQuestions(list);
    }
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================
export async function addActivityLog({gmail, displayName, role, action, details}){
    const entry={
        timestamp: Date.now(),
        gmail: gmail||'unknown',
        displayName: displayName||gmail||'unknown',
        role: role||'admin',
        action: action||'performed action',
        details: details||'',
        formatted: `[${new Date().toLocaleString()}] ${getRoleEmoji(role)} ${displayName||gmail} (${(role||'admin').toUpperCase()}) → ${action}${details?` — ${details}`:''}`
    };
    if(firebaseInitialized){
        try{ await addDoc(collection(db,'activity_log'), entry); }catch(e){ console.warn('activity log failed',e); }
    }else{
        const logs=getFallbackActivity();
        logs.unshift(entry);
        // keep max 500 in mock
        if(logs.length>500) logs.length=500;
        setFallbackActivity(logs);
    }
    return entry;
}
function getRoleEmoji(role){
    if(role==='owner') return '👑';
    if(role==='administrator') return '⚡';
    return '🛡️';
}
export function subscribeToActivityLog(cb){
    if(firebaseInitialized){
        const col=collection(db,'activity_log');
        const q=query(col, orderBy('timestamp','desc'), limit(200));
        return onSnapshot(q,(snaps)=>{
            const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()})); cb(list);
        },()=>cb(getFallbackActivity()));
    }else{
        mockActivityListeners.push(cb);
        setTimeout(()=>cb(getFallbackActivity()),100);
        return ()=>{ mockActivityListeners=mockActivityListeners.filter(c=>c!==cb); };
    }
}
export async function clearActivityLog(){
    if(firebaseInitialized){
        const col=collection(db,'activity_log');
        const snaps=await getDocs(col);
        const promises=[];
        snaps.forEach(d=>{ promises.push(deleteDoc(doc(db,'activity_log',d.id))); });
        await Promise.all(promises);
    }else{
        setFallbackActivity([]);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================
export function isFirebaseConfigured(){ return firebaseInitialized; }
export function getDefaultCounts(){ return {...defaultCounts}; }
export function getDefaultSettings(){ return {...defaultSettings}; }

if(typeof window!=='undefined'){
    window.__DevDNA_Firebase={
        isConfigured: firebaseInitialized,
        incrementArchetype,
        subscribeToLeaderboard,
        subscribeToSettings,
        updateEventStatus,
        updateAnnouncement,
        updateTheme,
        clearAllSubmissions,
        getAdminByGmail,
        getAllAdmins,
        createAdmin,
        updateAdmin,
        deleteAdmin,
        getQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        addActivityLog,
        subscribeToActivityLog,
        clearActivityLog,
        signInWithGoogle,
        signOutUser,
        sanitizeGmail
    };
}
