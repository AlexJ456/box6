document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  // App state
  const state = {
    isPlaying: false,
    count: 0,
    countdown: 4,
    totalTime: 0,
    soundEnabled: false,
    timeLimit: '',
    sessionComplete: false,
    timeLimitReached: false
  };
  
  // Load saved settings from localStorage
  function loadSavedSettings() {
    try {
      const savedSettings = localStorage.getItem('boxBreathingSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        state.soundEnabled = settings.soundEnabled || false;
        state.timeLimit = settings.timeLimit || '';
      }
    } catch (e) {
      console.error('Error loading saved settings:', e);
    }
  }
  
  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem('boxBreathingSettings', JSON.stringify({
        soundEnabled: state.soundEnabled,
        timeLimit: state.timeLimit
      }));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
  
  // SVG Icons
  const icons = {
    play: `<svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
    pause: `<svg class="icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
    volume2: `<svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    volumeX: `<svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    rotateCcw: `<svg class="icon" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
    clock: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
  };
  
  // Helper functions
  function getInstruction(count) {
    switch (count) {
      case 0: return "Inhale";
      case 1: return "Hold";
      case 2: return "Exhale";
      case 3: return "Wait";
      default: return "";
    }
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function playTone() {
    if (state.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz is A4
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1); // Play for 0.1 seconds
      } catch (e) {
        console.error('Error playing tone:', e);
      }
    }
  }
  
  // Interval reference
  let interval;
  
  // Event handlers
  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    
    if (state.isPlaying) {
      state.totalTime = 0;
      state.countdown = 4;
      state.count = 0;
      state.sessionComplete = false;
      state.timeLimitReached = false;
      startInterval();
    } else {
      clearInterval(interval);
    }
    
    render();
  }
  
  function resetToStart() {
    state.isPlaying = false;
    state.totalTime = 0;
    state.countdown = 4;
    state.count = 0;
    state.sessionComplete = false;
    state.timeLimit = state.timeLimit;
    state.timeLimitReached = false;
    clearInterval(interval);
    render();
  }
  
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    saveSettings();
    render();
  }
  
  function handleTimeLimitChange(e) {
    // Update state but don't re-render
    state.timeLimit = e.target.value.replace(/[^0-9]/g, '');
    saveSettings();
  }
  
  function startWithPreset(minutes) {
    state.timeLimit = minutes.toString();
    state.isPlaying = true;
    state.totalTime = 0;
    state.countdown = 4;
    state.count = 0;
    state.sessionComplete = false;
    state.timeLimitReached = false;
    saveSettings();
    startInterval();
    render();
  }
  
  function startInterval() {
    clearInterval(interval);
    
    interval = setInterval(() => {
      // Increment total time
      state.totalTime += 1;
      
      // Check if time limit has been reached
      if (state.timeLimit && !state.timeLimitReached) {
        const timeLimitSeconds = parseInt(state.timeLimit) * 60;
        if (state.totalTime >= timeLimitSeconds) {
          state.timeLimitReached = true;
        }
      }
      
      // Handle countdown and phase changes
      if (state.countdown === 1) {
        // We're about to change phases
        state.count = (state.count + 1) % 4;
        playTone();
        state.countdown = 4;
      } else {
        state.countdown -= 1;
      }
      
      // Check if session should end
      if (state.timeLimitReached && state.count === 0 && state.countdown === 4) {
        state.isPlaying = false;
        state.sessionComplete = true;
        clearInterval(interval);
      }
      
      render();
    }, 1000);
  }
  
  // Check for URL parameters for presets
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const preset = urlParams.get('preset');
    if (preset) {
      startWithPreset(preset);
    }
  }
  
  // Render function
  function render() {
    let content = '';
    
    if (state.isPlaying) {
      // Playing state
      content = `
        <h1>Box Breathing</h1>
        <div class="instruction">${getInstruction(state.count)}</div>
        <div class="countdown">${state.countdown}</div>
        <button id="pauseBtn">${icons.pause} Pause</button>
        <div class="timer">${formatTime(state.totalTime)}</div>
      `;
    } else if (state.sessionComplete) {
      // Session complete state
      content = `
        <h1>Box Breathing</h1>
        <div class="complete">Session Complete!</div>
        <div class="prompt">You completed ${formatTime(state.totalTime)} of box breathing</div>
        <button id="resetBtn">${icons.rotateCcw} Start Again</button>
        <div class="shortcut-buttons">
          <button class="preset-button" id="preset2">2 Min</button>
          <button class="preset-button" id="preset5">5 Min</button>
          <button class="preset-button" id="preset10">10 Min</button>
        </div>
      `;
    } else {
      // Start state
      content = `
        <h1>Box Breathing</h1>
        <div class="prompt">Ready to start box breathing?</div>
        <div class="settings">
          <div class="form-group">
            <label for="timeLimit">${icons.clock} Time Limit (minutes):</label>
            <input type="text" id="timeLimit" placeholder="Optional" value="${state.timeLimit}">
          </div>
          <div class="form-group">
            <label for="soundToggle">
              ${state.soundEnabled ? icons.volume2 : icons.volumeX} Sound:
            </label>
            <label class="switch">
              <input type="checkbox" id="soundToggle" ${state.soundEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <button id="startBtn">${icons.play} Start</button>
        <div class="shortcut-buttons">
          <button class="preset-button" id="preset2">2 Min</button>
          <button class="preset-button" id="preset5">5 Min</button>
          <button class="preset-button" id="preset10">10 Min</button>
        </div>
      `;
    }
    
    app.innerHTML = content;
    
    // Add event listeners
    if (state.isPlaying) {
      document.getElementById('pauseBtn').addEventListener('click', togglePlay);
    } else if (state.sessionComplete) {
      document.getElementById('resetBtn').addEventListener('click', resetToStart);
      document.getElementById('preset2').addEventListener('click', () => startWithPreset(2));
      document.getElementById('preset5').addEventListener('click', () => startWithPreset(5));
      document.getElementById('preset10').addEventListener('click', () => startWithPreset(10));
    } else {
      document.getElementById('startBtn').addEventListener('click', togglePlay);
      document.getElementById('soundToggle').addEventListener('change', toggleSound);
      document.getElementById('timeLimit').addEventListener('input', handleTimeLimitChange);
      document.getElementById('preset2').addEventListener('click', () => startWithPreset(2));
      document.getElementById('preset5').addEventListener('click', () => startWithPreset(5));
      document.getElementById('preset10').addEventListener('click', () => startWithPreset(10));
    }
  }
  
  // Initialize the app
  loadSavedSettings();
  render();
  checkUrlParams();
  
  // Handle visibility change to pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isPlaying) {
      togglePlay();
    }
  });
});
