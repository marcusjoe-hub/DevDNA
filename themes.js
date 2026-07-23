/**
 * DevDNA v1.0 - Theme System
 * 6 Full themes, real-time sync via Firebase /settings/main/theme
 * Applies CSS variables to :root for instant global theming
 */

export const THEMES = {
    cyberpunk: {
        name: "Cyberpunk Neon",
        desc: "Green / Purple / Blue — classic DevDNA",
        icon: "🌃",
        colors: {
            "--neon-primary": "#00ff99",
            "--neon-secondary": "#a855f7",
            "--neon-tertiary": "#00ccff",
            "--neon-green": "#00ff99",
            "--neon-blue": "#00ccff",
            "--neon-purple": "#a855f7",
            "--neon-pink": "#ff00aa",
            "--neon-orange": "#ff8a00",
            "--bg-deep": "#0a0a0f",
            "--bg-elevated": "#14141c",
            "--bg-card": "rgba(18, 18, 26, 0.7)",
            "--text-primary": "#f8f8ff"
        }
    },
    matrix: {
        name: "Matrix Green",
        desc: "Terminal vibes — all green",
        icon: "🟩",
        colors: {
            "--neon-primary": "#00ff00",
            "--neon-secondary": "#003300",
            "--neon-tertiary": "#00cc66",
            "--neon-green": "#00ff41",
            "--neon-blue": "#00aa33",
            "--neon-purple": "#00ff66",
            "--neon-pink": "#33ff77",
            "--neon-orange": "#88ff88",
            "--bg-deep": "#020a02",
            "--bg-elevated": "#0a1a0a",
            "--bg-card": "rgba(10, 26, 10, 0.75)",
            "--text-primary": "#ccffcc"
        }
    },
    blood: {
        name: "Blood Neon",
        desc: "Red / Black / White — aggressive",
        icon: "🩸",
        colors: {
            "--neon-primary": "#ff0040",
            "--neon-secondary": "#8a0000",
            "--neon-tertiary": "#ffffff",
            "--neon-green": "#ff0040",
            "--neon-blue": "#ffaaaa",
            "--neon-purple": "#cc0000",
            "--neon-pink": "#ff3366",
            "--neon-orange": "#ff6666",
            "--bg-deep": "#0a0000",
            "--bg-elevated": "#1a0a0a",
            "--bg-card": "rgba(26, 10, 10, 0.75)",
            "--text-primary": "#ffe0e0"
        }
    },
    ocean: {
        name: "Ocean Deep",
        desc: "Blue / Teal / Navy — deep sea",
        icon: "🌊",
        colors: {
            "--neon-primary": "#00ccff",
            "--neon-secondary": "#0066ff",
            "--neon-tertiary": "#00ffcc",
            "--neon-green": "#00ffcc",
            "--neon-blue": "#0099ff",
            "--neon-purple": "#0066cc",
            "--neon-pink": "#33ccff",
            "--neon-orange": "#66ddff",
            "--bg-deep": "#000a14",
            "--bg-elevated": "#001a33",
            "--bg-card": "rgba(10, 26, 46, 0.75)",
            "--text-primary": "#d0f0ff"
        }
    },
    sunset: {
        name: "Sunset Wave",
        desc: "Orange / Pink / Purple — synthwave",
        icon: "🌅",
        colors: {
            "--neon-primary": "#ff8a00",
            "--neon-secondary": "#ff00aa",
            "--neon-tertiary": "#a855f7",
            "--neon-green": "#ff8a00",
            "--neon-blue": "#ff00aa",
            "--neon-purple": "#ff4400",
            "--neon-pink": "#ff66cc",
            "--neon-orange": "#ffcc00",
            "--bg-deep": "#1a0f14",
            "--bg-elevated": "#2a1620",
            "--bg-card": "rgba(32, 18, 26, 0.75)",
            "--text-primary": "#ffe0cc"
        }
    },
    monochrome: {
        name: "Monochrome",
        desc: "White / Gray / Black — minimal",
        icon: "⚪",
        colors: {
            "--neon-primary": "#ffffff",
            "--neon-secondary": "#a1a1b5",
            "--neon-tertiary": "#6b6b80",
            "--neon-green": "#ffffff",
            "--neon-blue": "#cccccc",
            "--neon-purple": "#999999",
            "--neon-pink": "#bbbbbb",
            "--neon-orange": "#888888",
            "--bg-deep": "#0f0f0f",
            "--bg-elevated": "#1a1a1a",
            "--bg-card": "rgba(24, 24, 24, 0.8)",
            "--text-primary": "#ffffff"
        }
    },
    // NEW 6 themes for v1.0 expansion (Section 14)
    sakura: {
        name: "Sakura Dream",
        desc: "Pink / Purple / White — soft cyberpunk",
        icon: "🌸",
        colors: {
            "--neon-primary": "#ff8fab",
            "--neon-secondary": "#c77dff",
            "--neon-tertiary": "#ffffff",
            "--neon-green": "#ff8fab",
            "--neon-blue": "#ffb3c6",
            "--neon-purple": "#c77dff",
            "--neon-pink": "#ff4d8d",
            "--neon-orange": "#ffc2d1",
            "--bg-deep": "#1a0a12",
            "--bg-elevated": "#2a1020",
            "--bg-card": "rgba(42, 16, 32, 0.78)",
            "--text-primary": "#ffe0ec"
        }
    },
    volt: {
        name: "Volt Yellow",
        desc: "Yellow / Black / Neon Green — high energy",
        icon: "⚡",
        colors: {
            "--neon-primary": "#ffea00",
            "--neon-secondary": "#111111",
            "--neon-tertiary": "#00ff99",
            "--neon-green": "#00ff99",
            "--neon-blue": "#ffea00",
            "--neon-purple": "#ccff00",
            "--neon-pink": "#ffee33",
            "--neon-orange": "#ffcc00",
            "--bg-deep": "#0a0a00",
            "--bg-elevated": "#1a1a00",
            "--bg-card": "rgba(26, 26, 0, 0.78)",
            "--text-primary": "#fffde0"
        }
    },
    galaxy: {
        name: "Galaxy Void",
        desc: "Deep Purple / Indigo / Starlight — cosmic",
        icon: "🌌",
        colors: {
            "--neon-primary": "#7b00ff",
            "--neon-secondary": "#3a0ca3",
            "--neon-tertiary": "#f0f0ff",
            "--neon-green": "#b388ff",
            "--neon-blue": "#7b00ff",
            "--neon-purple": "#3a0ca3",
            "--neon-pink": "#9d4edd",
            "--neon-orange": "#c7d2fe",
            "--bg-deep": "#0a001a",
            "--bg-elevated": "#140033",
            "--bg-card": "rgba(20, 0, 51, 0.8)",
            "--text-primary": "#e0d4ff"
        }
    },
    inferno: {
        name: "Inferno Core",
        desc: "Orange / Red / Black — molten lava",
        icon: "🔥",
        colors: {
            "--neon-primary": "#ff5500",
            "--neon-secondary": "#cc0000",
            "--neon-tertiary": "#111111",
            "--neon-green": "#ff5500",
            "--neon-blue": "#ff3300",
            "--neon-purple": "#cc0000",
            "--neon-pink": "#ff8800",
            "--neon-orange": "#ffaa00",
            "--bg-deep": "#1a0500",
            "--bg-elevated": "#2a0a00",
            "--bg-card": "rgba(42, 10, 0, 0.8)",
            "--text-primary": "#ffd0b0"
        }
    },
    arctic: {
        name: "Arctic Frost",
        desc: "Ice Blue / White / Silver — clean minimal",
        icon: "🧊",
        colors: {
            "--neon-primary": "#88ddff",
            "--neon-secondary": "#ffffff",
            "--neon-tertiary": "#c0c0c0",
            "--neon-green": "#88ddff",
            "--neon-blue": "#aaddff",
            "--neon-purple": "#88bbff",
            "--neon-pink": "#ddeeff",
            "--neon-orange": "#ffffff",
            "--bg-deep": "#0a141a",
            "--bg-elevated": "#10202a",
            "--bg-card": "rgba(16, 32, 42, 0.78)",
            "--text-primary": "#e0f4ff"
        }
    },
    toxic: {
        name: "Toxic Swamp",
        desc: "Toxic Green / Dark Brown / Yellow — hacker aesthetic",
        icon: "🌿",
        colors: {
            "--neon-primary": "#39ff14",
            "--neon-secondary": "#2a1a00",
            "--neon-tertiary": "#ffcc00",
            "--neon-green": "#39ff14",
            "--neon-blue": "#88ff00",
            "--neon-purple": "#66cc00",
            "--neon-pink": "#aaff00",
            "--neon-orange": "#ffcc00",
            "--bg-deep": "#0a1400",
            "--bg-elevated": "#1a2500",
            "--bg-card": "rgba(26, 37, 0, 0.8)",
            "--text-primary": "#d0ffb0"
        }
    }
};

/**
 * Apply theme to entire site (main + admin)
 * Sets CSS variables on :root with smooth transition
 */
export function applyTheme(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme) {
        console.warn(`[DevDNA v1.0] Unknown theme: ${themeKey}, falling back to cyberpunk`);
        return applyTheme('cyberpunk');
    }

    const root = document.documentElement;
    
    // Smooth transition for theme change
    root.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    
    // Apply all color variables
    Object.entries(theme.colors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
    });

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', themeKey);
    
    // Store locally for instant load on next visit (before Firebase sync)
    try {
        localStorage.setItem('devdna_theme', themeKey);
    } catch {}

    console.log(`[DevDNA v1.0] Applied theme: ${theme.name} (${themeKey})`);
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('devdna-theme-changed', { detail: { themeKey, theme } }));
}

/**
 * Get current theme key from DOM or localStorage
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('devdna_theme') || 
           'cyberpunk';
}

/**
 * Get theme definition
 */
export function getTheme(themeKey) {
    return THEMES[themeKey] || THEMES.cyberpunk;
}

/**
 * Initialize theme from localStorage (instant) then wait for Firebase
 */
export function initTheme() {
    const saved = localStorage.getItem('devdna_theme') || 'cyberpunk';
    applyTheme(saved);
}

// Auto-init on import
if (typeof window !== 'undefined') {
    initTheme();
}
