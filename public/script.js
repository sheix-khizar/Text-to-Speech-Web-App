document.addEventListener('DOMContentLoaded', function() {
    // Check browser support
    if (!('speechSynthesis' in window)) {
        document.getElementById('status').innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-circle text-red-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">
                            Your browser doesn't support the Web Speech API. Please try Chrome, Edge, or Firefox for the best experience.
                        </p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('playBtn').disabled = true;
        return;
    }

    // DOM Elements
    const elements = {
        textInput: document.getElementById('textInput'),
        voiceSelect: document.getElementById('voiceSelect'),
        speedInput: document.getElementById('speedInput'),
        speedValue: document.getElementById('speedValue'),
        pitchInput: document.getElementById('pitchInput'),
        pitchValue: document.getElementById('pitchValue'),
        charCount: document.getElementById('charCount'),
        playBtn: document.getElementById('playBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        stopBtn: document.getElementById('stopBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        clearBtn: document.getElementById('clearBtn'),
        status: document.getElementById('status'),
        playerContainer: document.getElementById('playerContainer'),
        audioPlayer: document.getElementById('audioPlayer'),
        progressBar: document.getElementById('progressBar'),
        currentTime: document.getElementById('currentTime'),
        duration: document.getElementById('duration')
    };

    // Speech Synthesis
    const synth = window.speechSynthesis;
    let utterance = null;
    let voices = [];
    let audioBlob = null;

    // Initialize
    function init() {
        loadVoices();
        setupEventListeners();
        updateCharCount();
        resetButtons();
    }

    // Load available voices
    function loadVoices() {
        voices = synth.getVoices();
        elements.voiceSelect.innerHTML = '<option value="">Default Voice</option>';
        
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - DEFAULT' : ''}`;
            option.value = voice.name;
            option.setAttribute('data-lang', voice.lang);
            elements.voiceSelect.appendChild(option);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Input events
        elements.textInput.addEventListener('input', updateCharCount);
        elements.speedInput.addEventListener('input', () => {
            elements.speedValue.textContent = `${elements.speedInput.value}x`;
        });
        elements.pitchInput.addEventListener('input', () => {
            elements.pitchValue.textContent = elements.pitchInput.value;
        });

        // Button events
        elements.playBtn.addEventListener('click', playTTS);
        elements.pauseBtn.addEventListener('click', pauseTTS);
        elements.resumeBtn.addEventListener('click', resumeTTS);
        elements.stopBtn.addEventListener('click', stopTTS);
        elements.downloadBtn.addEventListener('click', downloadAudio);
        elements.clearBtn.addEventListener('click', clearText);

        // Audio player events
        elements.audioPlayer.addEventListener('timeupdate', updateProgress);
        elements.audioPlayer.addEventListener('loadedmetadata', () => {
            elements.duration.textContent = formatTime(elements.audioPlayer.duration);
        });

        // Voices may not be immediately available
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    // Update character count
    function updateCharCount() {
        const count = elements.textInput.value.length;
        elements.charCount.textContent = `${count}/20,000`;
        
        if (count > 20000) {
            elements.charCount.classList.add('text-red-500');
            elements.playBtn.disabled = true;
        } else {
            elements.charCount.classList.remove('text-red-500');
            elements.playBtn.disabled = false;
        }
    }

    // Play TTS
    function playTTS() {
        const text = elements.textInput.value.trim();
        if (!text) {
            showStatus('Please enter some text first', 'error');
            return;
        }

        if (text.length > 20000) {
            showStatus('Text exceeds 20,000 character limit', 'error');
            return;
        }

        // Cancel any current speech
        synth.cancel();

        // Create new utterance
        utterance = new SpeechSynthesisUtterance(text);

        // Set voice if selected
        const selectedVoice = elements.voiceSelect.value;
        if (selectedVoice) {
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) utterance.voice = voice;
        }

        // Set rate and pitch
        utterance.rate = parseFloat(elements.speedInput.value);
        utterance.pitch = parseFloat(elements.pitchInput.value);

        // Event listeners
        utterance.onstart = () => {
            showStatus('Converting text to speech...', 'info');
            toggleButtons(true);
        };

        utterance.onend = () => {
            showStatus('Conversion complete', 'success');
            toggleButtons(false);
            elements.playerContainer.classList.remove('hidden');
        };

        utterance.onerror = (event) => {
            showStatus(`Error: ${event.error}`, 'error');
            toggleButtons(false);
        };

        // Speak the text
        synth.speak(utterance);
    }

    // Pause TTS
    function pauseTTS() {
        synth.pause();
        showStatus('Paused', 'warning');
        elements.pauseBtn.disabled = true;
        elements.resumeBtn.disabled = false;
    }

    // Resume TTS
    function resumeTTS() {
        synth.resume();
        showStatus('Resuming...', 'info');
        elements.pauseBtn.disabled = false;
        elements.resumeBtn.disabled = true;
    }

    // Stop TTS
    function stopTTS() {
        synth.cancel();
        showStatus('Stopped', 'info');
        toggleButtons(false);
    }

    // Download audio
    function downloadAudio() {
        if (!audioBlob) {
            showStatus('No audio to download. Please generate speech first.', 'error');
            return;
        }

        const a = document.createElement('a');
        a.href = URL.createObjectURL(audioBlob);
        a.download = `tts-output-${new Date().getTime()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showStatus('Download started', 'success');
    }

    // Clear text
    function clearText() {
        elements.textInput.value = '';
        updateCharCount();
        showStatus('Text cleared', 'info');
    }

    // Update progress bar
    function updateProgress() {
        const progress = (elements.audioPlayer.currentTime / elements.audioPlayer.duration) * 100;
        elements.progressBar.style.width = `${progress}%`;
        elements.currentTime.textContent = formatTime(elements.audioPlayer.currentTime);
    }

    // Format time as MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Show status message
    function showStatus(message, type) {
        let bgColor, textColor, icon;
        
        switch(type) {
            case 'error':
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                icon = 'fa-exclamation-circle';
                break;
            case 'success':
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                icon = 'fa-check-circle';
                break;
            case 'warning':
                bgColor = 'bg-yellow-50';
                textColor = 'text-yellow-700';
                icon = 'fa-exclamation-triangle';
                break;
            default: // info
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-700';
                icon = 'fa-info-circle';
        }
        
        elements.status.innerHTML = `
            <div class="${bgColor} border-l-4 border-${textColor.split('-')[1]}-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas ${icon} ${textColor}"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm ${textColor}">
                            ${message}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    // Toggle button states
    function toggleButtons(isPlaying) {
        elements.playBtn.disabled = isPlaying;
        elements.pauseBtn.disabled = !isPlaying;
        elements.resumeBtn.disabled = true;
        elements.stopBtn.disabled = !isPlaying;
        elements.downloadBtn.disabled = isPlaying;
    }

    // Reset buttons to initial state
    function resetButtons() {
        elements.playBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.resumeBtn.disabled = true;
        elements.stopBtn.disabled = true;
        elements.downloadBtn.disabled = true;
        elements.playerContainer.classList.add('hidden');
    }

    // Initialize the app
    init();
});