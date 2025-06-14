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
    
    // Initialize particles with directions radiating from center
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        // Get the class name to extract position information
        const className = particle.className;
        const pNumber = parseInt(className.match(/p(\d+)/)[1]);
        
        // Calculate angle based on particle number (distribute evenly around the circle)
        const angle = (pNumber / particles.length) * Math.PI * 2;
        
        // Calculate direction vector (normalized between -1 and 1)
        const translateX = Math.cos(angle).toFixed(2);
        const translateY = Math.sin(angle).toFixed(2);
        
        // Add slight randomness to make it more natural
        const randomX = ((Math.random() * 0.4) - 0.2).toFixed(2);
        const randomY = ((Math.random() * 0.4) - 0.2).toFixed(2);
        
        // Set CSS variables for direction
        particle.style.setProperty('--translate-x', parseFloat(translateX) + parseFloat(randomX));
        particle.style.setProperty('--translate-y', parseFloat(translateY) + parseFloat(randomY));
    });
    
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
    
    // Breathing pattern variables (default 4-2-7)
    let inhaleTime = 4;
    let holdTime = 2;
    let exhaleTime = 7;
    let breatheToZero = true; // Default to true (count down to 0)
    
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
    
    // Check for saved breathing pattern
    const savedInhaleTime = localStorage.getItem('breathenInhaleTime');
    const savedHoldTime = localStorage.getItem('breathenHoldTime');
    const savedExhaleTime = localStorage.getItem('breathenExhaleTime');
    const savedBreatheToZero = localStorage.getItem('breathenBreatheToZero');
    
    if (savedInhaleTime) inhaleTime = parseInt(savedInhaleTime);
    if (savedHoldTime) holdTime = parseInt(savedHoldTime);
    if (savedExhaleTime) exhaleTime = parseInt(savedExhaleTime);
    if (savedBreatheToZero !== null) breatheToZero = savedBreatheToZero === 'true';
    
    // Update input fields with saved values
    document.getElementById('inhaleTime').value = inhaleTime;
    document.getElementById('holdTime').value = holdTime;
    document.getElementById('exhaleTime').value = exhaleTime;
    document.getElementById('breatheToZero').checked = breatheToZero;
    
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
        // Update theme-color meta for dark mode
        const themeMeta = document.getElementById('themeColorMeta');
        if (themeMeta) themeMeta.setAttribute('content', '#181c1f');
    }
    
    // Disable dark mode
    function disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '☀️';
        isDarkMode = false;
        localStorage.setItem('breathenTheme', 'light');
        // Update theme-color meta for light mode
        const themeMeta = document.getElementById('themeColorMeta');
        if (themeMeta) themeMeta.setAttribute('content', '#ffffff');
    }
    
    // --- Robust Audio Unlock and Preload ---
    function robustPreloadAndUnlockAudio() {
        const audioElements = [softbeepInhale, softbeepHold, softbeepExhale, inhaleAudio, holdAudio, exhaleAudio];
        audioElements.forEach(audio => {
            if (!audio) return;
            audio.load();
            audio.preload = 'auto';
            // Always mute or set volume 0 before play
            let restoreVolume = null;
            if (typeof audio.muted !== 'undefined') {
                audio.muted = true;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        // Do NOT unmute here, keep muted until actual playback
                    }).catch(() => {
                        // Still keep muted
                    });
                }
            } else {
                // Fallback for browsers without .muted
                restoreVolume = audio.volume;
                audio.volume = 0;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        // Do NOT restore volume here, keep at 0 until actual playback
                    }).catch(() => {
                        // Still keep at 0
                    });
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
    
    // Settings panel functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const saveSettingsBtn = document.getElementById('saveSettings');
    
    // Toggle settings panel visibility
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from reaching document
        settingsPanel.classList.toggle('visible');
    });
    
    // Close settings panel when clicking outside
    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('visible') && 
            !settingsPanel.contains(e.target) && 
            e.target !== settingsBtn) {
            settingsPanel.classList.remove('visible');
        }
    });
    
    // Prevent clicks inside panel from closing it
    settingsPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', () => {
        // Get values from inputs
        const newInhaleTime = parseInt(document.getElementById('inhaleTime').value);
        const newHoldTime = parseInt(document.getElementById('holdTime').value);
        const newExhaleTime = parseInt(document.getElementById('exhaleTime').value);
        const newBreatheToZero = document.getElementById('breatheToZero').checked;
        
        // Validate inputs (ensure they're within reasonable ranges)
        if (newInhaleTime >= 1 && newInhaleTime <= 10 &&
            newHoldTime >= 1 && newHoldTime <= 10 &&
            newExhaleTime >= 1 && newExhaleTime <= 10) {
            
            // Update breathing pattern variables
            inhaleTime = newInhaleTime;
            holdTime = newHoldTime;
            exhaleTime = newExhaleTime;
            breatheToZero = newBreatheToZero;
            
            // Save to localStorage
            localStorage.setItem('breathenInhaleTime', inhaleTime);
            localStorage.setItem('breathenHoldTime', holdTime);
            localStorage.setItem('breathenExhaleTime', exhaleTime);
            localStorage.setItem('breathenBreatheToZero', breatheToZero);
            
            // Close settings panel
            settingsPanel.classList.remove('visible');
            
            // Show confirmation
            const confirmationToast = document.createElement('div');
            confirmationToast.className = 'confirmation-toast';
            confirmationToast.textContent = 'Settings saved!';
            document.body.appendChild(confirmationToast);
            
            // Remove confirmation after animation
            setTimeout(() => {
                confirmationToast.classList.add('show');
                setTimeout(() => {
                    confirmationToast.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(confirmationToast);
                    }, 300);
                }, 2000);
            }, 10);
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
            // Unmute or restore volume just before actual playback
            if (typeof audioToPlay.muted !== 'undefined') {
                audioToPlay.muted = false;
            } else {
                audioToPlay.volume = 1;
            }
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
        
        // Calculate total cycle time based on current settings and breatheToZero setting
        // If breatheToZero is false, we need to subtract 1 second from each phase
        const extraSecond = breatheToZero ? 1 : 0;
        const inhaleDuration = inhaleTime + extraSecond;
        const holdDuration = holdTime + extraSecond;
        const exhaleDuration = exhaleTime + extraSecond;
        const totalCycleTime = (inhaleDuration + holdDuration + exhaleDuration) * 1000;
        
        // Start the sequence after the specified delay
        setTimeout(() => {
            startOverlay.style.opacity = '0';
            setTimeout(() => {
                startOverlay.style.display = 'none';
                displayRandomGratitude(); // Refresh gratitude for next session
                breathingCycle();
                breathingInterval = setInterval(breathingCycle, totalCycleTime);
            }, 500);
        }, initialDelay);
    }
    
    // Handle a single breathing cycle
    function breathingCycle() {
        clearAllCountdowns();
        
        // Calculate durations based on breatheToZero setting
        // If breatheToZero is false, we don't add the extra second
        const extraSecond = breatheToZero ? 1 : 0;
        const inhaleDuration = inhaleTime + extraSecond;
        const holdDuration = holdTime + extraSecond;
        const exhaleDuration = exhaleTime + extraSecond;
        
        // Update CSS animations to match the current durations
        // If breatheToZero is false, we need to adjust the animation duration to match the actual countdown time
        const animationAdjustment = breatheToZero ? 0 : -1;
        document.documentElement.style.setProperty('--inhale-duration', `${inhaleTime + animationAdjustment}s`);
        document.documentElement.style.setProperty('--hold-duration', `${holdTime + animationAdjustment}s`);
        document.documentElement.style.setProperty('--exhale-duration', `${exhaleTime + animationAdjustment}s`);
        
        // Get both circle elements
        const breathingCircleOuter = document.querySelector('.breathing-circle');
        const breathingCircleElement = document.querySelector('.circle-inner');
        
        // Add active class to outer circle for pulsing effect
        breathingCircleOuter.classList.add('active');
        
        // Reset animations to ensure they apply correctly
        if (breathingCircleElement) {
            // Remove all animation classes
            breathingCircleElement.classList.remove('inhale', 'hold', 'exhale');
            
            // Force a reflow to ensure animations restart properly
            void breathingCircleElement.offsetWidth;
        }
        
        // Inhale phase
        currentPhase = 'inhale';
        instruction.textContent = 'Inhale';
        instruction.classList.add('animate__animated', 'animate__fadeIn');
        
        // Apply inhale animation with a slight delay to ensure it works
        setTimeout(() => {
            breathingCircleElement.classList.add('inhale');
        }, 10);
        
        startCountdown(inhaleTime, 1000);
        playAudio('inhale');
        
        // Hold phase - after inhale duration
        setTimeout(() => {
            currentPhase = 'hold';
            instruction.textContent = 'Hold';
            instruction.classList.remove('animate__fadeIn');
            instruction.classList.add('animate__pulse');
            
            // Reset animation and apply hold
            breathingCircleElement.classList.remove('inhale');
            void breathingCircleElement.offsetWidth; // Force reflow
            breathingCircleElement.classList.add('hold');
            
            startCountdown(holdTime, 1000);
            playAudio('hold');
        }, inhaleDuration * 1000);
        
        // Exhale phase - after inhale + hold duration
        setTimeout(() => {
            currentPhase = 'exhale';
            instruction.textContent = 'Exhale';
            instruction.classList.remove('animate__pulse');
            instruction.classList.add('animate__fadeIn');
            
            // Reset animation and apply exhale
            breathingCircleElement.classList.remove('hold');
            void breathingCircleElement.offsetWidth; // Force reflow
            breathingCircleElement.classList.add('exhale');
            
            startCountdown(exhaleTime, 1000);
            playAudio('exhale');
        }, (inhaleDuration + holdDuration) * 1000);
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
        
        // Determine the lowest number to count down to based on breatheToZero setting
        const lowestNumber = breatheToZero ? 0 : 1;
        
        // Calculate the total countdown time based on whether we're counting to 0 or stopping at 1
        const totalCountdownTime = from * interval;
        
        for (let i = from - 1; i >= lowestNumber; i--) {
            // Calculate the proportion of time that should have elapsed by this point
            // This ensures the countdown is evenly distributed across the total time
            const proportion = (from - i) / from;
            const timeToShow = Math.round(proportion * totalCountdownTime);
            
            const timer = setTimeout(() => {
                updateNumberCue(i);
            }, timeToShow);
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
            robustPreloadAndUnlockAudio(); // This is now silent
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
