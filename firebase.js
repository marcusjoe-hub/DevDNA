/**
 * DevDNA v1.0 - Firebase Integration
 * Full v1.0 schema: settings, anonymous leaderboard, admins, questions, activity, users, leaderboard_history, chat
 * Owner: Marcus (OWNER_GMAIL_PLACEHOLDER)
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, getDocs, addDoc, deleteDoc, query, orderBy, limit, where, serverTimestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";

// ============================================================================
// Firebase Config
// ============================================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCUwsScuaiXdKX5IhMVsdpxquTrSv0Xks",
  authDomain: "devdna-47ffe.firebaseapp.com",
  projectId: "devdna-47ffe",
  storageBucket: "devdna-47ffe.firebasestorage.app",
  messagingSenderId: "507738623580",
  appId: "1:507738623580:web:9d023f5ca2b75f85bc6099",
  measurementId: "G-DX6F6MW85T"
};

export const OWNER_CONFIG = {
    gmail: "marcusjoe.k@gmail.com",
    displayName: "Marcus",
    password: "M@rcus$Owner#2026!ByteCraft9X",
    role: "owner"
};

const isConfigured = !Object.values(firebaseConfig).some(v => typeof v === 'string' && v.includes('YOUR_'));

let db=null, auth=null, app=null, firebaseInitialized=false;

// Local fallback keys
const STORAGE_KEY_COUNTS='devdna_fallback_counts_v1';
const STORAGE_KEY_SETTINGS='devdna_fallback_settings_v1';
const STORAGE_KEY_ADMINS='devdna_fallback_admins_v1';
const STORAGE_KEY_QUESTIONS='devdna_fallback_questions_v1';
const STORAGE_KEY_ACTIVITY='devdna_fallback_activity_v1';
const STORAGE_KEY_USERS='devdna_fallback_users_v1';
const STORAGE_KEY_HISTORY='devdna_fallback_history_v1';
const STORAGE_KEY_CHAT='devdna_fallback_chat_v1';

const defaultCounts = { frontend:0, backend:0, fullstack:0, debugging:0, ai:0, security:0, cloud:0, game:0, mobile:0, data:0, total:0 };
const defaultSettings = {
    eventLive: true,
    announcement: "🧬 DevDNA IS LIVE! Discover your Developer Archetype in 2 minutes. Scan your coding style, view the global leaderboard, and claim your shareable ID card! [ START ANALYSIS → ]",
    announcementVisible: true,
    theme: "cyberpunk",
    leaderboardAutoClearDays: 10,
    leaderboardFrozen: false,
    nextAutoClearAt: Date.now() + 10*24*60*60*1000,
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
    clear_activity_log: true,
    view_users: true,
    delete_users: true,
    ban_users: true,
    manage_leaderboard: true,
    view_leaderboard_history: true,
    view_chat: true,
    send_chat: true
};

const PERMISSION_DEFS = [
    { id: 'event_control', name: '🎬 Event Control', desc: 'Start or close the event, locking/unlocking the quiz.' },
    { id: 'change_banner', name: '📢 Change Announcement Banner', desc: 'Update or hide the announcement banner shown on the main site.' },
    { id: 'clear_submissions', name: '🗑️ Clear Anonymous Stats', desc: 'Wipe the anonymous archetype counter. Cannot be undone.' },
    { id: 'download_data', name: '💾 Download Leaderboard Data', desc: 'Export all leaderboard data as JSON file.' },
    { id: 'edit_questions', name: '✏️ Edit Questions', desc: 'Modify existing quiz questions and answer options in real-time.' },
    { id: 'add_questions', name: '➕ Add Questions', desc: 'Create brand new quiz questions.' },
    { id: 'delete_questions', name: '❌ Delete Questions', desc: 'Remove quiz questions permanently.' },
    { id: 'manage_admins', name: '👥 Manage Admins', desc: 'Add or remove other regular admins. Cannot touch equal/higher ranks.' },
    { id: 'set_permissions', name: '🔧 Set Permissions', desc: 'Change permissions for existing admins.' },
    { id: 'view_stats', name: '📊 View Stats', desc: 'Access to archetype statistics dashboard.' },
    { id: 'change_theme', name: '🎨 Change Site Theme', desc: 'Switch site color themes for all visitors.' },
    { id: 'clear_activity_log', name: '🧹 Clear Activity Log', desc: 'Wipe the entire activity log history.' },
    { id: 'view_users', name: '👤 View Users', desc: 'View all registered users and their stats.' },
    { id: 'delete_users', name: '🗑️ Delete Users', desc: 'Remove specific users from the system.' },
    { id: 'ban_users', name: '🚫 Ban Users', desc: 'Prevent specific Gmails from playing/appearing on leaderboard.' },
    { id: 'manage_leaderboard', name: '🏆 Manage Leaderboard', desc: 'Configure auto-clear interval, freeze, feature users.' },
    { id: 'view_leaderboard_history', name: '📜 View Leaderboard History', desc: 'See past leaderboard snapshots. Owner+Administrator only automatically.' },
    { id: 'view_chat', name: '💬 View Admin Chat', desc: 'Can see the admin chat tab and read messages.' },
    { id: 'send_chat', name: '✍️ Send Chat Messages', desc: 'Can send messages in admin chat. Requires view_chat.' }
];

// Fallback helpers
function getFallback(key, def){
    try{
        const raw=localStorage.getItem(key);
        if(raw){
            const parsed=JSON.parse(raw);
            if(key===STORAGE_KEY_COUNTS && parsed.total===556){ localStorage.setItem(key, JSON.stringify(defaultCounts)); return {...defaultCounts}; }
            return parsed;
        }
        localStorage.setItem(key, JSON.stringify(def));
        return Array.isArray(def) ? [...def] : {...def};
    }catch{ return Array.isArray(def) ? [...def] : {...def}; }
}
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
function getFallbackUsers(){ return getFallback(STORAGE_KEY_USERS, []); }
function setFallbackUsers(u){ setFallback(STORAGE_KEY_USERS,u); triggerMockUsers(); }
function getFallbackHistory(){ return getFallback(STORAGE_KEY_HISTORY, []); }
function setFallbackHistory(h){ setFallback(STORAGE_KEY_HISTORY,h); triggerMockHistory(); }

let mockLeaderboardListeners=[], mockSettingsListeners=[], mockAdminsListeners=[], mockQuestionsListeners=[], mockActivityListeners=[], mockUsersListeners=[], mockHistoryListeners=[], mockChatListeners=[];

function triggerMockLeaderboard(){ const c=getFallbackCounts(); mockLeaderboardListeners.forEach(cb=>{try{cb(c);}catch{}}); }
function triggerMockSettings(){ const s=getFallbackSettings(); mockSettingsListeners.forEach(cb=>{try{cb(s);}catch{}}); }
function triggerMockAdmins(){ const a=getFallbackAdmins(); mockAdminsListeners.forEach(cb=>{try{cb(a);}catch{}}); }
function triggerMockQuestions(){ const q=getFallbackQuestions(); mockQuestionsListeners.forEach(cb=>{try{cb(q);}catch{}}); }
function triggerMockActivity(){ const a=getFallbackActivity(); mockActivityListeners.forEach(cb=>{try{cb(a);}catch{}}); }
function triggerMockUsers(){ const u=getFallbackUsers(); mockUsersListeners.forEach(cb=>{try{cb(u);}catch{}}); }
function triggerMockHistory(){ const h=getFallbackHistory(); mockHistoryListeners.forEach(cb=>{try{cb(h);}catch{}}); }
function triggerMockChat(){ /* generic */ mockChatListeners.forEach(cb=>{try{cb();}catch{}}); }

if(typeof window!=='undefined'){
    window.addEventListener('storage',(e)=>{
        if(e.key===STORAGE_KEY_COUNTS) triggerMockLeaderboard();
        if(e.key===STORAGE_KEY_SETTINGS) triggerMockSettings();
        if(e.key===STORAGE_KEY_ADMINS) triggerMockAdmins();
        if(e.key===STORAGE_KEY_QUESTIONS) triggerMockQuestions();
        if(e.key===STORAGE_KEY_ACTIVITY) triggerMockActivity();
        if(e.key===STORAGE_KEY_USERS) triggerMockUsers();
        if(e.key===STORAGE_KEY_HISTORY) triggerMockHistory();
    });
}

// Init
if(isConfigured){
    try{
        app=initializeApp(firebaseConfig);
        db=getFirestore(app);
        auth=getAuth(app);
        // Persist forever for users and admins
        setPersistence(auth, browserLocalPersistence).catch(()=>{});
        firebaseInitialized=true;
        console.log('[DevDNA v1.0] Firebase initialized ✔');
    }catch(err){
        console.warn('[DevDNA v1.0] Firebase init failed, mock mode:',err);
        firebaseInitialized=false;
    }
}else{
    console.warn('[DevDNA v1.0] Firebase not configured — mock mode');
}

// Helpers
export function sanitizeGmail(gmail) {
    return gmail.toLowerCase().replace(/@/g, '_at_').replace(/\./g, '_dot_');
}
function sanitizeGmailOld(gmail){ return gmail.toLowerCase().replace(/[^a-z0-9]/g,'_'); }

// Owner auto-seed with duplicate prevention
async function ensureOwnerExists(){
    const currentId = sanitizeGmail(OWNER_CONFIG.gmail);
    const ownerGmailLower = OWNER_CONFIG.gmail.toLowerCase();
    if(!firebaseInitialized){
        let admins = getFallbackAdmins();
        const matching = admins.filter(a=>a.role==='owner' && a.gmail.toLowerCase()===ownerGmailLower);
        if(matching.length===0){
            admins.push({gmail: OWNER_CONFIG.gmail, displayName: OWNER_CONFIG.displayName, password: OWNER_CONFIG.password, role:'owner', permissions:{...DEFAULT_PERMISSIONS}, avatar:"", createdAt:Date.now(), addedBy:"system", displayAsOwner:false});
            setFallbackAdmins(admins);
            console.log('[DevDNA v1.0] Mock owner seeded');
        } else if(matching.length>1 || !matching.find(a=>sanitizeGmail(a.gmail)===currentId)){
            const toKeep = matching.find(a=>sanitizeGmail(a.gmail)===currentId) || matching[0];
            const filtered = admins.filter(a=> !(a.role==='owner' && a.gmail.toLowerCase()===ownerGmailLower));
            filtered.push({gmail: OWNER_CONFIG.gmail, displayName: toKeep.displayName||OWNER_CONFIG.displayName, password: toKeep.password||OWNER_CONFIG.password, role:'owner', permissions:{...DEFAULT_PERMISSIONS}, avatar:toKeep.avatar||"", createdAt:toKeep.createdAt||Date.now(), addedBy:toKeep.addedBy||"system", displayAsOwner:false});
            setFallbackAdmins(filtered);
            console.log('[DevDNA v1.0] Mock owner duplicates cleaned');
        }
        return;
    }
    try{
        const col=collection(db,'admins');
        const snaps=await getDocs(col);
        const owners=[];
        snaps.forEach(d=>{ const data=d.data(); if(data.role==='owner' && data.gmail && data.gmail.toLowerCase()===ownerGmailLower) owners.push({id:d.id, data}); });
        if(owners.length===0){
            await setDoc(doc(db,'admins',currentId),{gmail:OWNER_CONFIG.gmail, displayName:OWNER_CONFIG.displayName, password:OWNER_CONFIG.password, role:'owner', permissions:{...DEFAULT_PERMISSIONS}, avatar:"", createdAt:Date.now(), addedBy:"system", displayAsOwner:false});
            console.log('[DevDNA v1.0] Owner auto-seeded:', OWNER_CONFIG.gmail);
        } else {
            const hasCurrent = owners.find(o=>o.id===currentId);
            if(owners.length===1 && hasCurrent) return;
            if(hasCurrent){
                for(const o of owners.filter(o=>o.id!==currentId)){
                    await deleteDoc(doc(db,'admins',o.id));
                    console.log('[DevDNA v1.0] Deleted duplicate owner:', o.id);
                }
            } else {
                for(const o of owners){ await deleteDoc(doc(db,'admins',o.id)); }
                const first=owners[0]?.data;
                await setDoc(doc(db,'admins',currentId),{gmail:OWNER_CONFIG.gmail, displayName:first?.displayName||OWNER_CONFIG.displayName, password:first?.password||OWNER_CONFIG.password, role:'owner', permissions:{...DEFAULT_PERMISSIONS}, avatar:first?.avatar||"", createdAt:first?.createdAt||Date.now(), addedBy:first?.addedBy||"system", displayAsOwner:false});
                console.log('[DevDNA v1.0] Owner recreated with current format:', currentId);
            }
        }
    }catch(e){ console.warn('[DevDNA v1.0] ensureOwnerExists failed',e); }
}

async function ensureDocs(){
    if(!firebaseInitialized) return;
    try{
        const lbRef=doc(db,'devdna_leaderboard','global');
        const lbSnap=await getDoc(lbRef);
        if(!lbSnap.exists()) await setDoc(lbRef,{...defaultCounts, total:0, updatedAt:Date.now()});
        else {
            const data=lbSnap.data();
            // Add missing 5 archetypes if old doc has only 5
            const missing={};
            ['security','cloud','game','mobile','data'].forEach(k=>{ if(data[k]===undefined) missing[k]=0; });
            if(Object.keys(missing).length>0) await updateDoc(lbRef, missing);
        }
        const settingsRef=doc(db,'settings','main');
        const settingsSnap=await getDoc(settingsRef);
        if(!settingsSnap.exists()){
            await setDoc(settingsRef,{...defaultSettings, updatedAt:Date.now()});
        } else {
            const d=settingsSnap.data();
            const updates={};
            if(d.leaderboardAutoClearDays===undefined) updates.leaderboardAutoClearDays=10;
            if(d.leaderboardFrozen===undefined) updates.leaderboardFrozen=false;
            if(d.nextAutoClearAt===undefined) updates.nextAutoClearAt=Date.now()+10*24*60*60*1000;
            if(d.theme===undefined) updates.theme='cyberpunk';
            if(d.announcement===undefined) updates.announcement=defaultSettings.announcement;
            if(Object.keys(updates).length>0) await updateDoc(settingsRef, {...updates, updatedAt:Date.now()});
        }
        // Seed default chat channels if empty
        const chatCol=collection(db,'chat_channels');
        const chatSnaps=await getDocs(chatCol);
        if(chatSnaps.empty){
            await setDoc(doc(db,'chat_channels','general'),{name:'general', description:'Everyone chats', restrictedToAdministrator:false, createdAt:Date.now(), createdBy:'system'});
            await setDoc(doc(db,'chat_channels','announcements'),{name:'announcements', description:'Only OWNER and ADMINISTRATOR can post', restrictedToAdministrator:true, createdAt:Date.now(), createdBy:'system'});
            await setDoc(doc(db,'chat_channels','dev-talk'),{name:'dev-talk', description:'Regular dev talk', restrictedToAdministrator:false, createdAt:Date.now(), createdBy:'system'});
            console.log('[DevDNA v1.0] Default chat channels seeded');
        }
        await ensureOwnerExists();
    }catch(e){ console.warn('[DevDNA v1.0] ensureDocs failed',e); }
}
if(firebaseInitialized) ensureDocs();
else ensureOwnerExists(); // FIX 1 & 2: Ensure owner exists even in mock mode so Admins tab and chat members not empty

