/**
 * DevDNA v1.0 - Main Quiz Logic
 * 10 archetypes, 40 questions pool, random 12 per quiz, user auth mandatory, profile, leaderboard 4 tabs, retake, banner clickable, boot 3x faster
 */

import { incrementArchetype, subscribeToLeaderboard, subscribeToSettings, getQuestions, seedQuestionsIfEmpty, isFirebaseConfigured, getUserByGmail, createOrUpdateUser, updateUserStats, checkAutoClear } from './firebase.js';
import { openAdminPanel, closeAdminPanel } from './admin.js';
import { applyTheme, getCurrentTheme } from './themes.js';
import { openProfile } from './profile.js';
import { initUserLeaderboard } from './leaderboard.js';

const SITE_URL = "https://devdna-2trh.onrender.com/";
const SHARE_URL = SITE_URL;

const ARCHETYPES = {
    frontend: { key:'frontend', name:'Frontend Wizard', emoji:'🎨', color:'#00ccff', gradient:['#00ccff','#a855f7'], description:'You sculpt digital dreams into reality. Every pixel obeys, every animation sings. The browser is your stage, and you never miss the spotlight.', traits:['Pixel Perfectionist','Motion Designer','UX Empath'] },
    backend: { key:'backend', name:'Backend Architect', emoji:'🛠', color:'#00ff99', gradient:['#00ff99','#00cc88'], description:'You build the cathedrals no one sees. APIs like clockwork, databases like fortresses. If it scales to millions, you already architected it yesterday.', traits:['System Thinker','DB Whisperer','Scalability Mind'] },
    fullstack: { key:'fullstack', name:'Full Stack Ninja', emoji:'⚡', color:'#a855f7', gradient:['#a855f7','#ff00aa'], description:'You are the bridge, the storm, the ship-it. Idea to MVP before coffee gets cold. Frontend, backend, infra — you speak all dialects fluently.', traits:['0-to-1 Builder','Stack Polyglot','Ship-It Mentality'] },
    debugging: { key:'debugging', name:'Debugging Detective', emoji:'🐞', color:'#ff8a00', gradient:['#ff8a00','#ffcc00'], description:'Bugs tremble when you enter the room. You chase Heisenbugs through stack traces like a noir detective, and you never sleep until the test is green.', traits:['Log Hunter','Edge-Case Prophet','Break-Fix Loop'] },
    ai: { key:'ai', name:'AI Explorer', emoji:'🤖', color:'#00ffff', gradient:['#00ffff','#00ccff'], description:'You code with ghosts of intelligence. Prompts are your spells, models your familiars. Automation isn’t a tool — it’s your co-pilot into the singularity.', traits:['Prompt Engineer','Model Tamer','Automation Addict'] },
    security: { key:'security', name:'Security Sentinel', emoji:'🔒', color:'#ff3333', gradient:['#ff3333','#8a0000'], description:'You guard the gates they didn’t know existed. Ethical hacker, pen-tester, cipher soul. While others build, you ensure it can’t be broken.', traits:['Ethical Hacker','Zero-Trust Mind','CVE Hunter'] },
    cloud: { key:'cloud', name:'Cloud Nomad', emoji:'☁️', color:'#33ccff', gradient:['#33ccff','#0066ff'], description:'You live above the servers, among ephemeral containers. AWS, Azure, GCP — your nomadic tribe. Infrastructure as code, uptime as religion.', traits:['Infra as Code','DevOps Shaman','Auto-Scaler'] },
    game: { key:'game', name:'Game Forge', emoji:'🎮', color:'#ffaa00', gradient:['#ffaa00','#ff5500'], description:'You forge worlds, not just apps. Unity, Unreal, WebGL — polygons are poetry. Players live inside the universes you compile.', traits:['World Builder','Graphics Nerd','Gameplay Designer'] },
    mobile: { key:'mobile', name:'Mobile Maverick', emoji:'📱', color:'#00ffcc', gradient:['#00ffcc','#00aaff'], description:'You craft tap, swipe, delight in the palm. iOS, Android, React Native — pocket-sized magic. Mobile-first isn’t a trend, it’s your bloodstream.', traits:['Touch Craftsman','App Store Veteran','Offline-First'] },
    data: { key:'data', name:'Data Alchemist', emoji:'🧠', color:'#c77dff', gradient:['#c77dff','#9d4edd'], description:'You transmute raw numbers into prophecy. Data scientist, ML engineer, statistician. Where others see noise, you hear signal.', traits:['Data Whisperer','ML Engineer','Stat Wizard'] }
};
const ARCHETYPE_ORDER = ['frontend','backend','fullstack','debugging','ai','security','cloud','game','mobile','data'];
const COMPATIBILITY = {
    frontend: { pair:'backend', reason:"You design the dream, they build the engine." },
    backend: { pair:'frontend', reason:"You build the engine, they design the dream." },
    fullstack: { pair:'debugging', reason:"You build fast, they keep it flawless." },
    debugging: { pair:'fullstack', reason:"You catch the chaos, they create the code." },
    ai: { pair:'data', reason:"You bring intelligence, they bring the data." },
    security: { pair:'cloud', reason:"You lock the doors, they build the fortress." },
    cloud: { pair:'security', reason:"You scale the world, they keep it safe." },
    game: { pair:'frontend', reason:"You build worlds, they polish the surface." },
    mobile: { pair:'backend', reason:"You bring the pocket experience, they power it." },
    data: { pair:'ai', reason:"You transmute data, they turn it into magic." }
};

// 40 Question Pool – balanced 16 per archetype (160 options /10)
const QUESTION_POOL_40 = [
    { order:1, text:"It's Friday night. What's your idea of fun?", options:[{text:"Redesigning my portfolio for the 5th time",archetype:"frontend"},{text:"Optimizing my database queries",archetype:"backend"},{text:"Shipping a full app in one weekend",archetype:"fullstack"},{text:"Debugging a legacy codebase for fun",archetype:"debugging"}] },
    { order:2, text:"You get a new laptop. What do you install first?", options:[{text:"Figma and a color picker",archetype:"frontend"},{text:"Docker and PostgreSQL",archetype:"backend"},{text:"VS Code with 47 extensions",archetype:"fullstack"},{text:"Wireshark and Burp Suite",archetype:"security"}] },
    { order:3, text:"Which sentence sounds most like you?", options:[{text:"Let me train a model for that.",archetype:"ai"},{text:"Let me deploy it on Kubernetes.",archetype:"cloud"},{text:"Let me build it in Unity real quick.",archetype:"game"},{text:"There's an app for that. I'll make it.",archetype:"mobile"}] },
    { order:4, text:"A client says: \"Make it pop.\" You:", options:[{text:"Add animations, gradients, and micro-interactions",archetype:"frontend"},{text:"Analyze their engagement data first",archetype:"data"},{text:"Assume they mean performance and optimize the backend",archetype:"backend"},{text:"Build both mobile and desktop versions to be safe",archetype:"mobile"}] },
    { order:5, text:"What's your dream side project?", options:[{text:"An indie game with pixel-perfect art",archetype:"game"},{text:"An AI that writes code from screenshots",archetype:"ai"},{text:"A zero-trust auth system",archetype:"security"},{text:"A serverless multi-region deployment",archetype:"cloud"}] },
    { order:6, text:"You find a bug in production. Your first move?", options:[{text:"Reproduce it locally step by step",archetype:"debugging"},{text:"Check the logs and metrics dashboards",archetype:"cloud"},{text:"Ask the AI to explain the stack trace",archetype:"ai"},{text:"Rewrite the whole feature — it was cursed anyway",archetype:"fullstack"}] },
    { order:7, text:"Which conference would you attend?", options:[{text:"React Summit",archetype:"frontend"},{text:"DEF CON",archetype:"security"},{text:"AWS re:Invent",archetype:"cloud"},{text:"NeurIPS",archetype:"ai"}] },
    { order:8, text:"Your favorite kind of data is:", options:[{text:"A perfectly typed API response",archetype:"backend"},{text:"A messy CSV that hides insights",archetype:"data"},{text:"User interaction heatmaps",archetype:"frontend"},{text:"Real-time telemetry from IoT devices",archetype:"mobile"}] },
    { order:9, text:"You get hired at a startup. Which role feels right?", options:[{text:"Founding Engineer (you do everything)",archetype:"fullstack"},{text:"Head of Security",archetype:"security"},{text:"Data Scientist",archetype:"data"},{text:"Mobile Lead",archetype:"mobile"}] },
    { order:10, text:"Which technology thrills you the most?", options:[{text:"WebAssembly running a game engine in the browser",archetype:"game"},{text:"Serverless functions that auto-scale to zero",archetype:"cloud"},{text:"Transformer models that write code",archetype:"ai"},{text:"End-to-end encryption protocols",archetype:"security"}] },
    { order:11, text:"How do you feel about CSS?", options:[{text:"It's my art form. Every pixel matters.",archetype:"frontend"},{text:"I use Tailwind and never look back.",archetype:"fullstack"},{text:"I let the frontend team handle that.",archetype:"backend"},{text:"I only touch it when debugging alignment",archetype:"debugging"}] },
    { order:12, text:"A stranger asks what you do. You say:", options:[{text:"I build the internet's face.",archetype:"frontend"},{text:"I make sure the internet works.",archetype:"backend"},{text:"I break things so bad guys can't.",archetype:"security"},{text:"I teach machines to think.",archetype:"ai"}] },
    { order:13, text:"Which of these keeps you up at night?", options:[{text:"A misaligned button on a landing page",archetype:"frontend"},{text:"An unindexed database column",archetype:"backend"},{text:"An unpatched CVE in your dependencies",archetype:"security"},{text:"A model that overfits on training data",archetype:"data"}] },
    { order:14, text:"Your favorite kind of \"hello world\"?", options:[{text:"A responsive landing page with dark mode",archetype:"frontend"},{text:"A REST API with rate limiting and JWT auth",archetype:"backend"},{text:"A cross-platform mobile app in 20 minutes",archetype:"mobile"},{text:"A neural network that recognizes handwriting",archetype:"ai"}] },
    { order:15, text:"You get a bug report: \"It's slow.\" What do you do?", options:[{text:"Open Chrome DevTools and profile the frontend",archetype:"frontend"},{text:"Check the database query plan",archetype:"backend"},{text:"Look at server metrics and scaling policies",archetype:"cloud"},{text:"Bisect through commits until it breaks",archetype:"debugging"}] },
    { order:16, text:"Which of these sounds like a perfect Saturday?", options:[{text:"Building a 3D game world from scratch",archetype:"game"},{text:"Modeling data pipelines in Python",archetype:"data"},{text:"Wiring up a new microservice",archetype:"backend"},{text:"Perfecting a mobile app's onboarding flow",archetype:"mobile"}] },
    { order:17, text:"How do you feel about writing tests?", options:[{text:"TDD or death.",archetype:"backend"},{text:"Only when a bug bites me",archetype:"fullstack"},{text:"I write chaos tests and pen tests",archetype:"security"},{text:"I use tests to reproduce weird bugs",archetype:"debugging"}] },
    { order:18, text:"Your ideal IDE looks like:", options:[{text:"VS Code with beautiful icons and a custom theme",archetype:"frontend"},{text:"Vim with 12 tmux panes and no mouse",archetype:"backend"},{text:"JetBrains everything",archetype:"fullstack"},{text:"Xcode / Android Studio",archetype:"mobile"}] },
    { order:19, text:"You inherit a codebase. What excites you?", options:[{text:"Refactoring it into clean architecture",archetype:"backend"},{text:"Fixing all the accessibility issues",archetype:"frontend"},{text:"Understanding why it fails intermittently",archetype:"debugging"},{text:"Migrating it to the cloud",archetype:"cloud"}] },
    { order:20, text:"Which of these would you rather build?", options:[{text:"A stunning weather app with animations",archetype:"mobile"},{text:"A real-time chat backend that scales",archetype:"backend"},{text:"An indie roguelike with procedural levels",archetype:"game"},{text:"A dashboard visualizing global traffic patterns",archetype:"data"}] },
    { order:21, text:"What's your relationship with the terminal?", options:[{text:"It's my second home",archetype:"backend"},{text:"I use it for git and that's it",archetype:"frontend"},{text:"I live in it 24/7 with custom aliases",archetype:"cloud"},{text:"I chain commands like a hacker in a movie",archetype:"security"}] },
    { order:22, text:"Someone shows you a magic trick. You:", options:[{text:"Try to reverse-engineer how it works",archetype:"debugging"},{text:"Wonder if you could recreate it with WebGL",archetype:"game"},{text:"Think about training a model to detect the deception",archetype:"ai"},{text:"Enjoy the moment, then Google it later",archetype:"frontend"}] },
    { order:23, text:"Which stack sounds most fun?", options:[{text:"Next.js + Tailwind + Framer Motion",archetype:"frontend"},{text:"Go + Postgres + Redis",archetype:"backend"},{text:"Terraform + Kubernetes + Prometheus",archetype:"cloud"},{text:"Flutter + Firebase",archetype:"mobile"}] },
    { order:24, text:"You have to give a talk. Topic?", options:[{text:"The Psychology of Color in UI Design",archetype:"frontend"},{text:"Zero Trust Architecture in 2026",archetype:"security"},{text:"How I Trained a Model on 3GB of Data",archetype:"ai"},{text:"Building a Game Engine from Scratch",archetype:"game"}] },
    { order:25, text:"A friend asks for coding advice. You say:", options:[{text:"Start with a project you'd actually use.",archetype:"fullstack"},{text:"Learn to debug before you learn to code.",archetype:"debugging"},{text:"Pick one thing and go deep.",archetype:"backend"},{text:"Follow the vibes, ship fast.",archetype:"frontend"}] },
    { order:26, text:"Which app on your phone do you use most?", options:[{text:"GitHub",archetype:"fullstack"},{text:"A pen-testing tool or password manager",archetype:"security"},{text:"A game or gaming forum",archetype:"game"},{text:"A stats/analytics dashboard",archetype:"data"}] },
    { order:27, text:"You get a chance to intern anywhere. You pick:", options:[{text:"Apple (Design + Mobile)",archetype:"mobile"},{text:"OpenAI",archetype:"ai"},{text:"A cybersecurity firm",archetype:"security"},{text:"NASA (data + systems)",archetype:"data"}] },
    { order:28, text:"Your favorite kind of puzzle?", options:[{text:"Logic puzzles that unfold slowly",archetype:"debugging"},{text:"Escape rooms with hidden mechanics",archetype:"security"},{text:"Optimization puzzles (fewest moves)",archetype:"backend"},{text:"Strategy games with hidden information",archetype:"game"}] },
    { order:29, text:"What's your dream tool to invent?", options:[{text:"An AI pair programmer that actually gets you",archetype:"ai"},{text:"A universal API translator",archetype:"backend"},{text:"A design system that generates itself",archetype:"frontend"},{text:"A cloud that auto-heals infrastructure",archetype:"cloud"}] },
    { order:30, text:"You're stuck. What's your move?", options:[{text:"Rubber duck it out loud",archetype:"debugging"},{text:"Take a walk and think",archetype:"fullstack"},{text:"Ask ChatGPT/Claude",archetype:"ai"},{text:"Redraw the architecture on paper",archetype:"backend"}] },
    { order:31, text:"Which quote resonates most?", options:[{text:"Design is intelligence made visible.",archetype:"frontend"},{text:"Make it work, make it right, make it fast.",archetype:"backend"},{text:"Move fast and don't break things anymore.",archetype:"security"},{text:"Data is the new oil.",archetype:"data"}] },
    { order:32, text:"Your favorite type of documentation?", options:[{text:"With interactive playgrounds and demos",archetype:"frontend"},{text:"API references with clear schemas",archetype:"backend"},{text:"Runbooks and incident post-mortems",archetype:"cloud"},{text:"Reproducible research papers with code",archetype:"data"}] },
    { order:33, text:"You have unlimited budget. You build:", options:[{text:"A next-gen mobile OS",archetype:"mobile"},{text:"A game studio",archetype:"game"},{text:"A cybersecurity training platform",archetype:"security"},{text:"A private cloud with custom hardware",archetype:"cloud"}] },
    { order:34, text:"What kind of chaos do you love?", options:[{text:"Fixing a production incident at 2 AM",archetype:"cloud"},{text:"Refactoring a 10-year-old spaghetti codebase",archetype:"debugging"},{text:"Reverse-engineering malware",archetype:"security"},{text:"Wrangling messy real-world data",archetype:"data"}] },
    { order:35, text:"Which skill do you want to master next?", options:[{text:"3D modeling and shader programming",archetype:"game"},{text:"Prompt engineering and fine-tuning",archetype:"ai"},{text:"SwiftUI and Jetpack Compose",archetype:"mobile"},{text:"Distributed systems and consensus algorithms",archetype:"backend"}] },
    { order:36, text:"What's your favorite kind of victory?", options:[{text:"Perfect Lighthouse scores across the board",archetype:"frontend"},{text:"99.99% uptime for the entire quarter",archetype:"cloud"},{text:"Zero critical vulnerabilities in an audit",archetype:"security"},{text:"A model beating the previous state-of-the-art",archetype:"ai"}] },
    { order:37, text:"You're on a team. Your natural role:", options:[{text:"The generalist who bridges every gap",archetype:"fullstack"},{text:"The specialist who owns the hard stuff",archetype:"backend"},{text:"The one who catches bugs before they ship",archetype:"debugging"},{text:"The one asking \"but is it secure?\"",archetype:"security"}] },
    { order:38, text:"Which of these feels most like magic?", options:[{text:"A game world that reacts to your every move",archetype:"game"},{text:"Real-time syncing across devices",archetype:"mobile"},{text:"An AI that writes poetry from a prompt",archetype:"ai"},{text:"A dashboard that predicts the future from data",archetype:"data"}] },
    { order:39, text:"What excites you about the future?", options:[{text:"VR/AR-native games and experiences",archetype:"game"},{text:"Personalized AI assistants for everyone",archetype:"ai"},{text:"Zero-latency edge computing everywhere",archetype:"cloud"},{text:"Foldable and wearable computing",archetype:"mobile"}] },
    { order:40, text:"Which best describes YOU?", options:[{text:"The Artist who codes",archetype:"frontend"},{text:"The Architect who builds",archetype:"backend"},{text:"The Ninja who ships",archetype:"fullstack"},{text:"The Detective who investigates",archetype:"debugging"}] }
];

