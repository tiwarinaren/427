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
    const softbeepInhale = document.getElementById('softbeep_inhale');
    const softbeepHold = document.getElementById('softbeep_hold');
    const softbeepExhale = document.getElementById('softbeep_exhale');
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
    
    // --- Robust Audio Unlock and Preload ---
    function robustPreloadAndUnlockAudio() {
        const audioElements = [softbeepInhale, softbeepHold, softbeepExhale, inhaleAudio, holdAudio, exhaleAudio];
        audioElements.forEach(audio => {
            if (!audio) return;
            audio.load();
            audio.preload = 'auto';
            const originalVolume = audio.volume;
            audio.volume = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = originalVolume;
                }).catch(() => {
                    audio.volume = originalVolume;
                });
            } else {
                audio.volume = originalVolume;
            }
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
    
    // --- Robust Play Function ---
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
            switch (phase) {
                case 'inhale':
                    audioToPlay = softbeepInhale;
                    break;
                case 'hold':
                    audioToPlay = softbeepHold;
                    break;
                case 'exhale':
                    audioToPlay = softbeepExhale;
                    break;
            }
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
    
    // Start the breathing cycle with optional initial delay
    function startBreathingCycle(initialDelay = 0) {
        if (breathingInterval) {
            clearInterval(breathingInterval);
        }
        setTimeout(() => {
            breathingCycle();
            breathingInterval = setInterval(breathingCycle, 14000); // 4+1 + 2+1 + 7+1 = 15s, but keep 14s for overlap
        }, initialDelay);
    }
    
    // Handle a single breathing cycle
    function breathingCycle() {
        clearAllCountdowns();
        // Inhale phase - 4 seconds + 1 extra
        currentPhase = 'inhale';
        instruction.textContent = 'Inhale';
        instruction.classList.add('animate__animated', 'animate__fadeIn');
        breathingCircle.classList.remove('exhale', 'hold');
        breathingCircle.classList.add('inhale');
        startCountdown(4, 1000, true); // true = add zero
        playAudio('inhale');
        // Hold phase - after 5 seconds (4+1), for 2+1 seconds
        setTimeout(() => {
            currentPhase = 'hold';
            instruction.textContent = 'Hold';
            instruction.classList.remove('animate__fadeIn');
            instruction.classList.add('animate__pulse');
            breathingCircle.classList.remove('inhale');
            breathingCircle.classList.add('hold');
            startCountdown(2, 1000, true);
            playAudio('hold');
        }, 5000);
        // Exhale phase - after 8 seconds (4+1+2+1), for 7+1 seconds
        setTimeout(() => {
            currentPhase = 'exhale';
            instruction.textContent = 'Exhale';
            instruction.classList.remove('animate__pulse');
            instruction.classList.add('animate__fadeIn');
            breathingCircle.classList.remove('hold');
            breathingCircle.classList.add('exhale');
            startCountdown(7, 1000, true);
            playAudio('exhale');
        }, 8000);
    }
    
    // Array to store all countdown timers
    let countdownTimers = [];
    
    // Clear all countdown timers
    function clearAllCountdowns() {
        countdownTimers.forEach(timer => clearTimeout(timer));
        countdownTimers = [];
    }
    
    // Start a countdown from a given number with a specified interval, optionally add zero
    function startCountdown(from, interval, addZero = false) {
        updateNumberCue(from);
        for (let i = from - 1; i >= 0; i--) {
            const timer = setTimeout(() => {
                updateNumberCue(i);
            }, (from - i) * interval);
            countdownTimers.push(timer);
        }
        if (!addZero) {
            // If not adding zero, remove the last timer
            countdownTimers.pop();
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
            setTimeout(() => startBreathingCycle(0), 1000); // 1s delay before first cycle
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
