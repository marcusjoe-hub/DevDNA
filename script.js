/**
 * DevDNA v2.1 - Bug Fixes
 * FIXES:
 * #1 Landing typing doubled -> guard + single execution after boot
 * #2 Hover sound spam -> removed hover SFX, volume 0.15, debounce clicks
 * #3 Fake 556 counter -> real Firebase total only, 0 if empty/fail
 * #4 Year 2025 -> 2026 (no hardcoded 2025 event text)
 * #5 Sound toggle overlap -> layout fixed via CSS + margin (handled in CSS, but JS keeps toggle)
 * #6 Admin stats broken icon -> handled in admin.css/js
 * #7 Announcement banner not showing -> fixed banner fixed top, body.has-banner, real-time listener, cross-tab sync
 */

import { incrementArchetype, subscribeToLeaderboard, subscribeToSettings, isFirebaseConfigured } from './firebase.js';
import { openAdminPanel, closeAdminPanel } from './admin.js';

// ============================================================================
// CONSTANTS
// ============================================================================
const SITE_URL = "https://devdna-2trh.onrender.com/";
const SHARE_URL = SITE_URL;

const ARCHETYPES = {
    frontend: { key:'frontend', name:'Frontend Wizard', emoji:'🎨', color:'#00ccff', gradient:['#00ccff','#a855f7'], description:'You craft pixel-perfect realities. Obsessed with motion, aesthetics, and user delight. For you, the web isn’t code — it’s canvas.', traits:['UI Obsessed','Animation Nerd','Pixel Perfectionist'] },
    backend: { key:'backend', name:'Backend Architect', emoji:'🛠', color:'#00ff99', gradient:['#00ff99','#00cc88'], description:'You build fortresses that scale. Databases, queues, auth flows — your mind thinks in diagrams. If it can’t handle 1M req/s, it’s not done.', traits:['Scalability Mind','DB Whisperer','API Craftsman'] },
    fullstack: { key:'fullstack', name:'Full Stack Ninja', emoji:'⚡', color:'#a855f7', gradient:['#a855f7','#ff00aa'], description:'Idea → MVP in 48 hours. You connect dots others don’t see. Frontend, backend, deploy — you ship the whole damn product.', traits:['Ship-It Mentality','0-to-1 Builder','Stack Polyglot'] },
    debugging: { key:'debugging', name:'Debugging Detective', emoji:'🐞', color:'#ff8a00', gradient:['#ff8a00','#ffcc00'], description:'Bugs fear you. You hunt Heisenbugs for fun, read stack traces like novels, and won’t sleep until the green tick appears.', traits:['Log Hunter','Edge Case Prophet','Break-Fix Loop'] },
    ai: { key:'ai', name:'AI Explorer', emoji:'🤖', color:'#00ffff', gradient:['#00ffff','#00ccff'], description:'You’re coding with the future. Prompts, vectors, models — you see code as intelligence. Automation isn’t a tool, it’s your teammate.', traits:['Prompt Engineer','Model Tamer','Automation Addict'] }
};
const ARCHETYPE_ORDER = ['frontend','backend','fullstack','debugging','ai'];
const COMPATIBILITY = {
    frontend:{pair:'backend', reason:"You design the dream, they build the engine."},
    backend:{pair:'frontend', reason:"You build the engine, they design the dream."},
    fullstack:{pair:'debugging', reason:"You build fast, they keep it flawless."},
    debugging:{pair:'fullstack', reason:"You catch the chaos, they create the code."},
    ai:{pair:'frontend', reason:"You bring intelligence, they make it beautiful."}
};
const QUIZ_QUESTIONS = [
    { q:"You get an empty repo at hackathon kickoff. What’s your first commit?", options:[{text:"Design system, Tailwind, Framer Motion — make it feel alive.",archetype:"frontend"},{text:"DB schema, auth, REST API skeleton. Solid foundations first.",archetype:"backend"},{text:"Monorepo, frontend + backend + CI + deploy. Full pipeline.",archetype:"fullstack"},{text:"A script that uses an LLM to scaffold the whole thing from README.",archetype:"ai"}] },
    { q:"Production crashes 5 minutes before the demo. Your instinct?", options:[{text:"Add a gorgeous fallback UI and skeleton loaders so users don’t panic.",archetype:"frontend"},{text:"SSH in, check logs, scale up, fix the race condition.",archetype:"backend"},{text:"Reproduce step-by-step, bisect commits, write a minimal failing test.",archetype:"debugging"},{text:"Paste the trace into AI and ask it to hypothesize root causes.",archetype:"ai"}] },
    { q:"Your dream side project on a weekend?", options:[{text:"Recreating Linear.app’s homepage animations — but better.",archetype:"frontend"},{text:"Building a real-time collaborative engine with WebSockets & Redis.",archetype:"backend"},{text:"Shipping a full SaaS: landing, payments, dashboard, analytics.",archetype:"fullstack"},{text:"Finding a memory leak that’s haunted your old project for months.",archetype:"debugging"}] },
    { q:"How do you prefer to learn new tech?", options:[{text:"Clone a Dribbble shot and make it interactive.",archetype:"frontend"},{text:"Read RFCs, benchmarks, and source code. Understand internals.",archetype:"backend"},{text:"Build an end-to-end app in 48 hours and learn by shipping.",archetype:"fullstack"},{text:"Break it intentionally to map every edge case and failure mode.",archetype:"debugging"}] },
    { q:"In a team, people know you as...", options:[{text:"“8px vs 16px matters”. The eye for detail.",archetype:"frontend"},{text:"“What about concurrency?” — the systems thinker.",archetype:"backend"},{text:"“Wait, it’s already deployed.” — the shipper.",archetype:"fullstack"},{text:"“I automated our onboarding with agents.” — the AI guy/gal.",archetype:"ai"}] },
    { q:"What gives you the biggest dopamine hit?", options:[{text:"That buttery 120fps page transition finally working.",archetype:"frontend"},{text:"Query going from 2.3s → 18ms after indexing.",archetype:"backend"},{text:"Hitting ‘Deploy’ and seeing paying users in first hour.",archetype:"fullstack"},{text:"Finally catching that heisenbug after 6 hours of logs.",archetype:"debugging"}] },
    { q:"AI to you is...", options:[{text:"A co-designer. Generate palettes, icons, UI variants instantly.",archetype:"frontend"},{text:"A co-architect. Optimizes infra, writes tests, scales alerts.",archetype:"backend"},{text:"A co-founder. Builds features while I sleep.",archetype:"ai"},{text:"A debugger buddy. Explains stack traces at 3 AM.",archetype:"debugging"}] },
    { q:"System design interview: You have 45 mins. You focus on?", options:[{text:"User flows, states, optimistic UI, offline handling.",archetype:"frontend"},{text:"Partitioning, replication, consistency, CAP tradeoffs.",archetype:"backend"},{text:"MVP scope, tech choices, tradeoffs, launch plan.",archetype:"fullstack"},{text:"Failure modes, monitoring, rollbacks, chaos testing.",archetype:"debugging"}] },
    { q:"Under pressure, you...", options:[{text:"Protect UX at all costs — degrade gracefully with style.",archetype:"frontend"},{text:"Protect data — no compromise on integrity & uptime.",archetype:"backend"},{text:"Protect the launch — cut scope, keep shipping.",archetype:"fullstack"},{text:"Protect future self — log everything, blame no one.",archetype:"debugging"}] },
    { q:"If programming languages were weapons, you’d pick?", options:[{text:"A lightsaber — elegant, precise, flashy (TypeScript + GSAP).",archetype:"frontend"},{text:"A bunker blueprint — unbreakable, scalable (Rust, Go).",archetype:"backend"},{text:"Swiss army knife — handy everywhere (Next.js, Supabase).",archetype:"fullstack"},{text:"An AI drone that learns on its own (Python + LangChain).",archetype:"ai"}] },
    { q:"You inherit terrifying legacy code. First move?", options:[{text:"Refactor UI layer, add Storybook, bring delight back.",archetype:"frontend"},{text:"Trace data flow, add observability, contain blast radius.",archetype:"backend"},{text:"Write a parser to auto-document and auto-test everything.",archetype:"debugging"},{text:"Embed an agent to explain & refactor modules semi-automatically.",archetype:"ai"}] },
    { q:"Final boss: What’s your ultimate dev fantasy?", options:[{text:"Building an interface so good people screenshot it for inspiration.",archetype:"frontend"},{text:"Architecting a system that serves a billion users without flinching.",archetype:"backend"},{text:"Solo-shipping a product that hits #1 on Product Hunt.",archetype:"fullstack"},{text:"Creating a self-healing codebase that fixes bugs before humans notice.",archetype:"ai"}] }
];