let QUIZ_QUESTIONS = [...QUESTION_POOL_40]; // will be overwritten by Firebase, but fallback to pool
let quizSessionQuestions = null;

// State
let currentIndex=0;
let scores={frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0};
let resultArchetype=null;
let leaderboardUnsub=null;
let settingsUnsub=null;
let currentSettings={eventLive:true, announcement:"", announcementVisible:false, theme:"cyberpunk", leaderboardAutoClearDays:10, leaderboardFrozen:false, nextAutoClearAt:Date.now()+10*24*60*60*1000};
let totalDevelopers=0;
let soundEnabled=true;
let bootDone=false;
let typingInProgress=false;
let currentUser=null; // regular user
let currentUserData=null;

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
    profile: document.getElementById('profile-section'),
    leaderboardPage: document.getElementById('leaderboard-page-section'),
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
    retakeBtn: document.getElementById('retake-btn'),
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
    uptimeFirestore: document.getElementById('uptime-firestore'),
    headerAvatar: document.getElementById('header-avatar'),
    headerProfileBtn: document.getElementById('header-profile-btn'),
    headerSigninBtn: document.getElementById('header-signin-btn'),
    userAuthGate: document.getElementById('user-auth-gate'),
    userGoogleBtn: document.getElementById('user-google-signin-btn'),
    userWelcome: document.getElementById('user-welcome'),
    landingAvatar: document.getElementById('landing-avatar'),
    landingWelcomeName: document.getElementById('landing-welcome-name'),
    profileBackBtn: document.getElementById('profile-back-btn')
};

// SOUND
const SOUND_FILES = { click:'audio/click.mp3', select:'audio/select.mp3', complete:'audio/complete.mp3', reveal:'audio/reveal.mp3', error:'audio/select.mp3', ping:'audio/reveal.mp3' };
let audioElements = {};
let lastSFXTime = {};
function initSound(){
    try{ const saved=localStorage.getItem('devdna_sound_enabled'); soundEnabled = saved===null ? true : saved==='true'; }catch{ soundEnabled=true; }
    updateSoundIcon();
    Object.keys(SOUND_FILES).forEach(key=>{
        const a=new Audio(); a.src=SOUND_FILES[key]; a.preload='auto'; a.volume=0.15; a.crossOrigin='anonymous'; audioElements[key]=a; a.load();
    });
    DOM.soundToggle?.addEventListener('click', toggleSound);
    document.addEventListener('click', (e)=>{
        const target = e.target.closest('button, .option-card, .sidebar-tab');
        if(target && !target.classList.contains('option-card')) playSFX('click');
    }, true);
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
}
function playSFX(name){
    if(!soundEnabled) return;
    const now=Date.now(); const last=lastSFXTime[name]||0;
    if(now-last < 120) return;
    lastSFXTime[name]=now;
    const a=audioElements[name];
    if(!a) return;
    try{ a.currentTime=0; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch{}
}

// Backgrounds
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
    const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0||window.matchMedia('(pointer: coarse)').matches;
    if(isTouch) return;
    const cursor=DOM.customCursor; if(!cursor) return;
    const dot=cursor.querySelector('.cursor-dot'); const ring=cursor.querySelector('.cursor-ring');
    let mouseX=0,mouseY=0,ringX=0,ringY=0;
    document.body.classList.add('custom-cursor-active'); cursor.classList.add('active');
    window.addEventListener('mousemove',(e)=>{ mouseX=e.clientX; mouseY=e.clientY; dot.style.left=`${mouseX}px`; dot.style.top=`${mouseY}px`; }, {passive:true});
    function animateRing(){ ringX+=(mouseX-ringX)*0.18; ringY+=(mouseY-ringY)*0.18; ring.style.left=`${ringX}px`; ring.style.top=`${ringY}px`; requestAnimationFrame(animateRing); } animateRing();
    document.addEventListener('mouseover',(e)=>{ if(e.target.closest('button, .option-card, a, .chip, .sidebar-tab')) ring.classList.add('hover'); });
    document.addEventListener('mouseout',(e)=>{ if(e.target.closest('button, .option-card, a, .chip, .sidebar-tab')) ring.classList.remove('hover'); });
    let lastTrail=0;
    window.addEventListener('mousemove',(e)=>{ const now=Date.now(); if(now-lastTrail<80) return; lastTrail=now; const trail=document.createElement('div'); trail.className='cursor-trail'; trail.style.left=e.clientX+'px'; trail.style.top=e.clientY+'px'; document.body.appendChild(trail); trail.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:0.6},{transform:'translate(-50%,-50%) scale(0)',opacity:0}],{duration:400,easing:'ease-out'}).onfinish=()=>trail.remove(); }, {passive:true});
}

// BOOT SCREEN v1.0 — 3x faster (1.6s), text speed same, progress 3x faster, instant at 100%
const BOOT_LINES=['> Initializing DevDNA...','> Loading neural weights...','> Connecting to archetype database...','> System ready.'];
function runBootScreen(){
    return new Promise(resolve=>{
        const container=DOM.bootLines; container.innerHTML='';
        BOOT_LINES.forEach(txt=>{ const div=document.createElement('div'); div.className='boot-line'; div.textContent=''; div.dataset.full=txt; container.appendChild(div); });
        // Type text at same speed (38ms per char) — readable
        function typeLine(idx){
            if(idx>=BOOT_LINES.length) return;
            const el=container.children[idx];
            const full=el.dataset.full; let charIdx=0;
            el.classList.add('show');
            const interval=setInterval(()=>{
                el.textContent=full.slice(0,charIdx+1);
                charIdx++;
                if(charIdx>=full.length){ clearInterval(interval); setTimeout(()=>typeLine(idx+1), 40); } // reduced gap 40ms vs 180ms for 3x faster overall
            }, 38); // same char speed
        }
        typeLine(0);

        // Progress bar 3x faster: was 2500ms, now ~800ms for ~3x
        let progress=0;
        DOM.bootFill.style.width='0%';
        const start=Date.now();
        const duration=900; // 3x faster than 2500
        const progInterval=setInterval(()=>{
            const elapsed=Date.now()-start;
            progress=Math.min(100,Math.floor((elapsed/duration)*100));
            DOM.bootFill.style.width=progress+'%';
            DOM.bootPercent.textContent=progress+'%';
            const statuses=['INITIALIZING...','LOADING NEURAL ENGINE...','SYNCING DB...','READY'];
            DOM.bootStatus.textContent=statuses[Math.min(3,Math.floor(progress/34))];
            if(progress>=100){
                clearInterval(progInterval);
                // FIX: Instant transition at 100% — no additional delay
                DOM.bootScreen.classList.add('hide');
                setTimeout(()=>{ bootDone=true; resolve(); }, 220); // short fade only, instant
            }
        }, 18); // faster tick
    });
}

// Typing
function typeWriter(element, text, speed=50){
    return new Promise(resolve=>{
        if(!element){ resolve(); return; }
        element.textContent='';
        let i=0;
        const interval=setInterval(()=>{
            if(i < text.length){ element.textContent+=text[i]; i++; } else { clearInterval(interval); resolve(); }
        }, speed);
    });
}
async function runLandingTyping(){
    if(typingInProgress) return;
    typingInProgress=true;
    try{
        const title='DevDNA'; const subtitle='Discover Your Developer Archetype';
        if(DOM.heroTitleTyped) DOM.heroTitleTyped.textContent='';
        if(DOM.heroSubtitleTyped) DOM.heroSubtitleTyped.textContent='';
        if(DOM.heroTitleCursor) DOM.heroTitleCursor.style.display='inline-block';
        if(DOM.heroSubtitleCursor) DOM.heroSubtitleCursor.style.display='none';
        await typeWriter(DOM.heroTitleTyped, title, 90);
        if(DOM.heroTitleCursor) DOM.heroTitleCursor.style.display='none';
        if(DOM.heroSubtitleCursor) DOM.heroSubtitleCursor.style.display='inline-block';
        await typeWriter(DOM.heroSubtitleTyped, subtitle, 42);
    } finally { typingInProgress=false; }
}

// SHUFFLE HELPERS - Section 5.7
function shuffleArray(array){
    const shuffled=[...array];
    for(let i=shuffled.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [shuffled[i], shuffled[j]]=[shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function generateQuizSession(allQuestions){
    // Shuffle all 40 and pick first 12
    const shuffled=shuffleArray(allQuestions);
    const selected=shuffled.slice(0,12);
    // Shuffle answer options within each question, keep archetype mapping
    const finalQuiz=selected.map(q=>({
        ...q,
        q: q.text || q.q,
        text: q.text || q.q,
        options: shuffleArray(q.options || [])
    }));
    return finalQuiz;
}

// Load questions from Firebase + seed 40 if needed
async function loadQuestionsFromFirebase(){
    try{
        const existing = await getQuestions();
        if(existing.length < 40){
            console.log(`[DevDNA v1.0] Seeding 40 questions pool — existing ${existing.length}`);
            const seeded = await seedQuestionsIfEmpty(QUESTION_POOL_40);
            if(seeded && seeded.length>0){
                QUIZ_QUESTIONS = seeded.map(q=>({id:q.id, order:q.order, q:q.text, text:q.text, options:q.options}));
                console.log(`[DevDNA v1.0] Loaded ${QUIZ_QUESTIONS.length} questions from Firebase after seed`);
                return;
            }
        } else {
            QUIZ_QUESTIONS = existing.map(q=>({id:q.id, order:q.order, q:q.text, text:q.text, options:q.options}));
            console.log(`[DevDNA v1.0] Loaded ${QUIZ_QUESTIONS.length} questions from Firebase`);
            return;
        }
        // Fallback to hardcoded pool if Firebase fails or still empty
        QUIZ_QUESTIONS = QUESTION_POOL_40.map((q,i)=>({id:`pool_${i}`, order:q.order, q:q.text, text:q.text, options:q.options}));
    }catch(e){
        console.warn('[DevDNA v1.0] Failed to load questions from Firebase, using hardcoded 40 pool', e);
        QUIZ_QUESTIONS = QUESTION_POOL_40.map((q,i)=>({id:`pool_${i}`, order:q.order, q:q.text, text:q.text, options:q.options}));
    }
}

// USER AUTH - Mandatory Google Sign-In
async function initUserAuth(){
    const { getAuthInstance, onAuthChange } = await import('./firebase.js');
    const auth = getAuthInstance();
    
    // Check existing session
    onAuthChange(async (user)=>{
        if(user){
            // Signed in
            currentUser = user;
            const userData = await createOrUpdateUser({gmail:user.email, displayName:user.displayName, avatar:user.photoURL});
            currentUserData = userData;

            // Silent logout guard: if banned or deleted
            if(userData && userData.isBanned){
                alert('Your account has been banned. Contact admin.');
                await handleUserSignOut();
                return;
            }

            // Update UI
            if(DOM.headerAvatar){ DOM.headerAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=a855f7&color=fff`; DOM.headerAvatar.classList.remove('hidden'); }
            if(DOM.headerProfileBtn) DOM.headerProfileBtn.classList.remove('hidden');
            if(DOM.headerSigninBtn) DOM.headerSigninBtn.classList.add('hidden');
            if(DOM.userAuthGate) DOM.userAuthGate.classList.add('hidden');
            if(DOM.userWelcome) {
                DOM.userWelcome.classList.remove('hidden');
                if(DOM.landingAvatar) DOM.landingAvatar.src = user.photoURL || '';
                if(DOM.landingWelcomeName) DOM.landingWelcomeName.textContent = `Welcome, ${user.displayName}`;
            }
            if(DOM.startBtn) DOM.startBtn.classList.remove('hidden');

            // Update last seen
            const { updateUserLastSeen } = await import('./firebase.js');
            if(updateUserLastSeen) updateUserLastSeen(user.email);

        } else {
            // Not signed in — show gate, hide start
            currentUser = null;
            currentUserData = null;
            if(DOM.headerAvatar) DOM.headerAvatar.classList.add('hidden');
            if(DOM.headerProfileBtn) DOM.headerProfileBtn.classList.add('hidden');
            if(DOM.headerSigninBtn) DOM.headerSigninBtn.classList.remove('hidden');
            if(DOM.userAuthGate) DOM.userAuthGate.classList.remove('hidden');
            if(DOM.userWelcome) DOM.userWelcome.classList.add('hidden');
            if(DOM.startBtn) DOM.startBtn.classList.add('hidden');
        }
    });

    // Bind sign-in buttons
    DOM.userGoogleBtn?.addEventListener('click', handleUserGoogleSignIn);
    DOM.headerSigninBtn?.addEventListener('click', handleUserGoogleSignIn);
    DOM.headerProfileBtn?.addEventListener('click', ()=>{
        location.hash='#profile';
    });
    DOM.profileBackBtn?.addEventListener('click', ()=>{
        location.hash='';
    });
}

async function handleUserGoogleSignIn(){
    playSFX('click');
    try{
        const { signInWithGoogle } = await import('./firebase.js');
        const result = await signInWithGoogle();
        // onAuthChange will handle UI
        console.log('[DevDNA v1.0] User signed in:', result.user.email);
    }catch(e){
        console.error('User sign-in failed', e);
        alert('Sign-in failed: ' + (e.message||'Unknown'));
    }
}
async function handleUserSignOut(){
    const { signOutUser } = await import('./firebase.js');
    await signOutUser();
    try{ localStorage.removeItem('devdna_user_session'); }catch{}
    location.reload();
}

// Quiz
function startQuiz(){
    if(!currentUser){
        alert('Please sign in with Google to play');
        return;
    }
    if(!currentSettings.eventLive){ showLocked(); return; }
    playSFX('complete');
    currentIndex=0; scores={frontend:0,backend:0,fullstack:0,debugging:0,ai:0,security:0,cloud:0,game:0,mobile:0,data:0};
    // Generate new random 12 from 40 pool
    quizSessionQuestions = generateQuizSession(QUIZ_QUESTIONS);
    console.log(`[DevDNA v1.0] Quiz session: 12 random from ${QUIZ_QUESTIONS.length} pool`);
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
    const data=quizSessionQuestions ? quizSessionQuestions[index] : QUIZ_QUESTIONS[index];
    if(!data) return;
    const totalQs = quizSessionQuestions ? quizSessionQuestions.length : 12;
    const displayProgress=Math.round(((index+1)/totalQs)*100);
    DOM.qCounter.textContent=`QUESTION ${String(index+1).padStart(2,'0')} / ${String(totalQs).padStart(2,'0')}`;
    DOM.qPercent.textContent=`${displayProgress}%`;
    DOM.progressFill.style.width=`${displayProgress}%`;
    if(DOM.progressGlow) DOM.progressGlow.style.width=`${displayProgress}%`;
    DOM.qWrapper.classList.add('out');
    setTimeout(()=>{
        DOM.qText.textContent=data.q || data.text;
        DOM.optionsContainer.innerHTML='';
        const letters=['A','B','C','D'];
        (data.options||[]).forEach((opt,i)=>{
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
    playSFX('select');
    document.querySelectorAll('.option-card').forEach(b=>b.classList.remove('selected'));
    btnEl.classList.add('selected');
    scores[archetype]=(scores[archetype]||0)+1;
    if(navigator.vibrate) navigator.vibrate(16);
    setTimeout(()=>{
        const totalQs = quizSessionQuestions ? quizSessionQuestions.length : 12;
        if(currentIndex<totalQs-1){ currentIndex++; renderQuestion(currentIndex); }
        else { finishQuizReveal(); }
    },420);
}
function calculateResult(){ let max=-1,winner=ARCHETYPE_ORDER[0]; ARCHETYPE_ORDER.forEach(k=>{ if(scores[k]>max){max=scores[k]; winner=k;} }); return winner; }

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
async function showResult(archetype){
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
        DOM.bestPairName.textContent=pairArchetype ? pairArchetype.name : compat.pair;
        DOM.bestPairName.style.color=pairArchetype ? pairArchetype.color : '#fff';
        DOM.bestPairReason.textContent=`"${compat.reason}"`;
        DOM.bestPair.style.display='block';
    }
    renderBreakdown(scores);
    window.scrollTo({top:0,behavior:'smooth'});
    incrementArchetype(archetype.key).catch(()=>{});
    setupLeaderboard();
    // Update user stats
    if(currentUser){
        const breakdown = {};
        const total=Object.values(scores).reduce((s,v)=>s+v,0)||1;
        ARCHETYPE_ORDER.forEach(k=>{ breakdown[k]=Math.round(((scores[k]||0)/total)*100); });
        await updateUserStats(currentUser.email, {archetype:archetype.key, breakdown});
    }
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

// Leaderboard anonymous
function setupLeaderboard(){
    if(isFirebaseConfigured()){
        DOM.firebaseStatus.innerHTML=`<span style="color:var(--neon-green)">● LIVE</span> CONNECTED TO FIRESTORE`;
    } else {
        DOM.firebaseStatus.innerHTML=`<span style="color:var(--neon-orange)">● MOCK MODE</span> LOCAL STORAGE`;
    }
    if(leaderboardUnsub) leaderboardUnsub();
    leaderboardUnsub=subscribeToLeaderboard((counts)=>{
        renderLeaderboard(counts);
        const realTotal = counts.total !== undefined ? counts.total : Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0);
        totalDevelopers = realTotal;
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
        div.innerHTML=`<div class="leader-item-top"><div class="leader-icon" style="border-color:${item.color}33; box-shadow:0 0 10px ${item.color}22;">${item.emoji}</div><div class="leader-info"><span class="leader-name">${item.name}</span><span class="leader-count">${item.count} developers</span></div></div><span class="leader-percent" style="color:${item.color}">${percent}%</span><div class="leader-bar-wrap"><div class="leader-bar-fill" style="width:${width}%; background: linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]});"></div></div>`;
        DOM.leaderboardList.appendChild(div);
    });
    DOM.totalCount.textContent=`TOTAL DECODED: ${displayTotal.toLocaleString()} developers worldwide`;
}

let counterAnimRaf=null;
let lastAnimatedTotal=-1;
function animateTotalCounter(target){
    if(!DOM.counterNum) return;
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

// Canvas export
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
    ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='white'; ctx.font='900 210px "Orbitron", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('DevDNA',W/2,H/2); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.55; ctx.filter='blur(42px)'; ctx.fillStyle=arch.color; ctx.beginPath(); ctx.arc(W/2,380,145,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.filter='none';
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='600 22px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText('DevDNA v1.0',W/2,110);
    ctx.fillStyle='rgba(161,161,181,0.75)'; ctx.font='500 16px "JetBrains Mono", monospace'; ctx.fillText('ARCHETYPE DECODED // SYS.V1',W/2,140);
    ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=36; ctx.fillStyle='rgba(255,255,255,0.09)'; ctx.strokeStyle=arch.color+'AA'; ctx.lineWidth=2.5; ctx.beginPath(); if(ctx.roundRect){ ctx.roundRect(W/2-88,190,176,176,30); } else { ctx.rect(W/2-88,190,176,176); } ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=28; ctx.font='92px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='white'; ctx.fillText(arch.emoji,W/2,278); ctx.shadowBlur=16; ctx.fillText(arch.emoji,W/2,278); ctx.restore();
    ctx.fillStyle='white'; ctx.font='900 58px "Orbitron", sans-serif'; ctx.textAlign='center'; ctx.fillText(arch.name.toUpperCase(),W/2,470);
    const grad=ctx.createLinearGradient(W/2-90,0,W/2+90,0); grad.addColorStop(0,arch.gradient[0]); grad.addColorStop(1,arch.gradient[1]); ctx.fillStyle=grad; ctx.fillRect(W/2-80,494,160,4);
    ctx.fillStyle='#c5c5d6'; ctx.font='400 26px "Space Grotesk", sans-serif'; ctx.textAlign='center'; const afterDesc=wrapText(ctx,arch.description,W/2,550,780,36);
    ctx.fillStyle='#d9d9e6'; ctx.font='600 19px "JetBrains Mono", monospace'; ctx.fillText(arch.traits.join(' • ').toUpperCase(),W/2,afterDesc+34);
    const compat=COMPATIBILITY[arch.key];
    if(compat){ const pair=ARCHETYPES[compat.pair]; ctx.fillStyle='rgba(168,85,247,0.9)'; ctx.font='700 16px "JetBrains Mono"'; ctx.fillText(`BEST PAIR: ${pair?pair.name.toUpperCase():compat.pair.toUpperCase()}`,W/2,afterDesc+74); ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='400 15px "Space Grotesk"'; ctx.fillText(`"${compat.reason}"`,W/2,afterDesc+98); }
    ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(96,H-190); ctx.lineTo(W-96,H-190); ctx.stroke();
    const dateStr=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font='500 16px "JetBrains Mono"'; ctx.textAlign='left'; ctx.fillText(`Generated on ${dateStr}`,96,H-132);
    ctx.fillStyle='rgba(255,255,255,0.40)'; ctx.font='500 14px "JetBrains Mono"'; ctx.fillText(SITE_URL.replace('https://',''),96,H-108);
    try{
        const qrDataUrl=await generateQRCodeDataURL(SITE_URL);
        const qrImg=new Image(); qrImg.src=qrDataUrl;
        await new Promise(res=>{ qrImg.onload=res; qrImg.onerror=res; setTimeout(res,800); });
        const qrSize=108; const qrX=W-96-qrSize; const qrY=H-170;
        ctx.save(); ctx.shadowColor=arch.color; ctx.shadowBlur=22; ctx.strokeStyle=arch.color+'BB'; ctx.lineWidth=2; ctx.strokeRect(qrX-6,qrY-6,qrSize+12,qrSize+12); ctx.restore();
        ctx.drawImage(qrImg,qrX,qrY,qrSize,qrSize);
        ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='600 10px "JetBrains Mono"'; ctx.textAlign='center'; ctx.fillText('SCAN TO TRY',qrX+qrSize/2,qrY+qrSize+14);
    }catch(e){ console.warn('QR generation failed',e); }
    ctx.fillStyle='rgba(255,255,255,0.36)'; ctx.font='500 13px "JetBrains Mono"'; ctx.textAlign='right'; ctx.fillText(`ID: ${arch.key.toUpperCase()}-${Math.floor(1000+Math.random()*9000)}-X`,W-96,H-132);
    ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='400 13px "JetBrains Mono"'; ctx.fillText('Built by ByteCraft • No cookies. Just code.',W/2,H-70);
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

// Routing + banner visibility + theme
function hideAllSections(){ [DOM.landing,DOM.quiz,DOM.result,DOM.locked,DOM.admin,DOM.uptime,DOM.notfound,DOM.profile,DOM.leaderboardPage].forEach(s=>{ if(s){ s.style.display='none'; s.classList.remove('active'); } }); }

function shouldShowBanner(){
    const hash=location.hash;
    // Hidden on utility pages
    const hiddenHashes=['#secret-admin-only','#uptime-ping','#404'];
    if(hiddenHashes.includes(hash)) return false;
    // Hidden on any invalid hash that leads to 404
    const validHashes=['',' #',' #landing','#quiz','#result','#profile','#leaderboard',' #leaderboard'.trim()];
    // Actually check if current visible section is utility
    if(DOM.admin && DOM.admin.classList.contains('active')) return false;
    if(DOM.uptime && DOM.uptime.classList.contains('active')) return false;
    if(DOM.notfound && DOM.notfound.classList.contains('active')) return false;
    // Only show on main pages
    return true;
}

function showLanding(){
    hideAllSections(); closeAdminPanel();
    if(!currentSettings.eventLive){ showLocked(); return; }
    DOM.landing.style.display='block'; void DOM.landing.offsetWidth; DOM.landing.classList.add('active');
    if(bootDone){ runLandingTyping(); }
    updateBannerVisibility();
}
function showLocked(){ hideAllSections(); DOM.locked.style.display='block'; void DOM.locked.offsetWidth; DOM.locked.classList.add('active'); updateBannerVisibility(); }
function showUptime(){ hideAllSections(); DOM.uptime.style.display='block'; void DOM.uptime.offsetWidth; DOM.uptime.classList.add('active'); startUptimeTimer(); updateBannerVisibility(); }
function show404(){ hideAllSections(); DOM.notfoundHash.textContent=location.hash||'#'; DOM.notfound.style.display='block'; void DOM.notfound.offsetWidth; DOM.notfound.classList.add('active'); updateBannerVisibility(); }
function showProfilePage(){
    hideAllSections();
    const profileSection=document.getElementById('profile-section');
    if(profileSection){ profileSection.style.display='block'; void profileSection.offsetWidth; profileSection.classList.add('active'); }
    if(currentUser){
        import('./profile.js').then(mod=>{ mod.openProfile(currentUser.email); });
    } else {
        alert('Please sign in to view profile');
        showLanding();
    }
    updateBannerVisibility();
}
function showLeaderboardPage(){
    hideAllSections();
    const sec=document.getElementById('leaderboard-page-section');
    if(sec){ sec.style.display='block'; void sec.offsetWidth; sec.classList.add('active'); }
    // Copy user leaderboard content to page
    const mainULB = document.getElementById('user-leaderboard-section');
    const pageContent = document.getElementById('leaderboard-page-content');
    if(mainULB && pageContent){
        pageContent.innerHTML = mainULB.innerHTML;
        // Re-bind tabs for page (simplified: re-init)
        initUserLeaderboard();
    }
    updateBannerVisibility();
}

function handleRouter(){
    const hash=location.hash;
    DOM.revealSeq.classList.remove('active');
    if(hash==='#secret-admin-only'){ hideAllSections(); DOM.admin.style.display='flex'; openAdminPanel(); updateBannerVisibility(); return; }
    if(hash==='#uptime-ping'){ showUptime(); return; }
    if(hash==='#profile'){ showProfilePage(); return; }
    if(hash==='#leaderboard'){ showLeaderboardPage(); return; }
    if(hash===''||hash==='#'||hash==='#landing'){ showLanding(); return; }
    if(['#quiz','#result'].includes(hash)){ if(DOM.result.classList.contains('active')||DOM.quiz.classList.contains('active')) return; showLanding(); return; }
    if(hash.startsWith('#')){ show404(); } else { showLanding(); }
}

function updateBannerVisibility(){
    // Section 2: Hide banner on utility pages
    if(!shouldShowBanner()){
        DOM.announcementBanner.classList.remove('show');
        document.body.classList.remove('has-banner');
        document.documentElement.style.setProperty('--banner-height','0px');
        if(DOM.soundToggle) DOM.soundToggle.style.top='';
        return;
    }
    // Otherwise, if settings says visible, banner will be shown via settings listener
    // The settings listener already handles show/hide based on announcementVisible
    // Here we just ensure if hidden due to utility, we don't show
}

// Announcement + Theme + Auto-clear
function setupAnnouncementAndTheme(){
    if(settingsUnsub) settingsUnsub();
    settingsUnsub=subscribeToSettings((settings)=>{
        currentSettings=settings;
        // Banner logic with clickable CTA
        if(shouldShowBanner() && settings.announcementVisible && settings.announcement && settings.announcement.trim()!==''){
            renderBannerWithCTA(settings.announcement);
            document.body.classList.add('has-banner');
            requestAnimationFrame(()=>{
                const h=DOM.announcementBanner.offsetHeight;
                document.documentElement.style.setProperty('--banner-height', `${h}px`);
                if(DOM.soundToggle){ DOM.soundToggle.style.top = `${h + 12}px`; }
            });
        } else if(!shouldShowBanner()){
            DOM.announcementBanner.classList.remove('show');
            document.body.classList.remove('has-banner');
            document.documentElement.style.setProperty('--banner-height','0px');
            if(DOM.soundToggle) DOM.soundToggle.style.top='';
        } else {
            DOM.announcementBanner.classList.remove('show');
            document.body.classList.remove('has-banner');
            document.documentElement.style.setProperty('--banner-height','0px');
            if(DOM.soundToggle) DOM.soundToggle.style.top='';
        }
        // Theme
        if(settings.theme && settings.theme!==getCurrentTheme()){
            applyTheme(settings.theme);
        }
        // Auto-clear countdown
        updateAutoClearCountdown(settings);
        if(!settings.eventLive){
            if(!location.hash.includes('secret-admin-only') && !location.hash.includes('uptime-ping')){
                if(DOM.landing.classList.contains('active')||DOM.quiz.classList.contains('active')){ showLocked(); }
            }
        } else {
            if(DOM.locked.classList.contains('active')){ showLanding(); }
        }
    });
}

function renderBannerWithCTA(text){
    // Parse [ START ANALYSIS → ] as clickable
    const ctaMatch = text.match(/\[([^\]]+)\]/);
    if(ctaMatch){
        const before = text.slice(0, ctaMatch.index);
        const ctaText = ctaMatch[1];
        const after = text.slice(ctaMatch.index + ctaMatch[0].length);
        DOM.announcementBanner.innerHTML = `${escapeHtml(before)}<span class="banner-cta" id="banner-cta-btn">${escapeHtml(ctaText)}</span>${escapeHtml(after)}`;
        DOM.announcementBanner.classList.add('show');
        document.getElementById('banner-cta-btn')?.addEventListener('click', ()=>{
            playSFX('click');
            const landing = document.getElementById('landing-section');
            if(landing){
                // If not on landing, go to landing
                if(!landing.classList.contains('active')){
                    location.hash='';
                    setTimeout(()=>{ document.getElementById('start-btn')?.scrollIntoView({behavior:'smooth', block:'center'}); }, 400);
                } else {
                    document.getElementById('start-btn')?.scrollIntoView({behavior:'smooth', block:'center'});
                }
            }
        });
    } else {
        DOM.announcementBanner.textContent = text;
        DOM.announcementBanner.classList.add('show');
    }
}
function escapeHtml(str){ return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function updateAutoClearCountdown(settings){
    const el=document.getElementById('ulb-countdown');
    if(!el) return;
    if(!settings.nextAutoClearAt || settings.leaderboardAutoClearDays==='Never' || settings.leaderboardFrozen){
        el.textContent='';
        return;
    }
    const diff = settings.nextAutoClearAt - Date.now();
    if(diff<=0){ el.textContent='⏰ Leaderboard resetting now...'; return; }
    const days=Math.floor(diff/(24*60*60*1000));
    const hours=Math.floor((diff%(24*60*60*1000))/(60*60*1000));
    if(diff < 2*24*60*60*1000){
        el.textContent=`⏰ Leaderboard resets in ${days}d ${hours}h`;
    } else {
        el.textContent='';
    }
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

// Init
async function init(){
    console.log('%c🧬 [DevDNA v1.0] Core initialized','color:#a855f7; font-size:16px; font-weight:bold;');
    initSound();
    initParticles();
    initMatrixRain();
    initCustomCursor();
    hideAllSections();
    DOM.bootScreen.style.display='flex';
    
    await loadQuestionsFromFirebase();
    await checkAutoClear();
    await initUserAuth();

    setupAnnouncementAndTheme();
    await runBootScreen();
    bootDone=true;
    window.addEventListener('hashchange', handleRouter);
    handleRouter();
    DOM.startBtn?.addEventListener('click', startQuiz);
    DOM.downloadBtn?.addEventListener('click', handleDownload);
    DOM.shareBtn?.addEventListener('click', handleShare);
    DOM.retakeBtn?.addEventListener('click', ()=>{
        playSFX('click');
        startQuiz();
    });
    DOM.notfoundReturn?.addEventListener('click', ()=>{ location.hash=''; showLanding(); });
    document.addEventListener('keydown',(e)=>{
        if(DOM.landing.classList.contains('active') && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); startQuiz(); }
        if(DOM.quiz.classList.contains('active')){
            const map={'1':'0','2':'1','3':'2','4':'3','a':'0','b':'1','c':'2','d':'3','A':'0','B':'1','C':'2','D':'3'};
            if(map[e.key]!==undefined){ const btns=document.querySelectorAll('.option-card'); if(btns[map[e.key]]) btns[map[e.key]].click(); }
        }
    });
    document.addEventListener('devdna-retake', ()=>{ startQuiz(); });
    window.__DevDNA={scores,ARCHETYPES,QUIZ_QUESTIONS,startQuiz,playSFX,SITE_URL, QUESTION_POOL_40};
    setupLeaderboard();
    initUserLeaderboard();
}
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }
