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

// Wake Lock API variable
let wakeLock = null;

// Function to request wake lock
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active');
            
            // Listen for wake lock release
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
            
        } catch (err) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    } else {
        console.warn('Wake Lock API not supported in this browser');
    }
}

// Function to release wake lock
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
                console.log('Wake Lock released');
            })
            .catch((err) => {
                console.error(`Error releasing Wake Lock: ${err.name}, ${err.message}`);
            });
    }
}

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
    const gratitudeMessage = document.getElementById('gratitudeMessage');
    
    // Audio elements
    const softbeepInhale = document.getElementById('softbeep_inhale');
    const softbeepHold = document.getElementById('softbeep_hold');
    const softbeepExhale = document.getElementById('softbeep_exhale');
    const inhaleAudio = document.getElementById('inhale');
    const holdAudio = document.getElementById('hold');
    const exhaleAudio = document.getElementById('exhale');
    
    // Gratitude statements array
    const gratitudeStatements = [
        "I am grateful for this moment of peace and reflection",
        "Today, I choose to focus on what brings me joy",
        "I appreciate the gift of breath and life",
        "I am thankful for the strength within me",
        "Every breath is an opportunity for growth",
        "I am grateful for my body's ability to heal and rejuvenate",
        "Each day brings new possibilities to be thankful for",
        "I appreciate the calmness that surrounds me",
        "I am thankful for this moment of mindfulness",
        "Today, I celebrate my journey of well-being",
        "I am grateful for the power of my breath",
        "Life flows through me with each breath I take",
        "I appreciate the peace that comes with mindful breathing",
        "I am thankful for this time to reconnect with myself",
        "Every breath brings new energy and vitality",
        "I am grateful for the ability to find stillness within",
        "Each moment of breathing is a gift",
        "I appreciate the healing power of conscious breath",
        "Today, I am thankful for my inner strength",
        "I am grateful for the rhythm of my breath",
        "This moment of mindfulness is a blessing",
        "I appreciate the harmony of my mind and body",
        "I am thankful for the peace within my heart"
    ];

    // Function to display a random gratitude message
    function displayRandomGratitude() {
        const randomIndex = Math.floor(Math.random() * gratitudeStatements.length);
        gratitudeMessage.textContent = gratitudeStatements[randomIndex];
    }

    // State variables
    let isVoiceMode = false; // true for voice, false for beep
    let isDarkMode = false; // false for light mode, true for dark mode
    let breathingInterval;
    let currentPhase = 'inhale';
    
    // Display initial gratitude message
    displayRandomGratitude();

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
            // Unlock audio context silently: use Web Audio API if available, else play/pause with muted property
            if (typeof audio.muted !== 'undefined') {
                audio.muted = true;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = false;
                    }).catch(() => {
                        audio.muted = false;
                    });
                } else {
                    audio.muted = false;
                }
            } else {
                // Fallback for browsers without .muted
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
            }
        });
    }    // Call robust preload/unlock on DOMContentLoaded and load
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
        
        const startOverlay = document.getElementById('startOverlay');
        
        // Request wake lock to keep screen on during breathing exercise
        requestWakeLock();
        
        // Start the sequence after the specified delay
        setTimeout(() => {
            startOverlay.style.opacity = '0';
            setTimeout(() => {
                startOverlay.style.display = 'none';
                displayRandomGratitude(); // Refresh gratitude for next session
                breathingCycle();
                breathingInterval = setInterval(breathingCycle, 16000); // 5s inhale + 3s hold + 8s exhale = 16s
            }, 500);
        }, initialDelay);
    }
    
    // Handle a single breathing cycle
    function breathingCycle() {
        clearAllCountdowns();
        // Inhale phase - 4 seconds + 1 extra (5s)
        currentPhase = 'inhale';
        instruction.textContent = 'Inhale';
        instruction.classList.add('animate__animated', 'animate__fadeIn');
        breathingCircle.classList.remove('exhale', 'hold');
        breathingCircle.classList.add('inhale');
        startCountdown(4, 1000, true);
        playAudio('inhale');
        // Hold phase - after 5 seconds (4+1), for 2+1 seconds (3s)
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
        // Exhale phase - after 8 seconds (5+3), for 7+1 seconds (8s)
        setTimeout(() => {
            currentPhase = 'exhale';
            instruction.textContent = 'Exhale';
            instruction.classList.remove('animate__pulse');
            instruction.classList.add('animate__fadeIn');
            breathingCircle.classList.remove('hold');
            breathingCircle.classList.add('exhale');
            startCountdown(7, 1000, true); // 7,6,5,4,3,2,1,0
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
            
            // Release wake lock when app is in background
            releaseWakeLock();
        } else {
            // App is visible again, restart the cycle and request wake lock
            startBreathingCycle();
        }
    });
});