// ============================================================================
// STATE
// ============================================================================
let currentIndex=0;
let scores={frontend:0,backend:0,fullstack:0,debugging:0,ai:0};
let resultArchetype=null;
let leaderboardUnsub=null;
let settingsUnsub=null;
let currentSettings={eventLive:true, announcement:"", announcementVisible:false};
let totalDevelopers=0;
let soundEnabled=true;
let bootDone=false;

// FIX 1: Guard to prevent double typing
let typingInProgress=false;
let typingAbort=false;

const DOM = {
    bootScreen: document.getElementById('boot-screen'),
    bootLines: document.getElementById('boot-lines'),
    bootFill: document.getElementById('boot-progress-fill'),
    bootPercent: document.getElementById('boot-percent-text'),
    bootStatus: document.getElementById('boot-status-text'),
    landing: document.getElementById('landing-section'),
    quiz: document.getElementById('quiz-section'),
    result: document.getElementById('result-section'),
    locked: document.getElementById('event-locked-section'),
    admin: document.getElementById('admin-section'),
    uptime: document.getElementById('uptime-section'),
    notfound: document.getElementById('notfound-section'),
    notfoundHash: document.getElementById('notfound-hash'),
    notfoundReturn: document.getElementById('notfound-return'),
    startBtn: document.getElementById('start-btn'),
    qCounter: document.getElementById('question-counter'),
    qPercent: document.getElementById('progress-percent'),
    qText: document.getElementById('question-text'),
    qWrapper: document.getElementById('question-wrapper'),
    optionsContainer: document.getElementById('options-container'),
    progressFill: document.getElementById('progress-fill'),
    progressGlow: document.querySelector('.progress-bar-glow'),
    resultCard: document.getElementById('result-card'),
    resultIcon: document.getElementById('result-icon'),
    resultIconWrap: document.getElementById('result-icon-wrapper'),
    resultAura: document.getElementById('result-aura'),
    resultName: document.getElementById('result-name'),
    resultDesc: document.getElementById('result-description'),
    resultTraits: document.getElementById('result-traits'),
    resultId: document.getElementById('result-id'),
    resultUnderline: document.getElementById('result-underline'),
    bestPair: document.getElementById('best-pair'),
    bestPairName: document.getElementById('best-pair-name'),
    bestPairReason: document.getElementById('best-pair-reason'),
    breakdownList: document.getElementById('breakdown-list'),
    downloadBtn: document.getElementById('download-btn'),
    shareBtn: document.getElementById('share-btn'),
    toast: document.getElementById('copy-toast'),
    leaderboardList: document.getElementById('leaderboard-list'),
    firebaseStatus: document.getElementById('firebase-status'),
    totalCount: document.getElementById('total-count'),
    bgCanvas: document.getElementById('bg-canvas'),
    matrixCanvas: document.getElementById('matrix-canvas'),
    exportCanvas: document.getElementById('export-canvas'),
    announcementBanner: document.getElementById('announcement-banner'),
    counterNum: document.getElementById('counter-num'),
    heroTitleTyped: document.getElementById('hero-title-typed'),
    heroTitleCursor: document.getElementById('hero-title-cursor'),
    heroSubtitleTyped: document.getElementById('hero-subtitle-typed'),
    heroSubtitleCursor: document.getElementById('hero-subtitle-cursor'),
    soundToggle: document.getElementById('sound-toggle'),
    revealSeq: document.getElementById('reveal-sequence'),
    revealLines: document.getElementById('reveal-lines'),
    customCursor: document.getElementById('custom-cursor'),
    qrTemp: document.getElementById('qr-temp'),
    uptimeDuration: document.getElementById('uptime-duration'),
    uptimeLast: document.getElementById('uptime-lastchecked'),
    uptimeFirestore: document.getElementById('uptime-firestore')
};

// ============================================================================
// SOUND SYSTEM - FIX 2: No hover spam, volume 0.15, debounce
// ============================================================================
const SOUND_FILES = { click:'audio/click.mp3', select:'audio/select.mp3', complete:'audio/complete.mp3', reveal:'audio/reveal.mp3', error:'audio/select.mp3' };
let audioElements = {};
let lastSFXTime = {}; // debounce map

function initSound(){
    try{
        const saved=localStorage.getItem('devdna_sound_enabled');
        soundEnabled = saved===null ? true : saved==='true';
    }catch{ soundEnabled=true; }
    updateSoundIcon();
    Object.keys(SOUND_FILES).forEach(key=>{
        const a=new Audio();
        a.src=SOUND_FILES[key];
        a.preload='auto';
        a.volume=0.15; // FIX 2: reduced from 0.35 to 0.15
        a.crossOrigin='anonymous';
        audioElements[key]=a;
        a.load();
        a.addEventListener('error', ()=>console.warn(`[DevDNA] Audio ${key} not found`));
    });
    DOM.soundToggle?.addEventListener('click', toggleSound);
}
function toggleSound(){
    soundEnabled=!soundEnabled;
    try{ localStorage.setItem('devdna_sound_enabled', String(soundEnabled)); }catch{}
    updateSoundIcon();
    if(soundEnabled) playSFX('click');
}
function updateSoundIcon(){
    if(!DOM.soundToggle) return;
    DOM.soundToggle.textContent=soundEnabled?'🔊':'🔇';
    DOM.soundToggle.title=soundEnabled?'Sound ON (click to mute)':'Sound OFF (click to enable)';
}
function playSFX(name){
    if(!soundEnabled) return;
    const now=Date.now();
    const last=lastSFXTime[name]||0;
    if(now-last < 120){ return; } // debounce 120ms to prevent overlap/spam
    lastSFXTime[name]=now;
    const a=audioElements[name];
    if(!a) return;
    try{
        a.currentTime=0;
        const p=a.play();
        if(p && p.catch) p.catch(()=>{});
    }catch{}
}
// REMOVED: bindHoverSFX() entirely per FIX 2 — no hover sounds

// ============================================================================
// Backgrounds
// ============================================================================
function initMatrixRain(){
    const canvas=DOM.matrixCanvas; if(!canvas) return;
    const ctx=canvas.getContext('2d',{alpha:true});
    let w,h,cols,drops=[],raf;
    const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]<>/\\|01'.split('');
    const fontSize=14;
    function resize(){ w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight; cols=Math.floor(w/fontSize); drops=Array.from({length:cols},()=>Math.random()*h); }
    function draw(){ ctx.fillStyle='rgba(10,10,15,0.07)'; ctx.fillRect(0,0,w,h); ctx.font=`${fontSize}px JetBrains Mono`; for(let i=0;i<cols;i++){ const char=chars[Math.floor(Math.random()*chars.length)]; const x=i*fontSize; const y=drops[i]*fontSize; const isPurple=i%3===0; ctx.fillStyle=isPurple?'rgba(168,85,247,0.75)':'rgba(0,255,153,0.65)'; ctx.fillText(char,x,y); if(y>h && Math.random()>0.975) drops[i]=0; drops[i]+=0.28+Math.random()*0.6; } raf=requestAnimationFrame(draw); }
    resize(); draw();
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(raf); else draw(); });
}
function initParticles(){
    const canvas=DOM.bgCanvas; if(!canvas) return;
    const ctx=canvas.getContext('2d',{alpha:true});
    let w,h,particles=[],raf;
    function resize(){ w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight; }
    function create(){ const count=Math.min(70, Math.floor((w*h)/20000)); particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*0.35,vy:(Math.random()-0.5)*0.35,r:Math.random()*1.7+0.3,hue:Math.random()>0.5?265:195,alpha:Math.random()*0.55+0.12})); }
    function draw(){ ctx.clearRect(0,0,w,h); for(let i=0;i<particles.length;i++){ for(let j=i+1;j<particles.length;j++){ const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y; const dist=Math.sqrt(dx*dx+dy*dy); if(dist<130){ ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`hsla(${particles[i].hue},100%,70%,${0.07*(1-dist/130)})`; ctx.lineWidth=0.6; ctx.stroke(); } } } particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`hsla(${p.hue},100%,70%,${p.alpha})`; ctx.shadowBlur=10; ctx.shadowColor=`hsla(${p.hue},100%,70%,${p.alpha})`; ctx.fill(); ctx.shadowBlur=0; }); raf=requestAnimationFrame(draw); }
    resize(); create(); draw();
    window.addEventListener('resize',()=>{resize();create();});
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(raf); else draw(); });
}
function initCustomCursor(){
    const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0||window.innerWidth<768; if(isTouch) return;
    const cursor=DOM.customCursor; if(!cursor) return;
    const dot=cursor.querySelector('.cursor-dot'); const ring=cursor.querySelector('.cursor-ring');
    let mouseX=0,mouseY=0,ringX=0,ringY=0;
    document.body.classList.add('custom-cursor-active'); cursor.classList.add('active');
    window.addEventListener('mousemove',(e)=>{ mouseX=e.clientX; mouseY=e.clientY; dot.style.left=`${mouseX}px`; dot.style.top=`${mouseY}px`; });
    function animateRing(){ ringX+=(mouseX-ringX)*0.18; ringY+=(mouseY-ringY)*0.18; ring.style.left=`${ringX}px`; ring.style.top=`${ringY}px`; requestAnimationFrame(animateRing); } animateRing();
    document.addEventListener('mouseover',(e)=>{ if(e.target.closest('button, .option-card, a, .chip')) ring.classList.add('hover'); });
    document.addEventListener('mouseout',(e)=>{ if(e.target.closest('button, .option-card, a, .chip')) ring.classList.remove('hover'); });
    let lastTrail=0;
    window.addEventListener('mousemove',(e)=>{ const now=Date.now(); if(now-lastTrail<80) return; lastTrail=now; const trail=document.createElement('div'); trail.className='cursor-trail'; trail.style.left=e.clientX+'px'; trail.style.top=e.clientY+'px'; document.body.appendChild(trail); trail.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:0.6},{transform:'translate(-50%,-50%) scale(0)',opacity:0}],{duration:400,easing:'ease-out'}).onfinish=()=>trail.remove(); });
}

// ============================================================================
// BOOT SCREEN
// ============================================================================
const BOOT_LINES=['> Initializing DevDNA...','> Loading neural weights...','> Connecting to archetype database...','> System ready.'];
function runBootScreen(){
    return new Promise(resolve=>{
        const container=DOM.bootLines; container.innerHTML='';
        BOOT_LINES.forEach(txt=>{ const div=document.createElement('div'); div.className='boot-line'; div.textContent=''; div.dataset.full=txt; container.appendChild(div); });
        function typeLine(idx){ if(idx>=BOOT_LINES.length){ finishProgress(); return; } const el=container.children[idx]; const full=el.dataset.full; let charIdx=0; el.classList.add('show'); const interval=setInterval(()=>{ el.textContent=full.slice(0,charIdx+1); charIdx++; if(charIdx>=full.length){ clearInterval(interval); setTimeout(()=>typeLine(idx+1),180); } },38); }
        typeLine(0);
        let progress=0; DOM.bootFill.style.width='0%'; const start=Date.now(); const duration=2500;
        const progInterval=setInterval(()=>{ const elapsed=Date.now()-start; progress=Math.min(100,Math.floor((elapsed/duration)*100)); DOM.bootFill.style.width=progress+'%'; DOM.bootPercent.textContent=progress+'%'; const statuses=['INITIALIZING...','LOADING NEURAL ENGINE...','SYNCING DB...','READY']; DOM.bootStatus.textContent=statuses[Math.min(3,Math.floor(progress/34))]; if(progress>=100) clearInterval(progInterval); },40);
        function finishProgress(){ setTimeout(()=>{ DOM.bootScreen.classList.add('hide'); setTimeout(()=>{ bootDone=true; resolve(); },750); },500); }
    });
}

// ============================================================================
// TYPING ANIMATION - FIX 1: Guard to prevent double execution
// ============================================================================
function typeWriter(element, text, speed=50){
    return new Promise(resolve=>{
        // FIX 1: Clear existing text before starting
        if(!element) { resolve(); return; }
        element.textContent='';
        let i=0;
        if(typingAbort){ resolve(); return; }
        const interval=setInterval(()=>{
            if(typingAbort){ clearInterval(interval); resolve(); return; }
            if(i < text.length){
                element.textContent+=text[i];
                i++;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

async function runLandingTyping(){
    // FIX 1: Guard — ensure typing runs exactly once
    if(typingInProgress){
        console.log('[DevDNA] Typing already in progress, skipping duplicate');
        return;
    }
    typingInProgress=true;
    typingAbort=false;

    try{
        const title='DevDNA';
        const subtitle='Discover Your Developer Archetype';

        // FIX 1: Clear any existing text before starting
        if(DOM.heroTitleTyped) DOM.heroTitleTyped.textContent='';
        if(DOM.heroSubtitleTyped) DOM.heroSubtitleTyped.textContent='';
        if(DOM.heroTitleCursor) DOM.heroTitleCursor.style.display='inline-block';
        if(DOM.heroSubtitleCursor) DOM.heroSubtitleCursor.style.display='none';

        await typeWriter(DOM.heroTitleTyped, title, 90);

        if(DOM.heroTitleCursor) DOM.heroTitleCursor.style.display='none';
        if(DOM.heroSubtitleCursor) DOM.heroSubtitleCursor.style.display='inline-block';

        await typeWriter(DOM.heroSubtitleTyped, subtitle, 42);
    } finally {
        typingInProgress=false;
    }
}

// ============================================================================
// QUIZ LOGIC
// ============================================================================
function startQuiz(){
    if(!currentSettings.eventLive){ showLocked(); return; }
    playSFX('complete'); // FIX 2: only on click, not hover, soft 15%
    currentIndex=0; scores={frontend:0,backend:0,fullstack:0,debugging:0,ai:0};
    DOM.landing.classList.remove('active');
    setTimeout(()=>{
        DOM.landing.style.display='none';
        DOM.quiz.style.display='block';
        void DOM.quiz.offsetWidth;
        DOM.quiz.classList.add('active');
        renderQuestion(currentIndex);
    },350);
}
function renderQuestion(index){
    const data=QUIZ_QUESTIONS[index]; if(!data) return;
    const displayProgress=Math.round(((index+1)/QUIZ_QUESTIONS.length)*100);
    DOM.qCounter.textContent=`QUESTION ${String(index+1).padStart(2,'0')} / ${String(QUIZ_QUESTIONS.length).padStart(2,'0')}`;
    DOM.qPercent.textContent=`${displayProgress}%`;
    DOM.progressFill.style.width=`${displayProgress}%`;
    if(DOM.progressGlow) DOM.progressGlow.style.width=`${displayProgress}%`;
    DOM.qWrapper.classList.add('out');
    setTimeout(()=>{
        DOM.qText.textContent=data.q;
        DOM.optionsContainer.innerHTML='';
        const letters=['A','B','C','D'];
        data.options.forEach((opt,i)=>{
            const btn=document.createElement('button');
            btn.className='option-card';
            btn.dataset.archetype=opt.archetype;
            btn.innerHTML=`<span class="option-letter">${letters[i]}</span><span class="option-text">${opt.text}</span>`;
            btn.addEventListener('mousemove',(e)=>{
                const rect=btn.getBoundingClientRect();
                const x=((e.clientX-rect.left)/rect.width)*100;
                const y=((e.clientY-rect.top)/rect.height)*100;
                btn.style.setProperty('--mouse-x',`${x}%`);
                btn.style.setProperty('--mouse-y',`${y}%`);
            });
            btn.addEventListener('click',()=>selectOption(opt.archetype,btn));
            DOM.optionsContainer.appendChild(btn);
        });
        DOM.qWrapper.classList.remove('out');
    },220);
}
function selectOption(archetype, btnEl){
    if(btnEl.classList.contains('selected')) return;
    playSFX('select'); // click only
    document.querySelectorAll('.option-card').forEach(b=>b.classList.remove('selected'));
    btnEl.classList.add('selected');
    scores[archetype]=(scores[archetype]||0)+1;
    if(navigator.vibrate) navigator.vibrate(16);
    setTimeout(()=>{
        if(currentIndex<QUIZ_QUESTIONS.length-1){ currentIndex++; renderQuestion(currentIndex); }
        else { finishQuizReveal(); }
    },420);
}
function calculateResult(){ let max=-1,winner=ARCHETYPE_ORDER[0]; ARCHETYPE_ORDER.forEach(k=>{ if(scores[k]>max){max=scores[k]; winner=k;} }); return winner; }

// Reveal
const REVEAL_LINES=['> SCANNING NEURAL PATTERNS...','> ANALYZING RESPONSES...','> DECODING DNA...','> COMPLETE.'];
function finishQuizReveal(){
    playSFX('complete');
    DOM.quiz.classList.remove('active');
    setTimeout(()=>{
        DOM.quiz.style.display='none';
        DOM.revealSeq.classList.add('active');
        DOM.revealLines.innerHTML='';
        let idx=0;
        function showNext(){
            if(idx>=REVEAL_LINES.length){
                setTimeout(()=>{
                    DOM.revealSeq.classList.remove('active');
                    const winnerKey=calculateResult();
                    resultArchetype=ARCHETYPES[winnerKey];
                    DOM.result.style.display='block';
                    void DOM.result.offsetWidth;
                    DOM.result.classList.add('active');
                    showResult(resultArchetype);
                },600);
                return;
            }
            const div=document.createElement('div'); div.className='reveal-line'; div.textContent=REVEAL_LINES[idx];
            DOM.revealLines.appendChild(div);
            setTimeout(()=>div.classList.add('show'),60);
            if(idx===REVEAL_LINES.length-1) setTimeout(()=>div.classList.add('glitch'),200);
            idx++; setTimeout(showNext, idx===1?550:420);
        }
        showNext();
    },350);
}
function showResult(archetype){
    playSFX('reveal');
    DOM.resultIcon.textContent=archetype.emoji;
    DOM.resultName.textContent=archetype.name;
    DOM.resultName.classList.remove('glow-in'); void DOM.resultName.offsetWidth; DOM.resultName.classList.add('glow-in');
    DOM.resultDesc.textContent=archetype.description;
    DOM.resultId.textContent=`ID: ${archetype.key.toUpperCase()}-${Math.floor(1000+Math.random()*9000)}-X`;
    DOM.resultAura.style.background=`radial-gradient(circle at center, ${archetype.color}99 0%, transparent 70%)`;
    DOM.resultIconWrap.style.borderColor=`${archetype.color}88`;
    DOM.resultIconWrap.style.boxShadow=`0 14px 42px rgba(0,0,0,0.6), 0 0 36px ${archetype.color}66, 0 0 70px ${archetype.color}33, inset 0 1px 0 rgba(255,255,255,0.12)`;
    DOM.resultIcon.style.color=archetype.color;
    DOM.resultIcon.style.filter=`drop-shadow(0 0 22px ${archetype.color}) drop-shadow(0 0 42px ${archetype.color}) drop-shadow(0 0 2px white)`;
    DOM.resultUnderline.style.background=`linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`;
    DOM.resultUnderline.style.boxShadow=`0 0 14px ${archetype.color}`;
    DOM.resultTraits.innerHTML='';
    archetype.traits.forEach(t=>{ const pill=document.createElement('span'); pill.className='trait-pill'; pill.textContent=t; pill.style.borderColor=`${archetype.color}44`; DOM.resultTraits.appendChild(pill); });
    const compat=COMPATIBILITY[archetype.key];
    if(compat){
        const pairArchetype=ARCHETYPES[compat.pair];
        DOM.bestPairName.textContent=pairArchetype.name;
        DOM.bestPairName.style.color=pairArchetype.color;
        DOM.bestPairReason.textContent=`"${compat.reason}"`;
        DOM.bestPair.style.display='block';
    }
    renderBreakdown(scores);
    window.scrollTo({top:0,behavior:'smooth'});
    incrementArchetype(archetype.key).catch(()=>{});
    setupLeaderboard();
    DOM.resultCard.animate([{transform:'scale(0.96)',opacity:0.6},{transform:'scale(1)',opacity:1}],{duration:700,easing:'cubic-bezier(0.22,1,0.36,1)'});
}
function renderBreakdown(scoreObj){
    const total=Object.values(scoreObj).reduce((s,v)=>s+v,0)||1;
    const entries=ARCHETYPE_ORDER.map(k=>({key:k,...ARCHETYPES[k],count:scoreObj[k]||0,percent:Math.round(((scoreObj[k]||0)/total)*100)})).sort((a,b)=>b.percent-a.percent);
    DOM.breakdownList.innerHTML='';
    entries.forEach(item=>{
        const div=document.createElement('div'); div.className='breakdown-item';
        div.innerHTML=`<div class="breakdown-top"><span class="breakdown-name" style="color:${item.color}">${item.emoji} ${item.name}</span><span class="breakdown-percent" style="color:${item.color}">${item.percent}%</span></div><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:0%; background: linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]}); box-shadow:0 0 10px ${item.color}88;"></div></div>`;
        DOM.breakdownList.appendChild(div);
        requestAnimationFrame(()=>{ const fill=div.querySelector('.breakdown-bar-fill'); setTimeout(()=>fill.style.width=`${item.percent}%`,80); });
    });
}

// ============================================================================
// Leaderboard + FIX 3 real counter only
// ============================================================================
function setupLeaderboard(){
    if(isFirebaseConfigured()){
        DOM.firebaseStatus.innerHTML=`<span style="color:var(--neon-green)">● LIVE</span> CONNECTED TO FIRESTORE // REAL-TIME SYNC`;
    } else {
        DOM.firebaseStatus.innerHTML=`<span style="color:var(--neon-orange)">● MOCK MODE</span> USING LOCAL STORAGE // CONFIGURE FIREBASE`;
    }
    if(leaderboardUnsub) leaderboardUnsub();
    leaderboardUnsub=subscribeToLeaderboard((counts)=>{
        renderLeaderboard(counts);
        // FIX 3: Real total only — if Firebase fails, counts.total will be 0 (not fake 556)
        const realTotal = counts.total !== undefined ? counts.total : Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0);
        totalDevelopers = realTotal; // can be 0
        animateTotalCounter(totalDevelopers);
    });
}
function renderLeaderboard(counts){
    const entries=ARCHETYPE_ORDER.map(key=>({...ARCHETYPES[key],count:counts[key]||0}));
    const total=counts.total !== undefined ? counts.total : entries.reduce((s,e)=>s+e.count,0);
    const displayTotal = total || 0;
    const max=Math.max(...entries.map(e=>e.count),1);
    const sorted=[...entries].sort((a,b)=>b.count-a.count);
    DOM.leaderboardList.innerHTML='';
    sorted.forEach(item=>{
        const percent= displayTotal>0 ? Math.round((item.count/displayTotal)*100) : 0;
        const width=Math.round((item.count/max)*100);
        const div=document.createElement('div'); div.className='leader-item';
        div.innerHTML=`<div class="leader-item-top"><div class="leader-icon" style="border-color:${item.color}33; box-shadow:0 0 10px ${item.color}22;">${item.emoji}</div><div class="leader-info"><span class="leader-name">${item.name}</span><span class="leader-count">${item.count} developers</span></div></div><span class="leader-percent" style="color:${item.color}">${percent}%</span><div class="leader-bar-wrap"><div class="leader-bar-fill" style="width:${width}%; background: linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]}); box-shadow:0 0 10px ${item.color}66;"></div></div>`;
        DOM.leaderboardList.appendChild(div);
    });
    DOM.totalCount.textContent=`TOTAL DECODED: ${displayTotal.toLocaleString()} developers worldwide`;
}

// FIX 3: Counter shows real number, 0 if empty, animated 0->real
let counterAnimRaf=null;
let lastAnimatedTotal=-1;
function animateTotalCounter(target){
    if(!DOM.counterNum) return;
    // FIX 3: If Firebase returns 0, show 0 — never hide, never fake
    const realTarget = Number.isFinite(target) ? target : 0;
    if(realTarget===lastAnimatedTotal) return;
    lastAnimatedTotal=realTarget;
    if(counterAnimRaf) cancelAnimationFrame(counterAnimRaf);
    const startTime=Date.now();
    const duration=1400;
    function tick(){
        const elapsed=Date.now()-startTime;
        const progress=Math.min(1,elapsed/duration);
        const eased=1-Math.pow(1-progress,3);
        const current=Math.floor(realTarget*eased);
        DOM.counterNum.textContent=current.toLocaleString();
        if(progress<1){ counterAnimRaf=requestAnimationFrame(tick); }
        else { DOM.counterNum.textContent=realTarget.toLocaleString(); }
    }
    tick();
}

// ============================================================================
// Canvas Export
// ============================================================================
function wrapText(ctx,text,x,y,maxWidth,lineHeight){
    const words=text.split(' '); let line='',curY=y;
    for(let n=0;n<words.length;n++){
        const test=line+words[n]+' ';
        if(ctx.measureText(test).width>maxWidth && n>0){ ctx.fillText(line.trim(),x,curY); line=words[n]+' '; curY+=lineHeight; } else line=test;
    }
    ctx.fillText(line.trim(),x,curY);
    return curY+lineHeight;
}
function generateQRCodeDataURL(text){
    return new Promise((resolve,reject)=>{
        try{
            DOM.qrTemp.innerHTML='';
            const qr=new QRCode(DOM.qrTemp,{text,width:120,height:120,colorDark:'#ffffff',colorLight:'#0a0a0f',correctLevel:QRCode.CorrectLevel.M});
            setTimeout(()=>{
                const canvasEl=DOM.qrTemp.querySelector('canvas');
                const imgEl=DOM.qrTemp.querySelector('img');
                if(canvasEl) resolve(canvasEl.toDataURL('image/png'));
                else if(imgEl){ const c=document.createElement('canvas'); c.width=120;c.height=120; const ctx=c.getContext('2d'); ctx.drawImage(imgEl,0,0); resolve(c.toDataURL('image/png')); }
                else reject('QR not generated');
            },350);
        }catch(e){ reject(e); }
    });
}
async function generateResultCard(){
    if(!resultArchetype) return;
    const canvas=DOM.exportCanvas; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; const arch=resultArchetype;
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#0a0a0f'; ctx.fillRect(0,0,W,H);
    const g1=ctx.createRadialGradient(0,H*0.2,0,0,H*0.2,600); g1.addColorStop(0,'rgba(168,85,247,0.32)'); g1.addColorStop(1,'transparent'); ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);
    const g2=ctx.createRadialGradient(W,100,0,W,100,650); g2.addColorStop(0,'rgba(0,204,255,0.24)'); g2.addColorStop(1,'transparent'); ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1; for(let x=0;x<W;x+=48){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); } for(let y=0;y<H;y+=48){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.lineWidth=1; ctx.strokeRect(36,36,W-72,H-72);
    ctx.strokeStyle=arch.color+'66'; ctx.lineWidth=2.2; ctx.strokeRect(34,34,W-68,H-68);
    ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='white'; ctx.font='900 210px \"Orbitron\", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('DevDNA',W/2,H/2); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.55; ctx.filter='blur(42px)'; ctx.fillStyle=arch.color; ctx.beginPath(); ctx.arc(W/2,380,145,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.filter='none';
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='600 22px \"JetBrains Mono\", monospace'; ctx.textAlign='center'; ctx.fillText('DevDNA',W/2,110);
    ctx.fillStyle='rgba(161,161,181,0.75)'; ctx.font='500 16px \"JetBrains Mono\", monospace'; ctx.fillText('ARCHETYPE DECODED // SYS.V1',W/2,140);
    ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=36; ctx.fillStyle='rgba(255,255,255,0.09)'; ctx.strokeStyle=arch.color+'AA'; ctx.lineWidth=2.5; ctx.beginPath(); if(ctx.roundRect){ ctx.roundRect(W/2-88,190,176,176,30); } else { ctx.rect(W/2-88,190,176,176); } ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=28; ctx.font='92px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='white'; ctx.fillText(arch.emoji,W/2,278); ctx.shadowBlur=16; ctx.fillText(arch.emoji,W/2,278); ctx.restore();
    ctx.fillStyle='white'; ctx.font='900 58px \"Orbitron\", sans-serif'; ctx.textAlign='center'; ctx.fillText(arch.name.toUpperCase(),W/2,470);
    const grad=ctx.createLinearGradient(W/2-90,0,W/2+90,0); grad.addColorStop(0,arch.gradient[0]); grad.addColorStop(1,arch.gradient[1]); ctx.fillStyle=grad; ctx.fillRect(W/2-80,494,160,4);
    ctx.fillStyle='#c5c5d6'; ctx.font='400 26px \"Space Grotesk\", sans-serif'; ctx.textAlign='center'; const afterDesc=wrapText(ctx,arch.description,W/2,550,780,36);
    ctx.fillStyle='#d9d9e6'; ctx.font='600 19px \"JetBrains Mono\", monospace'; ctx.fillText(arch.traits.join(' • ').toUpperCase(),W/2,afterDesc+34);
    const compat=COMPATIBILITY[arch.key];
    if(compat){ const pair=ARCHETYPES[compat.pair]; ctx.fillStyle='rgba(168,85,247,0.9)'; ctx.font='700 16px \"JetBrains Mono\"'; ctx.fillText(`BEST PAIR: ${pair.name.toUpperCase()}`,W/2,afterDesc+74); ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='400 15px \"Space Grotesk\"'; ctx.fillText(`"${compat.reason}"`,W/2,afterDesc+98); }
    ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(96,H-190); ctx.lineTo(W-96,H-190); ctx.stroke();
    const dateStr=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font='500 16px \"JetBrains Mono\"'; ctx.textAlign='left'; ctx.fillText(`Generated on ${dateStr}`,96,H-132);
    ctx.fillStyle='rgba(255,255,255,0.40)'; ctx.font='500 14px \"JetBrains Mono\"'; ctx.fillText(SITE_URL.replace('https://',''),96,H-108);
    try{
        const qrDataUrl=await generateQRCodeDataURL(SITE_URL);
        const qrImg=new Image(); qrImg.src=qrDataUrl;
        await new Promise(res=>{ qrImg.onload=res; qrImg.onerror=res; setTimeout(res,800); });
        const qrSize=108; const qrX=W-96-qrSize; const qrY=H-170;
        ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=22; ctx.strokeStyle=arch.color+'BB'; ctx.lineWidth=2; ctx.strokeRect(qrX-6,qrY-6,qrSize+12,qrSize+12); ctx.restore();
        ctx.drawImage(qrImg,qrX,qrY,qrSize,qrSize);
        ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='600 10px \"JetBrains Mono\"'; ctx.textAlign='center'; ctx.fillText('SCAN TO TRY',qrX+qrSize/2,qrY+qrSize+14);
    }catch(e){ console.warn('QR generation failed',e); }
    ctx.fillStyle='rgba(255,255,255,0.36)'; ctx.font='500 13px \"JetBrains Mono\"'; ctx.textAlign='right'; ctx.fillText(`ID: ${arch.key.toUpperCase()}-${Math.floor(1000+Math.random()*9000)}-X`,W-96,H-132);
    ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='400 13px \"JetBrains Mono\"'; ctx.fillText('BUILT FOR THE FUTURE • NO COOKIES. JUST CODE.',W/2,H-70);
    return canvas.toDataURL('image/png');
}
async function handleDownload(){
    if(!resultArchetype) return;
    DOM.downloadBtn.disabled=true; const original=DOM.downloadBtn.innerHTML; DOM.downloadBtn.innerHTML=`<span class="btn-inner"><span>⏳</span> Generating...</span>`;
    try{ const dataUrl=await generateResultCard(); const a=document.createElement('a'); a.href=dataUrl; a.download=`DevDNA-${resultArchetype.name.replace(/\s+/g,'-')}.png`; document.body.appendChild(a); a.click(); a.remove(); if(navigator.vibrate) navigator.vibrate([20,40,20]); }catch(e){ console.error('Canvas export failed',e); alert('Download failed - try again!'); } finally { DOM.downloadBtn.disabled=false; DOM.downloadBtn.innerHTML=original; }
}
async function handleShare(){
    if(!resultArchetype) return;
    const text=`I just discovered I'm a ${resultArchetype.name} on DevDNA! ⚡ Try it yourself at ${SHARE_URL}`;
    try{
        if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); }
        else { const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
        showToast();
    }catch{ prompt('Copy this text:',text); }
}
function showToast(){ DOM.toast.classList.remove('hidden'); DOM.toast.classList.add('show'); setTimeout(()=>{ DOM.toast.classList.remove('show'); DOM.toast.classList.add('hidden'); },2500); if(navigator.vibrate) navigator.vibrate(20); }

// ============================================================================
// Routing + Announcement FIX 7
// ============================================================================
function hideAllSections(){ [DOM.landing,DOM.quiz,DOM.result,DOM.locked,DOM.admin,DOM.uptime,DOM.notfound].forEach(s=>{ if(s){ s.style.display='none'; s.classList.remove('active'); } }); }
function showLanding(){
    hideAllSections(); closeAdminPanel();
    if(!currentSettings.eventLive){ showLocked(); return; }
    DOM.landing.style.display='block'; void DOM.landing.offsetWidth; DOM.landing.classList.add('active');
    if(bootDone){ runLandingTyping(); } // only after boot, guard prevents double
}
function showLocked(){ hideAllSections(); DOM.locked.style.display='block'; void DOM.locked.offsetWidth; DOM.locked.classList.add('active'); }
function showUptime(){ hideAllSections(); DOM.uptime.style.display='block'; void DOM.uptime.offsetWidth; DOM.uptime.classList.add('active'); startUptimeTimer(); }
function show404(){ hideAllSections(); DOM.notfoundHash.textContent=location.hash||'#'; DOM.notfound.style.display='block'; void DOM.notfound.offsetWidth; DOM.notfound.classList.add('active'); }
function handleRouter(){
    const hash=location.hash;
    DOM.revealSeq.classList.remove('active');
    if(hash==='#secret-admin-only'){ hideAllSections(); DOM.admin.style.display='flex'; openAdminPanel(); return; }
    if(hash==='#uptime-ping'){ showUptime(); return; }
    if(hash===''||hash==='#'||hash==='#landing'){ showLanding(); return; }
    if(['#quiz','#result'].includes(hash)){ if(DOM.result.classList.contains('active')||DOM.quiz.classList.contains('active')) return; showLanding(); return; }
    if(hash.startsWith('#')){ show404(); } else { showLanding(); }
}

// FIX 7: Announcement banner real-time + fixed top + has-banner class
function setupAnnouncementListener(){
    if(settingsUnsub) settingsUnsub();
    settingsUnsub=subscribeToSettings((settings)=>{
        currentSettings=settings;
        // Show/hide banner
        if(settings.announcementVisible && settings.announcement && settings.announcement.trim()!==''){
            DOM.announcementBanner.textContent=settings.announcement;
            DOM.announcementBanner.classList.add('show');
            document.body.classList.add('has-banner');
            // measure height for offset
            requestAnimationFrame(()=>{
                const h=DOM.announcementBanner.offsetHeight;
                document.documentElement.style.setProperty('--banner-height', `${h}px`);
            });
        } else {
            DOM.announcementBanner.classList.remove('show');
            document.body.classList.remove('has-banner');
            document.documentElement.style.setProperty('--banner-height','0px');
        }
        if(!settings.eventLive){
            if(!location.hash.includes('secret-admin-only') && !location.hash.includes('uptime-ping')){
                if(DOM.landing.classList.contains('active')||DOM.quiz.classList.contains('active')){ showLocked(); }
            }
        } else {
            if(DOM.locked.classList.contains('active')){ showLanding(); }
        }
    });
}

let uptimeInterval=null; let pageStart=Date.now();
function startUptimeTimer(){
    pageStart=pageStart||Date.now();
    if(uptimeInterval) clearInterval(uptimeInterval);
    function update(){
        const diff=Date.now()-pageStart;
        const hrs=Math.floor(diff/3600000).toString().padStart(2,'0');
        const mins=Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
        const secs=Math.floor((diff%60000)/1000).toString().padStart(2,'0');
        DOM.uptimeDuration.textContent=`${hrs}:${mins}:${secs}`;
        DOM.uptimeLast.textContent=new Date().toLocaleString();
        DOM.uptimeFirestore.textContent=isFirebaseConfigured()?'🟢 Connected':'🟠 Mock Mode';
    }
    update(); uptimeInterval=setInterval(update,1000);
}

// ============================================================================
// Init - FIX 1: Remove double showLanding
// ============================================================================
async function init(){
    console.log('%c🧬 DevDNA v2.1 Bug Fixed','color:#a855f7; font-size:16px; font-weight:bold;');
    initSound();
    initParticles();
    initMatrixRain();
    initCustomCursor();
    hideAllSections();
    DOM.bootScreen.style.display='flex';
    setupAnnouncementListener();
    await runBootScreen();
    bootDone=true;
    window.addEventListener('hashchange', handleRouter);
    handleRouter(); // single call — FIX 1: removed duplicate showLanding
    DOM.startBtn?.addEventListener('click', startQuiz);
    DOM.downloadBtn?.addEventListener('click', handleDownload);
    DOM.shareBtn?.addEventListener('click', handleShare);
    DOM.notfoundReturn?.addEventListener('click', ()=>{ location.hash=''; showLanding(); });
    document.addEventListener('keydown',(e)=>{
        if(DOM.landing.classList.contains('active') && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); startQuiz(); }
        if(DOM.quiz.classList.contains('active')){
            const map={'1':'0','2':'1','3':'2','4':'3','a':'0','b':'1','c':'2','d':'3','A':'0','B':'1','C':'2','D':'3'};
            if(map[e.key]!==undefined){ const btns=document.querySelectorAll('.option-card'); if(btns[map[e.key]]) btns[map[e.key]].click(); }
        }
    });
    window.__DevDNA={scores,ARCHETYPES,QUIZ_QUESTIONS,startQuiz,playSFX,SITE_URL};
    setupLeaderboard();
}
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }
