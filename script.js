/**
 * DevDNA - Main Application Logic
 * -------------------------------------------------
 * Vanilla JS, Modular, No Global Pollution
 * Features:
 * - Background particle system
 * - 12-question archetype quiz
 * - Result calculation & canvas export
 * - Firestore leaderboard (real-time) with local fallback
 */

import { incrementArchetype, subscribeToLeaderboard, isFirebaseConfigured } from './firebase.js';

// ============================================================================
// DATA: Archetypes
// ============================================================================
const ARCHETYPES = {
    frontend: {
        key: 'frontend',
        name: 'Frontend Wizard',
        short: 'Frontend Wizard',
        emoji: '🎨',
        color: '#00ccff',
        gradient: ['#00ccff', '#a855f7'],
        description: 'You craft pixel-perfect realities. Obsessed with motion, aesthetics, and user delight. For you, the web isn’t code — it’s canvas.',
        traits: ['UI Obsessed', 'Animation Nerd', 'Pixel Perfectionist'],
        long: 'Frontend Wizard lives for that 60fps scroll. You notice 2px misalignments, argue about easing curves, and turn Figma into reality.'
    },
    backend: {
        key: 'backend',
        name: 'Backend Architect',
        short: 'Backend Architect',
        emoji: '🛠',
        color: '#00ff99',
        gradient: ['#00ff99', '#00cc88'],
        description: 'You build fortresses that scale. Databases, queues, auth flows — your mind thinks in diagrams. If it can’t handle 1M req/s, it’s not done.',
        traits: ['Scalability Mind', 'DB Whisperer', 'API Craftsman'],
        long: 'Systems bow to you. You dream in ER diagrams and wake up optimizing queries. Uptime is your love language.'
    },
    fullstack: {
        key: 'fullstack',
        name: 'Full Stack Ninja',
        short: 'Full Stack Ninja',
        emoji: '⚡',
        color: '#a855f7',
        gradient: ['#a855f7', '#ff00aa'],
        description: 'Idea → MVP in 48 hours. You connect dots others don’t see. Frontend, backend, deploy — you ship the whole damn product.',
        traits: ['Ship-It Mentality', '0-to-1 Builder', 'Stack Polyglot'],
        long: 'You are dangerous at 2 AM with coffee. While others debate, you’ve already deployed. Product is your playground.'
    },
    debugging: {
        key: 'debugging',
        name: 'Debugging Detective',
        short: 'Debugging Detective',
        emoji: '🐞',
        color: '#ff8a00',
        gradient: ['#ff8a00', '#ffcc00'],
        description: 'Bugs fear you. You hunt Heisenbugs for fun, read stack traces like novels, and won’t sleep until the green tick appears.',
        traits: ['Log Hunter', 'Edge Case Prophet', 'Break-Fix Loop'],
        long: 'You thrive where others panic. A mysterious crash? That’s your summons. You reverse-engineer chaos into clarity.'
    },
    ai: {
        key: 'ai',
        name: 'AI Explorer',
        short: 'AI Explorer',
        emoji: '🤖',
        color: '#00ffff',
        gradient: ['#00ffff', '#00ccff'],
        description: 'You’re coding with the future. Prompts, vectors, models — you see code as intelligence. Automation isn’t a tool, it’s your teammate.',
        traits: ['Prompt Engineer', 'Model Tamer', 'Automation Addict'],
        long: 'While others write loops, you teach machines to write loops. LLMs, RAG, fine-tuning — your playground is the singularity.'
    }
};

// Order for tie-breaking (deterministic)
const ARCHETYPE_ORDER = ['frontend', 'backend', 'fullstack', 'debugging', 'ai'];

// ============================================================================
// DATA: 12 Quiz Questions
// Each question has 4 options mapped to archetypes
// ============================================================================
const QUIZ_QUESTIONS = [
    {
        q: "You get an empty repo at hackathon kickoff. What’s your first commit?",
        options: [
            { text: "Design system, Tailwind, Framer Motion — make it feel alive.", archetype: "frontend" },
            { text: "DB schema, auth, REST API skeleton. Solid foundations first.", archetype: "backend" },
            { text: "Monorepo, frontend + backend + CI + deploy. Full pipeline.", archetype: "fullstack" },
            { text: "A script that uses an LLM to scaffold the whole thing from README.", archetype: "ai" }
        ]
    },
    {
        q: "Production crashes 5 minutes before the demo. Your instinct?",
        options: [
            { text: "Add a gorgeous fallback UI and skeleton loaders so users don’t panic.", archetype: "frontend" },
            { text: "SSH in, check logs, scale up, fix the race condition.", archetype: "backend" },
            { text: "Reproduce step-by-step, bisect commits, write a minimal failing test.", archetype: "debugging" },
            { text: "Paste the trace into AI and ask it to hypothesize root causes.", archetype: "ai" }
        ]
    },
    {
        q: "Your dream side project on a weekend?",
        options: [
            { text: "Recreating Linear.app’s homepage animations — but better.", archetype: "frontend" },
            { text: "Building a real-time collaborative engine with WebSockets & Redis.", archetype: "backend" },
            { text: "Shipping a full SaaS: landing, payments, dashboard, analytics.", archetype: "fullstack" },
            { text: "Finding a memory leak that’s haunted your old project for months.", archetype: "debugging" }
        ]
    },
    {
        q: "How do you prefer to learn new tech?",
        options: [
            { text: "Clone a Dribbble shot and make it interactive.", archetype: "frontend" },
            { text: "Read RFCs, benchmarks, and source code. Understand internals.", archetype: "backend" },
            { text: "Build an end-to-end app in 48 hours and learn by shipping.", archetype: "fullstack" },
            { text: "Break it intentionally to map every edge case and failure mode.", archetype: "debugging" }
        ]
    },
    {
        q: "In a team, people know you as...",
        options: [
            { text: "“8px vs 16px matters”. The eye for detail.", archetype: "frontend" },
            { text: "“What about concurrency?” — the systems thinker.", archetype: "backend" },
            { text: "“Wait, it’s already deployed.” — the shipper.", archetype: "fullstack" },
            { text: "“I automated our onboarding with agents.” — the AI guy/gal.", archetype: "ai" }
        ]
    },
    {
        q: "What gives you the biggest dopamine hit?",
        options: [
            { text: "That buttery 120fps page transition finally working.", archetype: "frontend" },
            { text: "Query going from 2.3s → 18ms after indexing.", archetype: "backend" },
            { text: "Hitting ‘Deploy’ and seeing paying users in first hour.", archetype: "fullstack" },
            { text: "Finally catching that heisenbug after 6 hours of logs.", archetype: "debugging" }
        ]
    },
    {
        q: "AI to you is...",
        options: [
            { text: "A co-designer. Generate palettes, icons, UI variants instantly.", archetype: "frontend" },
            { text: "A co-architect. Optimizes infra, writes tests, scales alerts.", archetype: "backend" },
            { text: "A co-founder. Builds features while I sleep.", archetype: "ai" },
            { text: "A debugger buddy. Explains stack traces at 3 AM.", archetype: "debugging" }
        ]
    },
    {
        q: "System design interview: You have 45 mins. You focus on?",
        options: [
            { text: "User flows, states, optimistic UI, offline handling.", archetype: "frontend" },
            { text: "Partitioning, replication, consistency, CAP tradeoffs.", archetype: "backend" },
            { text: "MVP scope, tech choices, tradeoffs, launch plan.", archetype: "fullstack" },
            { text: "Failure modes, monitoring, rollbacks, chaos testing.", archetype: "debugging" }
        ]
    },
    {
        q: "Under pressure, you...",
        options: [
            { text: "Protect UX at all costs — degrade gracefully with style.", archetype: "frontend" },
            { text: "Protect data — no compromise on integrity & uptime.", archetype: "backend" },
            { text: "Protect the launch — cut scope, keep shipping.", archetype: "fullstack" },
            { text: "Protect future self — log everything, blame no one.", archetype: "debugging" }
        ]
    },
    {
        q: "If programming languages were weapons, you’d pick?",
        options: [
            { text: "A lightsaber — elegant, precise, flashy (TypeScript + GSAP).", archetype: "frontend" },
            { text: "A bunker blueprint — unbreakable, scalable (Rust, Go).", archetype: "backend" },
            { text: "Swiss army knife — handy everywhere (Next.js, Supabase).", archetype: "fullstack" },
            { text: "An AI drone that learns on its own (Python + LangChain).", archetype: "ai" }
        ]
    },
    {
        q: "You inherit terrifying legacy code. First move?",
        options: [
            { text: "Refactor UI layer, add Storybook, bring delight back.", archetype: "frontend" },
            { text: "Trace data flow, add observability, contain blast radius.", archetype: "backend" },
            { text: "Write a parser to auto-document and auto-test everything.", archetype: "debugging" },
            { text: "Embed an agent to explain & refactor modules semi-automatically.", archetype: "ai" }
        ]
    },
    {
        q: "Final boss: What’s your ultimate dev fantasy?",
        options: [
            { text: "Building an interface so good people screenshot it for inspiration.", archetype: "frontend" },
            { text: "Architecting a system that serves a billion users without flinching.", archetype: "backend" },
            { text: "Solo-shipping a product that hits #1 on Product Hunt.", archetype: "fullstack" },
            { text: "Creating a self-healing codebase that fixes bugs before humans notice.", archetype: "ai" }
        ]
    }
];

// ============================================================================
// STATE
// ============================================================================
let currentIndex = 0;
let scores = {
    frontend: 0,
    backend: 0,
    fullstack: 0,
    debugging: 0,
    ai: 0
};
let selectedHistory = [];
let resultArchetype = null;
let leaderboardUnsub = null;

// DOM Cache
const DOM = {
    landing: document.getElementById('landing-section'),
    quiz: document.getElementById('quiz-section'),
    result: document.getElementById('result-section'),
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
    downloadBtn: document.getElementById('download-btn'),
    shareBtn: document.getElementById('share-btn'),
    toast: document.getElementById('copy-toast'),
    leaderboardList: document.getElementById('leaderboard-list'),
    firebaseStatus: document.getElementById('firebase-status'),
    totalCount: document.getElementById('total-count'),
    bgCanvas: document.getElementById('bg-canvas'),
    exportCanvas: document.getElementById('export-canvas')
};

// ============================================================================
// Particle Background
// ============================================================================
function initParticles() {
    const canvas = DOM.bgCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let w, h, particles = [];
    let raf;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticles() {
        const count = Math.min(75, Math.floor((w * h) / 18000));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 1.8 + 0.4,
            hue: Math.random() > 0.5 ? 265 : 195, // purple or blue
            alpha: Math.random() * 0.6 + 0.15
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // Lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `hsla(${particles[i].hue}, 100%, 70%, ${0.08 * (1 - dist / 140)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        // Dots
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
            // glow
            ctx.shadowBlur = 12;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        raf = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else draw();
    });
}

// ============================================================================
// Quiz Functions
// ============================================================================

function startQuiz() {
    currentIndex = 0;
    scores = { frontend:0, backend:0, fullstack:0, debugging:0, ai:0 };
    selectedHistory = [];

    // Transition sections
    DOM.landing.classList.remove('active');
    setTimeout(() => {
        DOM.landing.style.display = 'none';
        DOM.quiz.style.display = 'block';
        // Force reflow
        void DOM.quiz.offsetWidth;
        DOM.quiz.classList.add('active');
        renderQuestion(currentIndex);
    }, 350);
}

function renderQuestion(index) {
    const data = QUIZ_QUESTIONS[index];
    if (!data) return;

    const progress = ((index) / QUIZ_QUESTIONS.length) * 100;
    const displayProgress = Math.round(((index + 1) / QUIZ_QUESTIONS.length) * 100);

    // Update progress UI
    DOM.qCounter.textContent = `QUESTION ${String(index + 1).padStart(2, '0')} / ${String(QUIZ_QUESTIONS.length).padStart(2, '0')}`;
    DOM.qPercent.textContent = `${displayProgress}%`;
    DOM.progressFill.style.width = `${displayProgress}%`;
    if (DOM.progressGlow) DOM.progressGlow.style.width = `${displayProgress}%`;

    // Animate out
    DOM.qWrapper.classList.add('out');

    setTimeout(() => {
        DOM.qText.textContent = data.q;
        DOM.optionsContainer.innerHTML = '';

        const letters = ['A', 'B', 'C', 'D'];
        data.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-card';
            btn.setAttribute('data-archetype', opt.archetype);
            btn.setAttribute('aria-label', `Option ${letters[i]}: ${opt.text}`);
            btn.innerHTML = `
                <span class="option-letter">${letters[i]}</span>
                <span class="option-text">${opt.text}</span>
            `;

            // Mouse tracking for glow effect
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                btn.style.setProperty('--mouse-x', `${x}%`);
                btn.style.setProperty('--mouse-y', `${y}%`);
            });

            btn.addEventListener('click', () => selectOption(opt.archetype, btn));
            DOM.optionsContainer.appendChild(btn);
        });

        DOM.qWrapper.classList.remove('out');

        // Subtle focus for accessibility
        DOM.optionsContainer.firstChild?.focus?.();

    }, 220);
}

function selectOption(archetype, btnEl) {
    // Prevent double clicks
    if (btnEl.classList.contains('selected')) return;

    // Visual feedback
    document.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');

    // Score
    scores[archetype] = (scores[archetype] || 0) + 1;
    selectedHistory.push(archetype);

    // Haptic on mobile
    if (navigator.vibrate) navigator.vibrate(18);

    // Next after short delight delay
    setTimeout(() => {
        if (currentIndex < QUIZ_QUESTIONS.length - 1) {
            currentIndex++;
            renderQuestion(currentIndex);
        } else {
            finishQuiz();
        }
    }, 420);
}

function calculateResult() {
    let maxScore = -1;
    let winner = ARCHETYPE_ORDER[0];

    // Deterministic tie: iterate in order, only replace when strictly greater
    ARCHETYPE_ORDER.forEach(key => {
        if (scores[key] > maxScore) {
            maxScore = scores[key];
            winner = key;
        }
    });

    return winner;
}

function finishQuiz() {
    const winnerKey = calculateResult();
    resultArchetype = ARCHETYPES[winnerKey];

    // Hide quiz, show result
    DOM.quiz.classList.remove('active');
    setTimeout(() => {
        DOM.quiz.style.display = 'none';
        DOM.result.style.display = 'block';
        void DOM.result.offsetWidth;
        DOM.result.classList.add('active');
        showResult(resultArchetype);
    }, 350);
}

function showResult(archetype) {
    // Populate result card
    DOM.resultIcon.textContent = archetype.emoji;
    DOM.resultName.textContent = archetype.name;
    DOM.resultDesc.textContent = archetype.description;
    DOM.resultId.textContent = `ID: ${archetype.key.toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}-X`;

    // Aura & colors
    DOM.resultAura.style.background = `radial-gradient(circle at center, ${archetype.color}66 0%, transparent 70%)`;
    DOM.resultIconWrap.style.borderColor = `${archetype.color}55`;
    DOM.resultIconWrap.style.boxShadow = `0 10px 30px rgba(0,0,0,0.4), 0 0 20px ${archetype.color}33, inset 0 1px 0 rgba(255,255,255,0.08)`;
    DOM.resultUnderline.style.background = `linear-gradient(90deg, ${archetype.gradient[0]}, ${archetype.gradient[1]})`;
    DOM.resultUnderline.style.boxShadow = `0 0 12px ${archetype.color}`;

    // Traits
    DOM.resultTraits.innerHTML = '';
    archetype.traits.forEach(t => {
        const pill = document.createElement('span');
        pill.className = 'trait-pill';
        pill.textContent = t;
        pill.style.borderColor = `${archetype.color}33`;
        DOM.resultTraits.appendChild(pill);
    });

    // Scroll to result
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Increment in Firebase / fallback
    incrementArchetype(archetype.key).catch(() => {});

    // Subscribe to leaderboard (if not already)
    setupLeaderboard();

    // Confetti-ish pulse animation
    DOM.resultCard.animate([
        { transform: 'scale(0.96)', opacity: 0.6 },
        { transform: 'scale(1)', opacity: 1 }
    ], { duration: 600, easing: 'cubic-bezier(0.22,1,0.36,1)' });
}

// ============================================================================
// Leaderboard Rendering
// ============================================================================

function setupLeaderboard() {
    // Update status
    if (isFirebaseConfigured()) {
        DOM.firebaseStatus.innerHTML = `<span style="color:var(--neon-green)">● LIVE</span> CONNECTED TO FIRESTORE // REAL-TIME SYNC`;
    } else {
        DOM.firebaseStatus.innerHTML = `<span style="color:var(--neon-orange)">● MOCK MODE</span> USING LOCAL STORAGE // ADD FIREBASE CONFIG IN firebase.js FOR REAL SYNC`;
    }

    if (leaderboardUnsub) leaderboardUnsub(); // cleanup

    leaderboardUnsub = subscribeToLeaderboard((counts) => {
        renderLeaderboard(counts);
    });
}

function renderLeaderboard(counts) {
    const entries = ARCHETYPE_ORDER.map(key => ({
        ...ARCHETYPES[key],
        count: counts[key] || 0
    }));

    const total = entries.reduce((s, e) => s + e.count, 0) || 1;
    const max = Math.max(...entries.map(e => e.count), 1);

    // Sort by count desc for display but keep stable
    const sorted = [...entries].sort((a,b) => b.count - a.count);

    DOM.leaderboardList.innerHTML = '';

    sorted.forEach(item => {
        const percent = Math.round((item.count / total) * 100);
        const width = Math.round((item.count / max) * 100);

        const div = document.createElement('div');
        div.className = 'leader-item';
        div.innerHTML = `
            <div class="leader-item-top">
                <div class="leader-icon" style="border-color:${item.color}33; box-shadow: 0 0 10px ${item.color}18;">
                    ${item.emoji}
                </div>
                <div class="leader-info">
                    <span class="leader-name">${item.name}</span>
                    <span class="leader-count">${item.count} developers</span>
                </div>
            </div>
            <span class="leader-percent" style="color:${item.color}">${percent}%</span>
            <div class="leader-bar-wrap">
                <div class="leader-bar-fill" style="width:${width}%; background: linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]}); box-shadow: 0 0 10px ${item.color}66;"></div>
            </div>
        `;
        DOM.leaderboardList.appendChild(div);
    });

    DOM.totalCount.textContent = `TOTAL DECODED: ${total.toLocaleString()} developers worldwide`;
}

// ============================================================================
// Canvas Export (Download Result Card)
// ============================================================================

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY + lineHeight;
}

async function generateResultCard() {
    if (!resultArchetype) return;

    const canvas = DOM.exportCanvas;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const arch = resultArchetype;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background: deep black + gradients
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Purple glow bottom left
    const g1 = ctx.createRadialGradient(0, H*0.2, 0, 0, H*0.2, 600);
    g1.addColorStop(0, 'rgba(168,85,247,0.30)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // Blue glow top right
    const g2 = ctx.createRadialGradient(W, 100, 0, W, 100, 650);
    g2.addColorStop(0, 'rgba(0,204,255,0.22)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Outer border with neon stroke
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    ctx.strokeStyle = arch.color + '55';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, W - 68, H - 68);

    // Glow aura behind icon
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.filter = 'blur(46px)';
    ctx.fillStyle = arch.color;
    ctx.beginPath();
    ctx.arc(W/2, 380, 150, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.filter = 'none';

    // Brand top
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('DevDNA', W/2, 110);

    ctx.fillStyle = 'rgba(161,161,181,0.7)';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillText('ARCHETYPE DECODED // SYS.V1', W/2, 140);

    // Icon circle
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = arch.color + '66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W/2 - 78, 190, 156, 156, 28);
    ctx.fill();
    ctx.stroke();

    // Emoji as text
    ctx.font = '78px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arch.emoji, W/2, 268);

    // Archetype Name
    ctx.fillStyle = 'white';
    ctx.font = '900 56px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(arch.name.toUpperCase(), W/2, 460);

    // Underline
    const grad = ctx.createLinearGradient(W/2 - 80, 0, W/2 + 80, 0);
    grad.addColorStop(0, arch.gradient[0]);
    grad.addColorStop(1, arch.gradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(W/2 - 70, 484, 140, 3);

    // Description wrapped
    ctx.fillStyle = '#a1a1b5';
    ctx.font = '400 26px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    const afterDescY = wrapText(ctx, arch.description, W/2, 540, 760, 36);

    // Traits pills simulated as text
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    let tx = W/2 - (arch.traits.join('   ').length * 4);
    // Simpler: list traits centered
    ctx.fillStyle = '#c5c5d6';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(arch.traits.join(' • ').toUpperCase(), W/2, afterDescY + 36);

    // Big watermark DevDNA faint
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.font = '900 200px "Orbitron"';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.rotate(-0.18);
    ctx.fillText('DevDNA', W*0.55, H*0.72);
    ctx.restore();

    // Footer
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(96, H - 180);
    ctx.lineTo(W - 96, H - 180);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '500 18px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText('devdna.onrender.com', 96, H - 140);

    ctx.textAlign = 'right';
    ctx.fillText(`ID: ${arch.key.toUpperCase()}-${Math.floor(1000+Math.random()*9000)}-X`, W - 96, H - 140);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '400 15px "JetBrains Mono"';
    ctx.fillText('BUILT FOR THE FUTURE • NO COOKIES. JUST CODE.', W/2, H - 94);

    // Export
    return canvas.toDataURL('image/png');
}

async function handleDownload() {
    if (!resultArchetype) return;

    DOM.downloadBtn.disabled = true;
    const original = DOM.downloadBtn.innerHTML;
    DOM.downloadBtn.innerHTML = `<span class="btn-inner"><span>⏳</span> Generating...</span>`;

    try {
        const dataUrl = await generateResultCard();
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `DevDNA-${resultArchetype.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    } catch (e) {
        console.error('Canvas export failed', e);
        alert('Download failed - try again! (Canvas may be blocked)');
    } finally {
        DOM.downloadBtn.disabled = false;
        DOM.downloadBtn.innerHTML = original;
    }
}

// ============================================================================
// Share
// ============================================================================
async function handleShare() {
    if (!resultArchetype) return;
    const text = `I just discovered I'm a ${resultArchetype.name} on DevDNA! ⚡ Try it yourself at devdna.onrender.com`;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        showToast();
    } catch {
        // Fallback prompt
        prompt('Copy this text:', text);
    }
}

function showToast() {
    DOM.toast.classList.remove('hidden');
    setTimeout(() => DOM.toast.classList.add('hidden'), 2600);
    if (navigator.vibrate) navigator.vibrate(20);
}

// ============================================================================
// Initialization & Event Listeners
// ============================================================================
function init() {
    console.log('%c🧬 DevDNA Initialized', 'color:#a855f7; font-size:16px; font-weight:bold;');
    console.log('Scores:', scores);

    // Background
    initParticles();

    // Ensure sections display state
    DOM.landing.style.display = 'block';
    DOM.landing.classList.add('active');
    DOM.quiz.style.display = 'none';
    DOM.result.style.display = 'none';

    // Listeners
    DOM.startBtn.addEventListener('click', startQuiz);
    DOM.downloadBtn.addEventListener('click', handleDownload);
    DOM.shareBtn.addEventListener('click', handleShare);

    // Keyboard: start with Enter/Space, options with 1-4, A-D
    document.addEventListener('keydown', (e) => {
        if (DOM.landing.classList.contains('active') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startQuiz();
        }

        if (DOM.quiz.classList.contains('active')) {
            const map = { '1':'0','2':'1','3':'2','4':'3','a':'0','b':'1','c':'2','d':'3','A':'0','B':'1','C':'2','D':'3' };
            if (map[e.key] !== undefined) {
                const btns = document.querySelectorAll('.option-card');
                if (btns[map[e.key]]) btns[map[e.key]].click();
            }
        }
    });

    // Expose for debugging
    window.__DevDNA = {
        scores, ARCHETYPES, QUIZ_QUESTIONS,
        startQuiz, calculateResult
    };
}

// Run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
