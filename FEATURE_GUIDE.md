# Verbatim - Voice Transcriber Project Guide

## Complete Feature Documentation with Code Explanations

This document explains each feature of the Verbatim voice transcriber web app, showing you exactly how to explain each part to your guide.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Feature Detection](#1-feature-detection)
3. [API Configuration System](#2-api-configuration-system)
4. [Mode Toggle (Live/Quality/File)](#3-mode-toggle-livequalityfile)
5. [Live Recording (Web Speech API)](#4-live-recording-web-speech-api)
6. [Quality Recording (MediaRecorder)](#5-quality-recording-mediarecorder)
7. [File Transcription](#6-file-transcription)
8. [Smart Punctuation](#7-smart-punctuation)
9. [Segment Management](#9-segment-management)
10. [Memory/Context System](#10-memorycontext-system)
11. [AI Output Features](#11-ai-output-features)
12. [Verba Assistant](#12-verba-assistant)
13. [Export/Download](#13-exportdownload)
14. [Keyboard Shortcuts](#14-keyboard-shortcuts)
15. [Three-Column Workspace](#15-three-column-workspace)
16. [Toast Notifications](#16-toast-notifications)
17. [Audio Visualization](#17-audio-visualization)

---

## Project Overview

**What I Built:** A voice transcription web app that runs entirely in the browser using Web Speech API for live transcription and Whisper API (via Groq/OpenAI) for quality transcription.

**Tech Stack:**
- HTML5, CSS3, Vanilla JavaScript (no frameworks)
- Web Speech API (browser native)
- MediaRecorder API (audio recording)
- Groq/OpenAI Whisper API (quality transcription)
- LocalStorage for persistence

---

## 1. Feature Detection

### What It Does
Automatically detects what the user's browser can do - checks for speech recognition, media recording, audio context, etc.

### How to Explain to Your Guide
"I check what features the user's browser supports when the app loads. This ensures the app works differently on Chrome vs Safari vs Firefox."

### Code Snippet
```javascript
// Feature Detection - Check browser capabilities
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function detectRuntimeCapabilities() {
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const platform = navigator.platform || '';
    const maxTouch = Number(navigator.maxTouchPoints || 0);
    
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua);
    
    const hasSpeechRecognition = !!SR;
    const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
    const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
    const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
    const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
    
    return {
        browserFamily: isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Unknown',
        platformFamily: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop',
        isSafari, isIOS, isMobile: isIOS || isAndroid,
        hasSpeechRecognition,
        hasMediaRecorder,
        hasDisplayMedia,
        hasAudioContext,
        hasGetUserMedia,
        supportsMicQuality: hasMediaRecorder && hasGetUserMedia,
        supportsTabOrScreenCapture: hasDisplayMedia && hasMediaRecorder && !isMobile,
        canBoot: hasSpeechRecognition || supportsMicQuality || hasAudioContext
    };
}

const runtimeCapabilities = detectRuntimeCapabilities();

// Only boot if browser has required features
if (!runtimeCapabilities.canBoot) {
    mainContent.innerHTML = `<div class="not-supported">Browser not supported</div>`;
} else {
    buildApp();
}
```

---

## 2. API Configuration System

### What It Does
Allows users to input API keys for Groq (free), OpenAI, and Gemini. Keys are stored in localStorage.

### How to Explain to Your Guide
"I built a secure key management system where users can input their API keys. These are stored in the browser's localStorage - never sent to any server except directly to the AI providers."

### Code Snippet
```javascript
// State object stores all configuration
let state = {
    apiProvider: localStorage.getItem('vt_provider') || 'groq',
    apiKey: localStorage.getItem('vt_api_key') || '',
    providerKeys: (() => {
        try { 
            return normalizeProviderKeyStore(JSON.parse(localStorage.getItem('vt_provider_keys') || '{}')); 
        }
        catch (e) { return normalizeProviderKeyStore({}); }
    })(),
    geminiAnalysisModel: localStorage.getItem('vt_gemini_analysis_model') || '',
    chatModel: localStorage.getItem('vt_chat_model') || '',
};

// Helper to get API keys from multiple sources
function getProviderKeys(provider = state.apiProvider) {
    state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
    const vault = Array.isArray(state.providerKeys?.[provider]) 
        ? state.providerKeys[provider].filter(Boolean) 
        : [];
    const apiKey = provider === state.apiProvider ? (state.apiKey || '').trim() : '';
    if (apiKey && !vault.includes(apiKey)) return [apiKey, ...vault];
    return vault;
}

// API Endpoint helpers
function getAudioEndpoint(kind = 'transcriptions', provider = state.apiProvider) {
    return provider === 'groq'
        ? `https://api.groq.com/openai/v1/audio/${kind}`
        : `https://api.openai.com/v1/audio/${kind}`;
}

function getChatEndpoint(provider = state.apiProvider) {
    return provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
}
```

---

## 3. Mode Toggle (Live/Quality/File)

### What It Does
Three recording modes: Live (real-time speech), Quality (records then transcribes), File (upload audio file).

### How to Explain to Your Guide
"I implemented three ways to capture audio: Live mode uses browser's built-in speech recognition for instant results, Quality mode records audio and sends to Whisper API for better accuracy, and File mode lets you upload pre-recorded audio."

### Code Snippet
```javascript
// Mode state in the app
let state = {
    mode: 'realtime', // 'realtime', 'quality', or 'file'
    captureSource: 'mic', // 'mic', 'browser-tab', 'screen-audio', 'external-help'
};

// Mode switching function
function setMode(mode) {
    if (state.isRecording) forceStop();
    state.mode = mode;

    // Update UI - toggle buttons
    document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Show/hide panels based on mode
    uploadPanel.classList.toggle('visible', mode === 'file');
    recPanel.style.display = mode === 'file' ? 'none' : '';

    if (mode === 'file') {
        setStatus('File mode', 'Upload an audio file to transcribe');
    } else if (mode === 'quality') {
        setStatus('Ready to record', 'Quality mode - records, then sends to Whisper');
    } else {
        setStatus('Ready to record', 'Click orb or press Space');
    }
}

// Event listeners for mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
});
```

### HTML Structure
```html
<div class="mode-toggle">
    <button class="mode-btn active" id="modeRealtime" data-mode="realtime">
        <span class="mode-dot"></span> Live
    </button>
    <button class="mode-btn" id="modeQuality" data-mode="quality">
        <span class="mode-dot"></span> Quality
    </button>
    <button class="mode-btn" id="modeFile" data-mode="file">
        <span class="mode-dot"></span> File
    </button>
</div>
```

---

## 4. Live Recording (Web Speech API)

### What It Does
Uses browser's native SpeechRecognition API for real-time transcription as you speak.

### How to Explain to Your Guide
"I used the Web Speech API - a built-in browser feature. It captures your microphone and converts speech to text in real-time without sending audio to any server. This is why it's free and fast!"

### Code Snippet
```javascript
// Initialize Speech Recognition
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SR) {
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-IN';

    // Handle transcription results
    recognition.onresult = (e) => {
        clearNoSpeechTimer();
        
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            let text = res[0].transcript.trim();
            const conf = res[0].confidence;
            
            if (res.isFinal) {
                if (!text) continue;
                
                // Add smart punctuation based on pause duration
                const gapMs = state.lastEndTime ? Date.now() - state.lastEndTime : 0;
                text = applySmartPunct(text, gapMs);
                
                // Add as segment
                addSegment(text, conf);
                state.confirmedText = transcript.value;
                state.lastEndTime = Date.now();
            } else {
                interim = text;
            }
        }
        
        // Show interim (not yet finalized) text
        if (interim) {
            interimEl.textContent = interim;
            const sep = state.confirmedText && !state.confirmedText.endsWith('\n') ? ' ' : '';
            transcript.value = state.confirmedText + sep + interim;
        }
        setNoSpeechTimer();
    };

    // Handle errors
    recognition.onerror = (e) => {
        if (e.error === 'not-allowed') {
            forceStop();
            toast('Microphone permission denied', 'error');
        } else if (e.error === 'network') {
            if (state.isRecording) scheduleRestart();
        }
    };

    recognition.onend = () => {
        // Auto-restart if still recording
        if (state.isRecording && state.mode === 'realtime') {
            scheduleRestart(50);
        }
    };
}

// Start recording
function startRecording() {
    if (!recognition) {
        toast('Speech Recognition not available', 'error');
        return;
    }
    
    const lang = langSelect.value;
    recognition.lang = lang === 'auto' ? 'en-US' : lang;
    recognition.start();
    
    state.isRecording = true;
    recPanel.classList.add('recording');
    orbTrigger?.setAttribute('aria-pressed', 'true');
    
    setStatus('Recording', 'Speak now - tap the orb or press Space to stop');
    startTimer();
    startAudioFromMic();
    setNoSpeechTimer();
}

// Stop recording
function stopRecording() {
    commitPendingRealtimeInterim();
    state.isRecording = false;
    state.manualStop = true;
    
    try { recognition.stop(); } catch (e) { }
    
    recPanel.classList.remove('recording');
    orbTrigger?.setAttribute('aria-pressed', 'false');
    stopTimer();
    stopAudio();
    scheduleWorkspaceSave();
}
```

---

## 5. Quality Recording (MediaRecorder)

### What It Does
Records audio using MediaRecorder API, then sends to Whisper API for higher quality transcription.

### How to Explain to Your Guide
"I used MediaRecorder API to capture audio. This records the actual audio data which I then process and send to Groq's Whisper API. This gives much better accuracy than browser speech recognition, especially for longer recordings."

### Code Snippet
```javascript
// Quality Recording - records first, then transcribes
function startQualityRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        state.micStream = stream;
        state.recordedChunks = [];

        // Determine best audio format
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/ogg;codecs=opus';
            }
        }

        const options = mimeType ? { mimeType } : {};
        state.mediaRecorder = new MediaRecorder(stream, options);

        // Capture audio chunks
        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) state.recordedChunks.push(e.data);
        };

        // When recording stops - transcribe
        state.mediaRecorder.onstop = async () => {
            const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
            stream.getTracks().forEach(t => t.stop());

            setStatus('Processing recording...', 'Sending to speech-to-text');

            try {
                // Process audio: decode -> preprocess -> resample -> transcribe
                const arrayBuf = await blob.arrayBuffer();
                const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                const decoded = await tempCtx.decodeAudioData(arrayBuf);
                
                const analysis = analyzeAudio(decoded);
                const processed = await processAudioBuffer(decoded, analysis, true);
                const resampled = await resampleTo16k(processed);
                
                // Send to API
                const maxChunkBytes = 24 * 1024 * 1024;
                const chunks = chunkWavBlob(resampled, maxChunkBytes);
                const wLang = getWhisperLang();

                const result = await transcribeChunks(chunks, { language: wLang }, null);
                displayFileResult(result);
                
                toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');
            } catch (err) {
                toast('Transcription error: ' + err.message, 'error');
            }
        };

        state.mediaRecorder.start(1000);
        state.isRecording = true;
        recPanel.classList.add('recording');
        
        setStatus('Recording (Quality)', 'Speak now - tap orb to stop');
        startTimer();
        startAudioVisualizer(stream);
    });
}

function stopQualityRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
    state.isRecording = false;
    recPanel.classList.remove('recording');
    stopTimer();
    stopAudio();
}
```

---

## 6. File Transcription

### What It Does
Allows users to upload audio files which are then transcribed using Whisper API.

### How to Explain to Your Guide
"I built a drag-and-drop file upload system. When you drop an audio file, I decode it, analyze it for quality, preprocess it (normalize volume), resample to 16kHz (required by Whisper), chunk it if needed, and send to the API."

### Code Snippet
```javascript
// File Upload Handling
function processUploadedFile() {
    if (!state.uploadedFile || !state.apiKey) return;

    state.isProcessing = true;
    progressWrap.classList.add('visible');

    try {
        // Step 1: Decode audio
        setProgress(-1, 'Decoding audio...');
        const arrayBuf = await state.uploadedFile.arrayBuffer();
        state.fileHash = await hashArrayBuffer(arrayBuf);

        // Check cache first
        const cacheKey = buildTranscriptCacheKey(state.fileHash, {...});
        const cached = useCache ? readTranscriptCache(cacheKey) : null;
        
        if (cached) {
            displayFileResult(cached);
            toast('Loaded cached transcript', 'success');
            return;
        }

        // Step 2: Decode
        const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await tempCtx.decodeAudioData(arrayBuf);

        // Step 3: Analyze audio quality
        const analysis = analyzeAudio(decoded);

        // Step 4: Preprocess (normalize volume)
        const doNormalize = $('optNormalize').checked;
        const processed = await processAudioBuffer(decoded, analysis, doNormalize);

        // Step 5: Resample to 16kHz (required by Whisper)
        const resampled = await resampleTo16k(processed);

        // Step 6: Chunk if too large
        const maxChunkBytes = 24 * 1024 * 1024;
        const chunks = chunkWavBlob(resampled, maxChunkBytes);

        // Step 7: Transcribe
        const result = await transcribeChunks(chunks, { language: wLang, translate }, onProgress);
        
        // Cache result
        if (useCache) {
            saveTranscriptCache(cacheKey, result);
        }

        displayFileResult(result);
        toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');
    } finally {
        state.isProcessing = false;
    }
}

// Convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const data = buffer.getChannelData(0);
    const bitsPerSample = 16;
    const byteRate = sr * numCh * bitsPerSample / 8;
    const blockAlign = numCh * bitsPerSample / 8;
    const dataSize = data.length * numCh * bitsPerSample / 8;
    const bufferSize = 44 + dataSize;
    const ab = new ArrayBuffer(bufferSize);
    const dv = new DataView(ab);

    // WAV header
    function writeStr(offset, str) { 
        for (let i = 0; i < str.length; i++) 
            dv.setUint8(offset + i, str.charCodeAt(i)); 
    }
    writeStr(0, 'RIFF');
    dv.setUint32(4, bufferSize - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, numCh, true);
    dv.setUint32(24, sr, true);
    dv.setUint32(28, byteRate, true);
    dv.setUint16(32, blockAlign, true);
    dv.setUint16(34, bitsPerSample, true);
    writeStr(36, 'data');
    dv.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        let s = Math.max(-1, Math.min(1, data[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        dv.setInt16(offset, s, true);
        offset += 2;
    }
    return new Blob([ab], { type: 'audio/wav' });
}
```

---

## 7. Smart Punctuation

### What It Does
Automatically adds punctuation (periods, commas) based on pause duration between words.

### How to Explain to Your Guide
"I track the time gap between your words. If you pause for more than 2 seconds, I add a period. If you pause 0.7-2 seconds, I add a comma. This makes the transcript look more natural!"

### Code Snippet
```javascript
// Smart Punctuation based on pause duration
function applySmartPunct(text, gapMs) {
    if (!state.smartPunctEnabled) return text;
    
    let result = text.trim();
    result = result.charAt(0).toUpperCase() + result.slice(1);
    
    // Add punctuation to previous text based on gap
    if (state.confirmedText && gapMs > 0) {
        const last = state.confirmedText.trimEnd();
        const lastChar = last.slice(-1);
        
        if (!/[.!?,;:\-]/.test(lastChar)) {
            if (gapMs > 2000) {
                // Long pause = period
                state.confirmedText = last + '. ';
                transcript.value = state.confirmedText;
            } else if (gapMs > 700) {
                // Medium pause = comma
                state.confirmedText = last + ', ';
                transcript.value = state.confirmedText;
            }
        }
    }
    return result;
}
```

---

## 8. Segment Management

### What It Does
Stores transcription as segments with timestamps, confidence scores, and speaker labels.

### How to Explain to Your Guide
"I don't just store plain text - I store each utterance as a 'segment' with timestamp, confidence score (how sure the AI is), language, and optional speaker label. This lets me show timestamps and confidence levels."

### Code Snippet
```javascript
// Add a new segment
function addSegment(text, conf, timeStr, lang) {
    if (!text) return;
    
    const elapsed = state.sessionStart ? Date.now() - state.sessionStart : 0;
    const seg = normalizeSegment({
        text,
        conf: conf || 0,
        time: timeStr || fmtTime(elapsed),
        lang: lang || '',
        created: Date.now(),
        startSec: timeStr ? parseTimeStr(timeStr) : elapsed / 1000,
        endSec: null,
        speaker: state.speakerMode ? (state.segments.length % 2 === 0 ? 'Speaker A' : 'Speaker B') : ''
    }, state.segments.length);
    
    state.segments.push(seg);
    
    // Update previous segment's end time
    if (state.segments.length > 1) {
        const prev = state.segments[state.segments.length - 2];
        if (!prev.endSec) prev.endSec = seg.startSec;
    }
    
    renderSegments();
    rebuildTranscriptFromSegments();
}

// Render segments view
function renderSegments() {
    segView.innerHTML = state.segments.map((seg, idx) => `
        <div class="segment">
            <span class="seg-time">${seg.time}</span>
            ${seg.lang ? `<span class="seg-lang">${seg.lang}</span>` : ''}
            <span class="seg-text">${seg.text}</span>
            <span class="seg-conf ${getConfClass(seg.conf)}">${(seg.conf * 100).toFixed(0)}%</span>
        </div>
    `).join('');
}

function getConfClass(conf) {
    if (conf >= 0.8) return 'high';
    if (conf >= 0.5) return 'mid';
    return 'low';
}
```

---

## 9. Memory/Context System

### What It Does
Allows users to import "memory" - context about themselves, projects, preferences - that gets injected into AI prompts for more personalized output.

### How to Explain to Your Guide
"I built a memory system where you can paste information about yourself (name, projects, preferences, terminology). When you use AI features, this memory is injected into the prompt so the AI knows who you are and what you care about."

### Code Snippet
```javascript
// Memory state
let state = {
    memoryRaw: localStorage.getItem('vt_memory_raw') || '',
    memoryImportedAt: localStorage.getItem('vt_memory_imported_at') || '',
    memoryPacks: [],
    activeMemoryPackId: '',
    outputStyle: localStorage.getItem('vt_output_style') || 'default',
};

// Import memory
function setImportedMemory(rawText, { announce = true } = {}) {
    const normalized = normalizeImportedMemory(rawText);
    state.memoryRaw = normalized;
    state.memoryImportedAt = normalized ? new Date().toISOString() : '';
    persistMemoryStore();
    renderMemoryUi();
    
    if (announce) {
        toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info');
    }
}

// Get memory context for AI prompts
function getImportedMemoryContext({ maxChars = 9000 } = {}) {
    const raw = normalizeImportedMemory(state.memoryRaw || '');
    if (!raw) return '';
    
    const compact = raw.length > maxChars
        ? `${raw.slice(0, maxChars).trim()}\n\n[Imported memory truncated for token control]`
        : raw;
    
    return [
        'Imported user memory and long-term context:',
        'Use this for preferences, ongoing projects, terminology, and stable background context.',
        'If transcript or runtime state conflicts with memory, trust the transcript/runtime state first.',
        '',
        compact
    ].join('\n');
}

// Memory Packs - separate memory sets for different projects
function createMemoryPack(name) {
    const cleanName = String(name || '').trim();
    const id = `memory_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    state.memoryPacks.push({ id, name: cleanName, raw: '', importedAt: '' });
    state.activeMemoryPackId = id;
    persistMemoryPacksStore();
    renderMemoryUi();
}
```

---

## 10. AI Output Features

### What It Does
Provides AI-powered tools: AI Clean (fix transcript), Summary, Action Items, and custom prompts.

### How to Explain to Your Guide
"I integrated AI to process your transcripts. You can get AI Cleaned versions, summaries, extract action items, or build custom prompts. The AI uses your transcript plus your imported memory for context."

### Code Snippet
```javascript
// AI Output state
let state = {
    aiBusy: false,
    aiOutput: sessionStorage.getItem('vt_ai_output') || '',
    outputStyle: localStorage.getItem('vt_output_style') || 'default',
};

// Output style instructions
function getOutputStyleInstruction(style = state.outputStyle) {
    const map = {
        default: 'Use a balanced, practical style that is clear and directly useful.',
        concise: 'Keep the response compact, sharp, and low-fluff. Prioritize signal over explanation.',
        executive: 'Write for a busy executive. Lead with decisions, risks, and impact. Keep it polished.',
        technical: 'Write for an engineer. Be precise, structured, and implementation-aware.',
        founder: 'Write like a strong founder/operator brief. Focus on priorities, tradeoffs, leverage, and next moves.',
        'client-ready': 'Write as polished client-facing output with clarity, professionalism, and clean wording.',
        'meeting-notes': 'Write as clean meeting notes with clear sections, outcomes, owners, and next steps.'
    };
    return map[style] || map.default;
}

// Get task-specific memory guidance
function getTaskMemoryGuidance(taskName = '') {
    if (taskName === 'ai-clean') {
        return 'Use memory lightly for terminology, proper nouns, and writing preferences.';
    }
    if (taskName === 'summary') {
        return 'Use memory strongly to prioritize what matters most to this user.';
    }
    if (taskName === 'action-items') {
        return 'Use memory to interpret project context and likely priorities.';
    }
    return 'Use memory when it improves relevance.';
}

// Build AI request with full context
function buildAiRequest(task, transcript, options = {}) {
    const memoryContext = getImportedMemoryContext();
    const styleInstruction = getOutputStyleInstruction(state.outputStyle);
    const memoryGuidance = getTaskMemoryGuidance(task);
    
    return {
        messages: [
            {
                role: 'system',
                content: `You are a helpful AI assistant analyzing a transcript. ${styleInstruction} ${memoryGuidance}`
            },
            ...(memoryContext ? [{ role: 'system', content: memoryContext }] : []),
            {
                role: 'user',
                content: options.customPrompt || getDefaultPrompt(task, transcript)
            }
        ]
    };
}

function getDefaultPrompt(task, transcript) {
    const prompts = {
        'ai-clean': `Clean up this transcript: ${transcript}`,
        'summary': `Summarize this transcript: ${transcript}`,
        'action-items': `Extract action items from this transcript: ${transcript}`,
    };
    return prompts[task] || transcript;
}
```

---

## 11. Verba Assistant

### What It Does
A chat assistant that can answer questions about the app, help with transcription, analyze files, etc.

### How to Explain to Your Guide
"I built a full chat interface with a 3D robot avatar! The assistant can answer questions about the app, analyze uploaded files (images, PDFs), and use the current transcript as context. It uses smart routing to pick the best AI model."

### Code Snippet
```javascript
// Assistant state
let state = {
    assistant: {
        isOpen: false,
        minimized: true,
        model: localStorage.getItem('vt_assistant_model') || '',
        conversations: JSON.parse(localStorage.getItem('vt_assistant_conversations') || '[]'),
        messages: JSON.parse(localStorage.getItem('vt_assistant_thread') || '[]'),
    }
};

// Smart model selection based on request
function resolveMaxAssistantModel(attachments = null, text = '') {
    const normalizedAttachments = normalizeAssistantAttachmentList(attachments);
    
    // Has attachments? Use Gemini
    if (normalizedAttachments.length) {
        if (getProviderKeys('gemini').length) {
            return getConfiguredGeminiAnalysisOption();
        }
    }
    
    // Long output? Use Llama 3.3
    if (isLongOutputAssistantRequest(text)) {
        return findAssistantCatalogOption('groq:llama-3.3-70b-versatile');
    }
    
    // Context heavy? Use Kimi K2
    if (isContextHeavyAssistantRequest(text)) {
        return findAssistantCatalogOption('groq:moonshotai/kimi-k2-instruct');
    }
    
    // Quick response? Use fast model
    if (isQuickAssistantRequest(text)) {
        return findAssistantCatalogOption('groq:llama-3.1-8b-instant');
    }
    
    // Default
    return findAssistantCatalogOption('groq:llama-3.3-70b-versatile');
}

// Send message to assistant
async function sendAssistantMessage(text, attachments = null) {
    const option = getAssistantOptionForRequest(attachments, text);
    
    // Build messages with transcript context
    const messages = [
        { role: 'system', content: getAssistantSystemPrompt() },
        ...state.assistant.messages,
        { role: 'user', content: text }
    ];
    
    // If file attachments, include them
    if (attachments && attachments.length) {
        const multimodalContent = await processAttachments(attachments, text);
        messages[messages.length - 1].content = multimodalContent;
    }
    
    // Send to API
    const response = await fetch(option.provider === 'gemini' 
        ? getGeminiChatEndpoint(option.model) 
        : getChatEndpoint(option.provider === 'groq' ? 'groq' : 'openai'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getProviderKeys(option.provider === 'gemini' ? 'gemini' : state.apiProvider)[0]}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: option.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: option.provider === 'gemini' ? 8192 : 4096
        })
    });
    
    const result = await response.json();
    const assistantReply = result.choices?.[0]?.message?.content || result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Add to messages
    state.assistant.messages.push({ role: 'user', content: text });
    state.assistant.messages.push({ role: 'assistant', content: assistantReply });
    
    renderAssistantMessages();
    persistAssistantThread();
}

function getAssistantSystemPrompt() {
    return `You are Verba Assistant, a helpful AI assistant for the Verbatim voice transcription app. 
You help users with:
- How to use the app's features (Live, Quality, File modes)
- API setup (Groq, OpenAI, Gemini)
- Memory and context management
- Export and workspace features
- Answering questions about transcripts

Current transcript: ${transcript.value.slice(0, 2000)}
Use this context when answering questions about the current work.`;
}
```

---

## 12. Export/Download

### What It Does
Export transcripts in various formats: Plain Text, SRT (subtitles), VTT, JSON, Markdown, CSV.

### How to Explain to Your Guide
"I built multiple export formats so users can use transcripts however they need - plain text for documents, SRT/VTT for subtitles, JSON for developers, Markdown for notes, CSV for spreadsheets."

### Code Snippet
```javascript
// Generate SRT (Subtitles)
function generateSRT() {
    return state.segments.map((seg, i) => {
        const startSec = seg.startSec || 0;
        const endSec = seg.endSec || (startSec + 5);
        const line = state.speakerMode && seg.speaker 
            ? `${seg.speaker}: ${seg.text}` 
            : seg.text;
        return `${i + 1}
${formatTimestampFull(startSec)} --> ${formatTimestampFull(endSec)}
${line}
`;
    }).join('\n');
}

// Generate VTT (WebVTT)
function generateVTT() {
    let vtt = 'WEBVTT\n\n';
    state.segments.forEach((seg) => {
        const startSec = seg.startSec || 0;
        const endSec = seg.endSec || (startSec + 5);
        vtt += `${formatTimestampVTT(startSec)} --> ${formatTimestampVTT(endSec)}\n${seg.text}\n\n`;
    });
    return vtt;
}

// Generate JSON
function generateJSON() {
    return JSON.stringify({
        text: transcript.value,
        aiOutput: aiOutput.value,
        preset: state.preset,
        language: state.detectedLanguage || '',
        segments: state.segments,
        metadata: {
            wordCount: transcript.value.trim().split(/\s+/).length,
            exportedAt: new Date().toISOString(),
            fileHash: state.fileHash || ''
        }
    }, null, 2);
}

// Generate Markdown
function generateMarkdown() {
    const title = `# Transcript Export

- Preset: ${state.preset}
- Language: ${state.detectedLanguage || 'UNKNOWN'}
- Exported: ${new Date().toLocaleString()}

## Transcript

${transcript.value.trim() || '_Empty_'}
`;
    const notes = aiOutput.value.trim() ? `\n## AI Output\n\n${aiOutput.value.trim()}\n` : '';
    return title + notes;
}

// Download helper
function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
```

---

## 13. Keyboard Shortcuts

### What It Does
Provides keyboard shortcuts for common actions.

### How to Explain to Your Guide
"I added keyboard shortcuts so power users can work faster - Space to toggle recording, Ctrl+C to copy, Ctrl+D to download, etc."

### Code Snippet
```javascript
// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+C - Copy transcript
    if (e.ctrlKey && e.key === 'c' && !state.isRecording) {
        e.preventDefault();
        copyTranscript();
    }
    
    // Ctrl+D - Download
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        downloadBtn?.click();
    }
    
    // Ctrl+O - Open file
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setMode('file');
    }
    
    // Ctrl+Enter - Transcribe file
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (state.uploadedFile && !transcribeBtn.disabled) {
            processUploadedFile();
        }
    }
    
    // Ctrl+Z - Undo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        restoreFromUndo();
    }
    
    // Space - Toggle recording (when not in input)
    if (e.code === 'Space' && !isInputFocused()) {
        e.preventDefault();
        if (state.isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
});

