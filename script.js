// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Fix: Use relative path for service worker on GitHub Pages
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Prevent default touch behavior to avoid iOS Safari overscroll/bounce effect
document.addEventListener('touchmove', event => {
    if (!event.target.classList.contains('scrollable')) {
        event.preventDefault();
    }
}, { passive: false });

// Handle iOS PWA display issues
window.addEventListener('resize', () => {
    document.body.style.height = `${window.innerHeight}px`;
});

document.addEventListener('DOMContentLoaded', () => {
    // Set initial height for iOS PWA
    document.body.style.height = `${window.innerHeight}px`;
    
    // DOM elements
    const breathingCircle = document.querySelector('.circle-inner');
    const instruction = document.getElementById('instruction');
    const toggleAudioBtn = document.getElementById('toggleAudio');
    const audioIcon = document.querySelector('.audio-icon');
    const audioText = document.querySelector('.audio-text');
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const themeIcon = document.querySelector('.theme-icon');
    const numberCue = document.getElementById('numberCue');
    
    // Audio elements
    const softbeepAudio = document.getElementById('softbeep');
    const inhaleAudio = document.getElementById('inhale');
    const holdAudio = document.getElementById('hold');
    const exhaleAudio = document.getElementById('exhale');
    
    // State variables
    let isVoiceMode = false; // true for voice, false for beep
    let isDarkMode = false; // false for light mode, true for dark mode
    let breathingInterval;
    let currentPhase = 'inhale';
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('breathenTheme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    }
    
    // Check for saved audio preference
    const savedAudio = localStorage.getItem('breathenAudio');
    if (savedAudio === 'voice') {
        isVoiceMode = true;
        audioIcon.textContent = '🔊';
        audioText.textContent = 'Voice';
    }
    
    // Toggle between light and dark mode
    toggleThemeBtn.addEventListener('click', () => {
        if (isDarkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
    
    // Enable dark mode
    function enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '🌙';
        isDarkMode = true;
        localStorage.setItem('breathenTheme', 'dark');
    }
    
    // Disable dark mode
    function disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '☀️';
        isDarkMode = false;
        localStorage.setItem('breathenTheme', 'light');
    }
    
    // --- Robust Audio Unlock and Preload (modeled after New Folder (2)) ---
    function robustPreloadAndUnlockAudio() {
        const audioElements = [softbeepAudio, inhaleAudio, holdAudio, exhaleAudio];
        audioElements.forEach(audio => {
            if (!audio) return;
            audio.load();
            audio.preload = 'auto';
            // Try to unlock audio context silently
            const originalVolume = audio.volume;
            audio.volume = 0;
            // Try to play, but do NOT block or wait for promise
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = originalVolume;
            }).catch(() => {
                audio.volume = originalVolume;
            });
        });
    }
    // Call robust preload/unlock on DOMContentLoaded and load
    document.addEventListener('DOMContentLoaded', robustPreloadAndUnlockAudio);
    window.addEventListener('load', robustPreloadAndUnlockAudio);
    // Also call immediately in case DOM is already loaded
    robustPreloadAndUnlockAudio();

    // Toggle between voice and beep audio
    toggleAudioBtn.addEventListener('click', () => {
        isVoiceMode = !isVoiceMode;
        if (isVoiceMode) {
            audioIcon.textContent = '🔊';
            audioText.textContent = 'Voice';
            localStorage.setItem('breathenAudio', 'voice');
        } else {
            audioIcon.textContent = '🔔';
            audioText.textContent = 'Beep';
            localStorage.setItem('breathenAudio', 'beep');
        }
    });
    
    // --- Robust Play Function (modeled after New Folder (2)) ---
    function playAudio(phase) {
        let audioToPlay;
        if (isVoiceMode) {
            switch (phase) {
                case 'inhale':
                    audioToPlay = inhaleAudio;
                    break;
                case 'hold':
                    audioToPlay = holdAudio;
                    break;
                case 'exhale':
                    audioToPlay = exhaleAudio;
                    break;
            }
        } else {
            audioToPlay = softbeepAudio;
        }
        if (audioToPlay) {
            audioToPlay.pause();
            audioToPlay.currentTime = 0;
            audioToPlay.load();
            const playPromise = audioToPlay.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    setTimeout(() => {
                        audioToPlay.load();
                        audioToPlay.play().catch(() => {});
                    }, 120);
                });
            }
        }
    }
    
    // Start the breathing cycle
    function startBreathingCycle() {
        // Clear any existing interval
        if (breathingInterval) {
            clearInterval(breathingInterval);
        }
        
        // Initial state
        breathingCycle();
        
        // Set up the continuous cycle
        breathingInterval = setInterval(breathingCycle, 13000); // 4s + 2s + 7s = 13s total cycle
    }
    
    // Handle a single breathing cycle
    function breathingCycle() {
        // Clear any existing countdown timers
        clearAllCountdowns();
        
        // Inhale phase - 4 seconds
        currentPhase = 'inhale';
        instruction.textContent = 'Inhale';
        instruction.classList.add('animate__animated', 'animate__fadeIn');
        breathingCircle.classList.remove('exhale', 'hold');
        breathingCircle.classList.add('inhale');
        
        // Start inhale countdown from 4
        startCountdown(4, 1000);
        
        playAudio('inhale');
        
        // Hold phase - after 4 seconds, for 2 seconds
        setTimeout(() => {
            currentPhase = 'hold';
            instruction.textContent = 'Hold';
            instruction.classList.remove('animate__fadeIn');
            instruction.classList.add('animate__pulse');
            breathingCircle.classList.remove('inhale');
            breathingCircle.classList.add('hold');
            
            // Start hold countdown from 2
            startCountdown(2, 1000);
            
            playAudio('hold');
        }, 4000);
        
        // Exhale phase - after 6 seconds (4+2), for 7 seconds
        setTimeout(() => {
            currentPhase = 'exhale';
            instruction.textContent = 'Exhale';
            instruction.classList.remove('animate__pulse');
            instruction.classList.add('animate__fadeIn');
            breathingCircle.classList.remove('hold');
            breathingCircle.classList.add('exhale');
            
            // Start exhale countdown from 7
            startCountdown(7, 1000);
            
            playAudio('exhale');
        }, 6000);
    }
    
    // Array to store all countdown timers
    let countdownTimers = [];
    
    // Clear all countdown timers
    function clearAllCountdowns() {
        countdownTimers.forEach(timer => clearTimeout(timer));
        countdownTimers = [];
    }
    
    // Start a countdown from a given number with a specified interval
    function startCountdown(from, interval) {
        updateNumberCue(from);
        
        // Create a countdown sequence
        for (let i = from - 1; i >= 1; i--) {
            const timer = setTimeout(() => {
                updateNumberCue(i);
            }, (from - i) * interval);
            
            countdownTimers.push(timer);
        }
    }
    
    // Update the number cue with animation
    function updateNumberCue(number) {
        numberCue.classList.remove('number-fade-in');
        // Trigger reflow to restart animation
        void numberCue.offsetWidth;
        numberCue.textContent = number;
        numberCue.classList.add('number-fade-in');
    }
    
    // --- Add Start Button for Guaranteed Audio on All Browsers ---
    // Create and insert the start button overlay ONLY if not already present
    let startOverlay = document.getElementById('startOverlay');
    if (!startOverlay) {
        startOverlay = document.createElement('div');
        startOverlay.id = 'startOverlay';
        startOverlay.style.position = 'fixed';
        startOverlay.style.top = 0;
        startOverlay.style.left = 0;
        startOverlay.style.width = '100vw';
        startOverlay.style.height = '100vh';
        startOverlay.style.background = 'rgba(247,249,255,0.98)';
        startOverlay.style.display = 'flex';
        startOverlay.style.flexDirection = 'column';
        startOverlay.style.alignItems = 'center';
        startOverlay.style.justifyContent = 'center';
        startOverlay.style.zIndex = 9999;
        startOverlay.innerHTML = `
            <button id="startAppBtn" style="font-size:2rem;padding:1rem 2.5rem;border-radius:2rem;background:#b7d3ff;color:#1f2937;border:none;box-shadow:0 2px 8px #b7d3ff80;cursor:pointer;">Start</button>
            <div style="margin-top:1.5rem;color:#4b5563;font-size:1.1rem;">Tap to begin and enable sound</div>
        `;
        document.body.appendChild(startOverlay);
    }

    // Setup Start button handler
    const startBtn = document.getElementById('startAppBtn');
    if (startBtn) {
        let breathingStarted = false;
        function hideStartOverlay() {
            startOverlay.style.display = 'none';
            startOverlay.setAttribute('aria-hidden', 'true');
        }
        function startBreathingWithAudioUnlock() {
            if (breathingStarted) return;
            breathingStarted = true;
            robustPreloadAndUnlockAudio();
            hideStartOverlay();
            setTimeout(startBreathingCycle, 100); // Give audio unlock a moment
        }
        startBtn.addEventListener('click', startBreathingWithAudioUnlock);
    }

    // Handle visibility change to pause/resume when app is in background
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // App is in background, clear the interval and countdown timers
            clearInterval(breathingInterval);
            clearAllCountdowns();
        } else {
            // App is visible again, restart the cycle
            startBreathingCycle();
        }
    });
});