// LEADERBOARD (anonymous)
export async function incrementArchetype(key){
    const valid=['frontend','backend','fullstack','debugging','ai','security','cloud','game','mobile','data']; if(!valid.includes(key)) return;
    if(firebaseInitialized){
        try{
            const ref=doc(db,'devdna_leaderboard','global');
            await updateDoc(ref,{[key]:increment(1), total:increment(1), updatedAt:Date.now()});
        }catch{
            try{
                const ref=doc(db,'devdna_leaderboard','global');
                const snap=await getDoc(ref);
                if(!snap.exists()){
                    const init={frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0,total:1,updatedAt:Date.now()};
                    init[key]=1;
                    await setDoc(ref,init);
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
                cb({frontend:d.frontend||0, backend:d.backend||0, fullstack:d.fullstack||0, debugging:d.debugging||0, ai:d.ai||0, security:d.security||0, cloud:d.cloud||0, game:d.game||0, mobile:d.mobile||0, data:d.data||0, total:d.total||0});
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
        await setDoc(ref,{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0,total:0,updatedAt:Date.now()});
    }else{
        setFallbackCounts({frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0,total:0});
    }
}
export async function getLeaderboardData(){
    if(firebaseInitialized){
        try{ const ref=doc(db,'devdna_leaderboard','global'); const snap=await getDoc(ref); if(snap.exists()) return snap.data(); return getFallbackCounts(); }catch{ return getFallbackCounts(); }
    }else return getFallbackCounts();
}

// SETTINGS
export function subscribeToSettings(cb){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        return onSnapshot(ref,(snap)=>{
            if(snap.exists()){
                const d=snap.data();
                cb({eventLive:d.eventLive??true, announcement:d.announcement??"", announcementVisible:d.announcementVisible??false, theme:d.theme||'cyberpunk', leaderboardAutoClearDays:d.leaderboardAutoClearDays??10, leaderboardFrozen:d.leaderboardFrozen??false, nextAutoClearAt:d.nextAutoClearAt||Date.now()+10*24*60*60*1000});
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
    }else{ const s=getFallbackSettings(); s.eventLive=isLive; setFallbackSettings(s); }
}
export async function updateAnnouncement(text,visible){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        try{ await updateDoc(ref,{announcement:text, announcementVisible:visible, updatedAt:Date.now()}); }catch{ await setDoc(ref,{...defaultSettings,announcement:text,announcementVisible:visible,updatedAt:Date.now()},{merge:true}); }
    }else{ const s=getFallbackSettings(); s.announcement=text; s.announcementVisible=visible; setFallbackSettings(s); }
}
export async function updateTheme(themeKey){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        try{ await updateDoc(ref,{theme:themeKey, updatedAt:Date.now()}); }catch{ await setDoc(ref,{...defaultSettings,theme:themeKey,updatedAt:Date.now()},{merge:true}); }
    }else{ const s=getFallbackSettings(); s.theme=themeKey; setFallbackSettings(s); }
}
export async function updateLeaderboardSettings({autoClearDays, frozen, nextClearAt}){
    if(firebaseInitialized){
        const ref=doc(db,'settings','main');
        const updates={updatedAt:Date.now()};
        if(autoClearDays!==undefined) updates.leaderboardAutoClearDays=autoClearDays;
        if(frozen!==undefined) updates.leaderboardFrozen=frozen;
        if(nextClearAt!==undefined) updates.nextAutoClearAt=nextClearAt;
        try{ await updateDoc(ref,updates); }catch{ await setDoc(ref,{...defaultSettings,...updates},{merge:true}); }
    }else{
        const s=getFallbackSettings();
        if(autoClearDays!==undefined) s.leaderboardAutoClearDays=autoClearDays;
        if(frozen!==undefined) s.leaderboardFrozen=frozen;
        if(nextClearAt!==undefined) s.nextAutoClearAt=nextClearAt;
        setFallbackSettings(s);
    }
}

// AUTH
const googleProvider = typeof window!=='undefined' && firebaseInitialized ? new GoogleAuthProvider() : null;
export function getAuthInstance(){ return auth; }
export async function signInWithGoogle(){
    if(!firebaseInitialized || !auth || !googleProvider){
        const mockGmail = prompt('Mock Google Sign-In — Enter Gmail to simulate:','test@gmail.com');
        if(!mockGmail) throw new Error('Cancelled');
        return { user: { email: mockGmail, displayName: mockGmail.split('@')[0], photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(mockGmail)}&background=a855f7&color=fff` } };
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result;
}
export async function signOutUser(){
    if(firebaseInitialized && auth){ try{ await signOut(auth); }catch{} }
    try{ localStorage.removeItem('devdna_admin_session'); localStorage.removeItem('devdna_user_session'); }catch{}
}
export function onAuthChange(cb){
    if(firebaseInitialized && auth){ return onAuthStateChanged(auth, cb); }
    else{ setTimeout(()=>cb(null),0); return ()=>{}; }
}

// ADMINS
export async function getAdminByGmail(gmail){
    const id=sanitizeGmail(gmail);
    if(firebaseInitialized){
        try{ const ref=doc(db,'admins',id); const snap=await getDoc(ref); if(snap.exists()) return snap.data(); return null; }catch{ return null; }
    }else{ const admins=getFallbackAdmins(); return admins.find(a=>sanitizeGmail(a.gmail)===id) || null; }
}
export async function getAllAdmins(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'admins');
            const snaps=await getDocs(col);
            const list=[]; snaps.forEach(d=>list.push(d.data()));
            if(!list.find(a=>sanitizeGmail(a.gmail)===sanitizeGmail(OWNER_CONFIG.gmail))){
                await ensureOwnerExists();
                const snap2=await getDocs(col);
                const list2=[]; snap2.forEach(d=>list2.push(d.data()));
                return list2;
            }
            return list;
        }catch{ return getFallbackAdmins(); }
    }else{ return getFallbackAdmins(); }
}
export function subscribeToAdmins(cb){
    if(firebaseInitialized){
        const col=collection(db,'admins');
        return onSnapshot(col,(snaps)=>{ const list=[]; snaps.forEach(d=>list.push(d.data())); cb(list); },()=>cb(getFallbackAdmins()));
    }else{
        mockAdminsListeners.push(cb);
        setTimeout(()=>cb(getFallbackAdmins()),100);
        return ()=>{ mockAdminsListeners=mockAdminsListeners.filter(c=>c!==cb); };
    }
}
export async function createAdmin({gmail, displayName, password, role, permissions, avatar, addedBy, displayAsOwner}){
    const id=sanitizeGmail(gmail);
    const existing=await getAdminByGmail(gmail);
    if(existing) throw new Error('Admin with this Gmail already exists');
    const data={gmail:gmail.toLowerCase(), displayName, password, role:role||'admin', permissions:role==='owner'||role==='administrator'?{...DEFAULT_PERMISSIONS}:(permissions||{...DEFAULT_PERMISSIONS}), avatar:avatar||"", createdAt:Date.now(), addedBy:addedBy||"unknown", displayAsOwner:displayAsOwner||false};
    if(firebaseInitialized){ await setDoc(doc(db,'admins',id), data); }else{ const admins=getFallbackAdmins(); admins.push(data); setFallbackAdmins(admins); }
    return data;
}
export async function updateAdmin(gmail, updates){
    const id=sanitizeGmail(gmail);
    if(sanitizeGmail(gmail)===sanitizeGmail(OWNER_CONFIG.gmail)){ if(updates.role && updates.role!=='owner') throw new Error('OWNER cannot be demoted — EVER'); }
    if(firebaseInitialized){ const ref=doc(db,'admins',id); await updateDoc(ref,{...updates, updatedAt:Date.now()}); }
    else{ const admins=getFallbackAdmins(); const idx=admins.findIndex(a=>sanitizeGmail(a.gmail)===id); if(idx>=0){ admins[idx]={...admins[idx],...updates}; setFallbackAdmins(admins); } }
}
export async function deleteAdmin(gmail){
    const id=sanitizeGmail(gmail);
    if(sanitizeGmail(gmail)===sanitizeGmail(OWNER_CONFIG.gmail)) throw new Error('OWNER cannot be removed — EVER');
    if(firebaseInitialized){ await deleteDoc(doc(db,'admins',id)); }
    else{ const admins=getFallbackAdmins().filter(a=>sanitizeGmail(a.gmail)!==id); setFallbackAdmins(admins); }
}
export function getDefaultPermissions(){ return {...DEFAULT_PERMISSIONS}; }
export function getPermissionDefs(){ return [...PERMISSION_DEFS]; }

// QUESTIONS
export async function getQuestions(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'questions');
            const q=query(col, orderBy('order','asc'));
            const snaps=await getDocs(q);
            const list=[]; snaps.forEach(d=>{ const data=d.data(); list.push({id:d.id, ...data}); });
            return list;
        }catch{ return getFallbackQuestions(); }
    }else{ return getFallbackQuestions(); }
}
export function subscribeToQuestions(cb){
    if(firebaseInitialized){
        const col=collection(db,'questions');
        const q=query(col, orderBy('order','asc'));
        return onSnapshot(q,(snaps)=>{ const list=[]; snaps.forEach(d=>{ list.push({id:d.id, ...d.data()}); }); cb(list); },()=>cb(getFallbackQuestions()));
    }else{
        mockQuestionsListeners.push(cb);
        setTimeout(()=>cb(getFallbackQuestions()),100);
        return ()=>{ mockQuestionsListeners=mockQuestionsListeners.filter(c=>c!==cb); };
    }
}
export async function seedQuestionsIfEmpty(hardcoded){
    const existing=await getQuestions();
    if(existing.length>=40) return existing;
    // If we have some but less than 40, seed missing from hardcoded 40 pool (provided in window.__DevDNA_40_POOL or hardcoded param)
    console.log(`[DevDNA v1.0] Seeding questions — existing ${existing.length}, need 40`);
    // Use passed hardcoded (should be 40 pool) — seed all that don't exist by order
    const existingOrders=new Set(existing.map(q=>q.order));
    for(let i=0;i<hardcoded.length;i++){
        const q=hardcoded[i];
        const order = q.order || i+1;
        if(!existingOrders.has(order)){
            await addQuestion({order, text:q.q||q.text, options:q.options.map(o=>({text:o.text, archetype:o.archetype}))});
        }
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
    if(firebaseInitialized){ await deleteDoc(doc(db,'questions',id)); }
    else{ const list=getFallbackQuestions().filter(q=>q.id!==id); setFallbackQuestions(list); }
}

// USERS v1.0
export async function getUserByGmail(gmail){
    const id=sanitizeGmail(gmail);
    if(firebaseInitialized){
        try{ const ref=doc(db,'users',id); const snap=await getDoc(ref); if(snap.exists()) return snap.data(); return null; }catch{ return null; }
    }else{
        const users=getFallbackUsers();
        return users.find(u=>sanitizeGmail(u.gmail)===id) || null;
    }
}
export async function createOrUpdateUser({gmail, displayName, avatar}){
    const id=sanitizeGmail(gmail);
    const now=Date.now();
    if(firebaseInitialized){
        try{
            const ref=doc(db,'users',id);
            const snap=await getDoc(ref);
            if(snap.exists()){
                const existing=snap.data();
                await updateDoc(ref,{displayName, avatar, lastLogin:now, lastSeen:now, updatedAt:now});
                return {...existing, displayName, avatar, lastLogin:now};
            } else {
                const newUser={
                    gmail: gmail.toLowerCase(),
                    displayName, avatar:avatar||"",
                    createdAt:now, lastLogin:now, firstPlayed:null, lastPlayed:null,
                    totalQuizzes:0,
                    archetypeCounts:{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0},
                    archetypeHistory:[],
                    mostFrequentArchetype:null,
                    isBanned:false, isFeatured:false,
                    lastSeen:now, updatedAt:now
                };
                await setDoc(ref,newUser);
                return newUser;
            }
        }catch(e){ console.warn('[DevDNA v1.0] createOrUpdateUser failed',e); return null; }
    }else{
        let users=getFallbackUsers();
        let user=users.find(u=>sanitizeGmail(u.gmail)===id);
        if(user){
            user.displayName=displayName; user.avatar=avatar; user.lastLogin=now; user.lastSeen=now;
            setFallbackUsers(users);
            return user;
        } else {
            const newUser={gmail:gmail.toLowerCase(), displayName, avatar:avatar||"", createdAt:now, lastLogin:now, firstPlayed:null, lastPlayed:null, totalQuizzes:0, archetypeCounts:{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0}, archetypeHistory:[], mostFrequentArchetype:null, isBanned:false, isFeatured:false, lastSeen:now};
            users.push(newUser);
            setFallbackUsers(users);
            return newUser;
        }
    }
}
export async function updateUserStats(gmail, {archetype, breakdown}){
    const id=sanitizeGmail(gmail);
    const now=Date.now();
    if(firebaseInitialized){
        try{
            const ref=doc(db,'users',id);
            const snap=await getDoc(ref);
            if(!snap.exists()) return null;
            const user=snap.data();
            // Check frozen
            const settingsSnap=await getDoc(doc(db,'settings','main'));
            const settings=settingsSnap.exists()?settingsSnap.data():{};
            if(settings.leaderboardFrozen) { console.log('[DevDNA v1.0] Leaderboard frozen, not updating user stats'); return user; }
            if(user.isBanned){ console.log('[DevDNA v1.0] User banned, not updating'); return user; }

            const newCounts={...user.archetypeCounts};
            newCounts[archetype]=(newCounts[archetype]||0)+1;
            const newHistory=[... (user.archetypeHistory||[])];
            newHistory.unshift({archetype, timestamp:now, breakdown});
            if(newHistory.length>100) newHistory.length=100; // keep last 100

            // Most frequent
            let mostFreq=user.mostFrequentArchetype;
            let max=0;
            Object.entries(newCounts).forEach(([k,v])=>{ if(v>max){max=v; mostFreq=k;} });

            await updateDoc(ref,{
                archetypeCounts:newCounts,
                archetypeHistory:newHistory,
                mostFrequentArchetype:mostFreq,
                totalQuizzes:(user.totalQuizzes||0)+1,
                lastPlayed:now,
                firstPlayed:user.firstPlayed||now,
                lastSeen:now,
                updatedAt:now
            });
            return {...user, archetypeCounts:newCounts, archetypeHistory:newHistory, mostFrequentArchetype:mostFreq, totalQuizzes:(user.totalQuizzes||0)+1};
        }catch(e){ console.warn('updateUserStats failed',e); return null; }
    }else{
        let users=getFallbackUsers();
        let user=users.find(u=>sanitizeGmail(u.gmail)===id);
        if(!user) return null;
        if(user.isBanned) return user;
        user.archetypeCounts[archetype]=(user.archetypeCounts[archetype]||0)+1;
        user.archetypeHistory.unshift({archetype, timestamp:now, breakdown});
        if(user.archetypeHistory.length>100) user.archetypeHistory.length=100;
        user.totalQuizzes=(user.totalQuizzes||0)+1;
        user.lastPlayed=now;
        user.firstPlayed=user.firstPlayed||now;
        user.lastSeen=now;
        let most=user.mostFrequentArchetype; let max=0;
        Object.entries(user.archetypeCounts).forEach(([k,v])=>{ if(v>max){max=v; most=k;} });
        user.mostFrequentArchetype=most;
        setFallbackUsers(users);
        return user;
    }
}
export async function getAllUsers(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'users');
            const snaps=await getDocs(col);
            const list=[]; snaps.forEach(d=>list.push(d.data()));
            return list;
        }catch{ return getFallbackUsers(); }
    }else return getFallbackUsers();
}
export function subscribeToUsers(cb){
    if(firebaseInitialized){
        const col=collection(db,'users');
        return onSnapshot(col,(snaps)=>{ const list=[]; snaps.forEach(d=>list.push(d.data())); cb(list); },()=>cb(getFallbackUsers()));
    }else{
        mockUsersListeners.push(cb);
        setTimeout(()=>cb(getFallbackUsers()),100);
        return ()=>{ mockUsersListeners=mockUsersListeners.filter(c=>c!==cb); };
    }
}
export async function deleteUser(gmail){
    const id=sanitizeGmail(gmail);
    const lowerTarget=gmail.toLowerCase();
    // FIX 5: Nobody can delete themselves, OWNER, or ADMINISTRATORS unless OWNER
    try{
        const currentEmail = auth?.currentUser?.email?.toLowerCase() || null;
        if(currentEmail && lowerTarget===currentEmail) throw new Error('You cannot delete yourself');
        if(lowerTarget===OWNER_CONFIG.gmail.toLowerCase()) throw new Error('Cannot modify the OWNER');
        // Check if target is admin with role administrator
        const adminDoc = await getAdminByGmail(gmail).catch(()=>null);
        if(adminDoc){
            if(adminDoc.role==='administrator' && currentEmail!==OWNER_CONFIG.gmail.toLowerCase()){
                throw new Error('Only OWNER can modify Administrators');
            }
            // Regular admins cannot delete other admins unless OWNER/ADMINISTRATOR
            // This check will be enforced in UI, but extra guard: if target is admin and current is regular admin, block
            // We need to get current admin role
            if(currentEmail){
                const currentAdminDoc = await getAdminByGmail(currentEmail).catch(()=>null);
                if(currentAdminDoc && currentAdminDoc.role==='admin' && adminDoc.role!=='admin'){
                    throw new Error('Regular admins cannot delete other admins of higher rank');
                }
            }
        }
    }catch(e){
        if(e.message.includes('Cannot') || e.message.includes('You cannot') || e.message.includes('Only OWNER')){
            throw e;
        }
        // If check fails due to no auth, continue (UI will have blocked)
    }
    if(firebaseInitialized){ await deleteDoc(doc(db,'users',id)); }
    else{ const users=getFallbackUsers().filter(u=>sanitizeGmail(u.gmail)!==id); setFallbackUsers(users); }
}
export async function banUser(gmail, banned=true){
    const id=sanitizeGmail(gmail);
    const lowerTarget=gmail.toLowerCase();
    try{
        const currentEmail = auth?.currentUser?.email?.toLowerCase() || null;
        if(currentEmail && lowerTarget===currentEmail) throw new Error('You cannot ban yourself');
        if(lowerTarget===OWNER_CONFIG.gmail.toLowerCase()) throw new Error('Cannot modify the OWNER');
        const adminDoc = await getAdminByGmail(gmail).catch(()=>null);
        if(adminDoc){
            if(adminDoc.role==='administrator' && currentEmail!==OWNER_CONFIG.gmail.toLowerCase()){
                throw new Error('Only OWNER can modify Administrators');
            }
        }
    }catch(e){
        if(e.message.includes('Cannot') || e.message.includes('You cannot') || e.message.includes('Only OWNER')){
            throw e;
        }
    }
    if(firebaseInitialized){ await updateDoc(doc(db,'users',id),{isBanned:banned, updatedAt:Date.now()}); }
    else{ const users=getFallbackUsers(); const u=users.find(x=>sanitizeGmail(x.gmail)===id); if(u){ u.isBanned=banned; setFallbackUsers(users); } }
}
export async function featureUser(gmail, featured=true){
    const id=sanitizeGmail(gmail);
    const lowerTarget=gmail.toLowerCase();
    try{
        const currentEmail = auth?.currentUser?.email?.toLowerCase() || null;
        if(currentEmail && lowerTarget===currentEmail) throw new Error('You cannot feature yourself');
        if(lowerTarget===OWNER_CONFIG.gmail.toLowerCase()) throw new Error('Cannot modify the OWNER');
    }catch(e){
        if(e.message.includes('Cannot') || e.message.includes('You cannot')){
            throw e;
        }
    }
    if(firebaseInitialized){ await updateDoc(doc(db,'users',id),{isFeatured:featured, updatedAt:Date.now()}); }
    else{ const users=getFallbackUsers(); const u=users.find(x=>sanitizeGmail(x.gmail)===id); if(u){ u.isFeatured=featured; setFallbackUsers(users); } }
}
export async function updateUserLastSeen(gmail){
    const id=sanitizeGmail(gmail);
    const now=Date.now();
    if(firebaseInitialized){
        try{ await updateDoc(doc(db,'users',id),{lastSeen:now}); }catch{}
    }else{
        const users=getFallbackUsers(); const u=users.find(x=>sanitizeGmail(x.gmail)===id); if(u){ u.lastSeen=now; setFallbackUsers(users); }
    }
}
export async function updateAdminLastSeen(gmail){
    const id=sanitizeGmail(gmail);
    const now=Date.now();
    if(firebaseInitialized){
        try{ await updateDoc(doc(db,'admins',id),{lastSeen:now, updatedAt:now}); }catch{}
    }else{
        const admins=getFallbackAdmins(); const a=admins.find(x=>sanitizeGmail(x.gmail)===id); if(a){ a.lastSeen=now; setFallbackAdmins(admins); }
    }
}

// LEADERBOARD HISTORY & AUTO-CLEAR
export async function addLeaderboardSnapshot({clearedBy}){
    const anonymous = await getLeaderboardData();
    const users = await getAllUsers();
    const snapshot={
        clearedAt: Date.now(),
        clearedBy: clearedBy||'auto',
        userStats: users,
        anonymousStats: anonymous,
        totalUsers: users.length
    };
    if(firebaseInitialized){
        await addDoc(collection(db,'leaderboard_history'), snapshot);
    }else{
        const history=getFallbackHistory();
        history.unshift({id:'h_'+Date.now(), ...snapshot});
        setFallbackHistory(history);
    }
    return snapshot;
}
export async function getLeaderboardHistory(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'leaderboard_history');
            const q=query(col, orderBy('clearedAt','desc'));
            const snaps=await getDocs(q);
            const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()}));
            return list;
        }catch{ return getFallbackHistory(); }
    }else return getFallbackHistory();
}
export function subscribeToLeaderboardHistory(cb){
    if(firebaseInitialized){
        const col=collection(db,'leaderboard_history');
        const q=query(col, orderBy('clearedAt','desc'));
        return onSnapshot(q,(snaps)=>{ const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()})); cb(list); },()=>cb(getFallbackHistory()));
    }else{
        mockHistoryListeners.push(cb);
        setTimeout(()=>cb(getFallbackHistory()),100);
        return ()=>{ mockHistoryListeners=mockHistoryListeners.filter(c=>c!==cb); };
    }
}
export async function deleteLeaderboardSnapshot(id){
    if(firebaseInitialized){ await deleteDoc(doc(db,'leaderboard_history',id)); }
    else{ const h=getFallbackHistory().filter(x=>x.id!==id); setFallbackHistory(h); }
}
export async function performAutoClear(clearedBy='auto'){
    // Save snapshot first
    await addLeaderboardSnapshot({clearedBy});
    // Clear users: reset stats but keep user records (gmail, name, avatar, isBanned, isFeatured)
    const users=await getAllUsers();
    for(const user of users){
        const id=sanitizeGmail(user.gmail);
        const reset={
            totalQuizzes:0,
            archetypeCounts:{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0},
            archetypeHistory:[],
            mostFrequentArchetype:null,
            firstPlayed:null,
            lastPlayed:null,
            updatedAt:Date.now()
        };
        if(firebaseInitialized){
            try{ await updateDoc(doc(db,'users',id), reset); }catch{}
        } else {
            // mock handled inside clear? We'll update via setFallbackUsers
        }
    }
    if(!firebaseInitialized){
        // mock: reset all users stats
        let usersMock=getFallbackUsers();
        usersMock=usersMock.map(u=>({...u, totalQuizzes:0, archetypeCounts:{frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0}, archetypeHistory:[], mostFrequentArchetype:null, firstPlayed:null, lastPlayed:null}));
        setFallbackUsers(usersMock);
    }
    // Do NOT clear anonymous counter per spec — NEVER auto-cleared
    // Update nextAutoClearAt
    const settings=await new Promise(res=>{
        let unsub=subscribeToSettings(s=>{ unsub&&unsub(); res(s); });
        setTimeout(()=>{ try{unsub&&unsub();}catch{}; res(getFallbackSettings()); },1500);
    });
    const days=settings.leaderboardAutoClearDays||10;
    if(days!=='Never' && days!=='never'){
        const next=Date.now()+parseInt(days)*24*60*60*1000;
        await updateLeaderboardSettings({nextClearAt:next});
    }
    console.log('[DevDNA v1.0] Auto-clear performed by', clearedBy);
}
export async function checkAutoClear(){
    // Called on app init, checks if nextAutoClearAt passed and not frozen
    const settings=await new Promise(res=>{
        let unsub=subscribeToSettings(s=>{ unsub&&unsub(); res(s); });
        setTimeout(()=>{ try{unsub&&unsub();}catch{}; res(getFallbackSettings()); },1500);
    });
    if(settings.leaderboardFrozen) return;
    if(settings.leaderboardAutoClearDays==='Never' || settings.leaderboardAutoClearDays==='never') return;
    const now=Date.now();
    if(settings.nextAutoClearAt && now >= settings.nextAutoClearAt){
        await performAutoClear('auto');
    }
}

// CHAT SYSTEM v1.0 (19 perms) — simplified but functional
export async function getChatChannels(){
    if(firebaseInitialized){
        try{
            const col=collection(db,'chat_channels');
            const snaps=await getDocs(col);
            const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()}));
            return list.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
        }catch{ return []; }
    }else{
        return [{id:'general', name:'general', description:'Everyone chats', restrictedToAdministrator:false}, {id:'announcements', name:'announcements', description:'Only OWNER and ADMINISTRATOR', restrictedToAdministrator:true}, {id:'dev-talk', name:'dev-talk', description:'Regular dev talk', restrictedToAdministrator:false}];
    }
}
export function subscribeToChatChannels(cb){
    if(firebaseInitialized){
        const col=collection(db,'chat_channels');
        return onSnapshot(col,(snaps)=>{ const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()})); cb(list.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))); },()=>cb([]));
    }else{
        mockChatListeners.push(cb);
        setTimeout(()=>cb([{id:'general', name:'general', description:'Everyone', restrictedToAdministrator:false}, {id:'announcements', name:'announcements', description:'Announcements', restrictedToAdministrator:true}, {id:'dev-talk', name:'dev-talk', description:'Dev talk', restrictedToAdministrator:false}]),100);
        return ()=>{ mockChatListeners=mockChatListeners.filter(c=>c!==cb); };
    }
}
export async function createChatChannel({name, description, restricted}){
    if(firebaseInitialized){
        const id=name.toLowerCase().replace(/[^a-z0-9]/g,'-');
        await setDoc(doc(db,'chat_channels',id),{name, description, restrictedToAdministrator:!!restricted, createdAt:Date.now(), createdBy:'owner'});
        return id;
    } else return name;
}
export async function deleteChatChannel(channelId){
    if(firebaseInitialized){
        const col=collection(db,'chat_channels',channelId,'messages');
        const snaps=await getDocs(col);
        for(const d of snaps.docs){ await deleteDoc(doc(db,'chat_channels',channelId,'messages',d.id)); }
        await deleteDoc(doc(db,'chat_channels',channelId));
    }
}
export function subscribeToChatMessages(channelId, cb){
    if(firebaseInitialized){
        const col=collection(db,'chat_channels',channelId,'messages');
        const q=query(col, orderBy('timestamp','asc'), limit(100));
        return onSnapshot(q,(snaps)=>{
            const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()}));
            cb(list);
        },()=>cb([]));
    }else{
        // mock empty
        setTimeout(()=>cb([]),100);
        return ()=>{};
    }
}
export async function sendChatMessage(channelId, {content, senderGmail, senderName, senderRole, senderAvatar, senderDisplayAsOwner, mentions}){
    if(!content || content.trim().length===0) return;
    if(content.length>500) content=content.slice(0,500);
    const msg={
        content:content.trim(),
        senderGmail, senderName, senderRole, senderAvatar, senderDisplayAsOwner:!!senderDisplayAsOwner,
        timestamp:Date.now(),
        mentions:mentions||[],
        edited:false,
        deleted:false
    };
    if(firebaseInitialized){
        await addDoc(collection(db,'chat_channels',channelId,'messages'), msg);
        // Create unread pings for mentions
        if(mentions && mentions.length>0){
            for(const gmail of mentions){
                const id=sanitizeGmail(gmail);
                const ping={
                    messageId:'pending', // will be filled after? simplified
                    channelId,
                    senderName,
                    senderGmail,
                    content:content.slice(0,100),
                    timestamp:Date.now()
                };
                try{ await addDoc(collection(db,'admins',id,'unread_pings'), ping); }catch{}
            }
        }
    }else{
        // mock: trigger
        triggerMockChat();
    }
    return msg;
}
export async function editChatMessage(channelId, messageId, newContent){
    if(firebaseInitialized){
        await updateDoc(doc(db,'chat_channels',channelId,'messages',messageId),{content:newContent, edited:true, editedAt:Date.now()});
    }
}
export async function deleteChatMessage(channelId, messageId, deletedByGmail){
    if(firebaseInitialized){
        await updateDoc(doc(db,'chat_channels',channelId,'messages',messageId),{deleted:true, deletedBy:deletedByGmail, deletedAt:Date.now()});
    }
}

// Unread pings
export function subscribeToUnreadPings(gmail, cb){
    if(firebaseInitialized){
        const col=collection(db,'admins',sanitizeGmail(gmail),'unread_pings');
        return onSnapshot(col,(snaps)=>{ const list=[]; snaps.forEach(d=>list.push({id:d.id, ...d.data()})); cb(list); },()=>cb([]));
    }else{ setTimeout(()=>cb([]),100); return ()=>{}; }
}
export async function clearUnreadPing(gmail, pingId){
    if(firebaseInitialized){
        await deleteDoc(doc(db,'admins',sanitizeGmail(gmail),'unread_pings',pingId));
    }
}
export async function clearAllUnreadPings(gmail){
    if(firebaseInitialized){
        const col=collection(db,'admins',sanitizeGmail(gmail),'unread_pings');
        const snaps=await getDocs(col);
        for(const d of snaps.docs){ await deleteDoc(doc(db,'admins',sanitizeGmail(gmail),'unread_pings',d.id)); }
    }
}

// ACTIVITY LOG
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

// EXPORTS
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
        updateLeaderboardSettings,
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
        seedQuestionsIfEmpty,
        addActivityLog,
        subscribeToActivityLog,
        clearActivityLog,
        signInWithGoogle,
        signOutUser,
        sanitizeGmail,
        // users
        getUserByGmail,
        createOrUpdateUser,
        updateUserStats,
        getAllUsers,
        subscribeToUsers,
        deleteUser,
        banUser,
        featureUser,
        // history
        addLeaderboardSnapshot,
        getLeaderboardHistory,
        subscribeToLeaderboardHistory,
        deleteLeaderboardSnapshot,
        performAutoClear,
        checkAutoClear,
        // chat
        getChatChannels,
        subscribeToChatChannels,
        createChatChannel,
        deleteChatChannel,
        subscribeToChatMessages,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        subscribeToUnreadPings,
        clearUnreadPing,
        clearAllUnreadPings
    };
}