function isInputFocused() {
    const tag = document.activeElement?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea';
}
```

---

## 14. Three-Column Workspace

### What It Does
Modern desktop layout with left rail (support/tools), center (recording/transcript), right rail (stats/utilities).

### How to Explain to Your Guide
"I designed a professional three-column layout that uses screen space efficiently. The left side has setup guides and AI tools, the center is for recording and editing, and the right side shows stats and quick actions."

### Code Snippet
```css
/* Three-Column Layout */
.workspace-shell {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 300px;
    grid-template-areas: 'left main right';
    gap: 20px;
    align-items: start;
}

.workspace-left-rail {
    grid-area: left;
}

.workspace-main {
    grid-area: main;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.workspace-right-rail {
    grid-area: right;
}

/* Cards in rails */
.utility-card {
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 24px;
    padding: 16px;
}

/* Responsive */
@media (max-width: 1279px) {
    .workspace-shell {
        grid-template-columns: minmax(0, 1fr) 300px;
        grid-template-areas:
            'left left'
            'main right';
    }
}

@media (max-width: 899px) {
    .workspace-shell {
        grid-template-columns: 1fr;
        grid-template-areas:
            'main'
            'right'
            'left';
    }
}
```

---

## 15. Toast Notifications

### What It Does
Non-blocking notifications that appear and auto-dismiss.

### How to Explain to Your Guide
"I built a toast notification system - those little popup messages that appear at the bottom. They're non-blocking so they don't interrupt your work."

### Code Snippet
```javascript
// Toast notification system
function toast(msg, type = 'info', duration = 2400) {
    const container = $('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    
    setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 300);
    }, duration);
}
```

### CSS
```css
.toast-container {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
}

.toast {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 10px 20px;
    border-radius: 20px;
    animation: toastIn 0.3s ease both;
}

.toast.success {
    background: rgba(56, 217, 169, 0.12);
    border-color: rgba(56, 217, 169, 0.4);
    color: var(--accent3);
}

@keyframes toastIn {
    from { opacity: 0; transform: translateY(12px) scale(0.92); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
```

---

## 16. Audio Visualization

### What It Does
Beautiful animated voice orb that reacts to audio input in real-time.

### How to Explain to Your Guide
"I created a canvas-based animated orb using the Web Audio API's AnalyserNode. It visualizes the microphone input level in real-time, giving users visual feedback that recording is working."

### Code Snippet
```javascript
// Start audio visualization
function startAudioVisualizer(stream) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 512;
    state.analyser.smoothingTimeConstant = 0.58;
    
    state.source = state.audioCtx.createMediaStreamSource(stream);
    state.source.connect(state.analyser);
    
    drawWave();
}

// Animation loop
function drawWave() {
    state.animFrame = requestAnimationFrame(drawWave);
    
    const bufLen = state.analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    state.analyser.getByteTimeDomainData(data);
    
    const liveLevel = analyzeLiveLevel(data);
    state.visualLevel = state.visualLevel * 0.82 + liveLevel * 0.18;
    
    drawOrbFrame(state.visualLevel, true, data);
}

// Draw the orb
function drawOrbFrame(level = 0, isLive = false, waveform = null) {
    const { W, H } = ensureCanvasSize();
    if (!W || !H) return;

    const t = performance.now() * 0.001;
    const cx = W / 2;
    const cy = H / 2;
    const size = Math.min(W, H);
    const radius = size * 0.205;
    const easedLevel = Math.pow(Math.max(0, Math.min(1, level)), 0.8);

    ctx2d.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx2d.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.8);
    bg.addColorStop(0, 'rgba(10, 24, 46, 0.12)');
    bg.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
    ctx2d.fillStyle = bg;
    ctx2d.fillRect(0, 0, W, H);

    // Main orb gradient
    const shell = ctx2d.createRadialGradient(cx, cy - radius * 0.35, radius * 0.08, cx, cy, radius * 1.05);
    shell.addColorStop(0, 'rgba(242, 250, 255, 0.98)');
    shell.addColorStop(0.5, 'rgba(96, 183, 255, 0.92)');
    shell.addColorStop(1, 'rgba(19, 118, 255, 0.98)');
    ctx2d.fillStyle = shell;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx2d.fill();

    // Liquid wave effect
    const liquidLevel = cy + radius * (0.24 - easedLevel * 0.12);
    const waveAmp = radius * (0.024 + easedLevel * 0.038);
    const phase = t * 0.72;

    // Draw wave...
}
```

---

## Summary: What I Used

| Feature | Technology/API |
|---------|---------------|
| Live Transcription | Web Speech API (SpeechRecognition) |
| Quality Recording | MediaRecorder API |
| File Upload | HTML5 File API, AudioContext |
| Audio Processing | Web Audio API (OfflineAudioContext) |
| Quality Transcription | Groq/OpenAI Whisper API |
| AI Chat | Groq LLM API, Gemini API |
| File Export | Blob API, URL.createObjectURL |
| Persistence | localStorage, sessionStorage |
| Audio Visualization | Canvas API, Web Audio AnalyserNode |
| UI Components | Vanilla JS, CSS Grid/Flexbox |
| Animations | CSS Keyframes, requestAnimationFrame |

---

## How to Run This Project

1. Simply open `index.html` in a modern browser (Chrome/Edge recommended)
2. No build step required - it's pure vanilla JS
3. Add your Groq API key (free) in the API Configuration panel
4. Start recording!

---

*This guide was generated to help explain how each feature was implemented.*

