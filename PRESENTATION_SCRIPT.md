# PRESENTATION SCRIPT - Verbatim Voice Transcriber

*Read this to your guide - each section is meant to be explained in about 30-60 seconds*

---

## OPENING

"So let me walk you through what I built. It's called Verbatim - a voice transcription web app. The whole thing is vanilla JavaScript, no frameworks, runs directly in the browser. Let me show you feature by feature."

---

## FEATURE 1: FEATURE DETECTION

**SAY:**
"I implemented an auto-detection system on app load that checks what the user's browser supports - things like Speech Recognition API, MediaRecorder, AudioContext, screen capture capabilities. It even detects the specific browser like Safari vs Chrome, and platform like iOS vs Desktop. Based on this, the app adapts - for example, Live mode won't show on Safari because Safari doesn't support Web Speech API. This makes the app robust across different environments."

---

## FEATURE 2: API CONFIGURATION

**SAY:**
"I built a key management system using localStorage. Users can input Groq keys - which is free - or OpenAI keys as fallback, and even Gemini keys for the assistant's file analysis. The system normalizes keys from multiple sources - the main input, a key vault - and handles provider switching transparently. There's also usage tracking for Gemini so users know when they're hitting rate limits."

---

## FEATURE 3: THREE MODES

**SAY:**
"I designed three distinct capture modes:

First, **Live Mode** - uses the browser's native Web Speech API for real-time dictation. Zero latency, free, works offline in some browsers.

Second, **Quality Mode** - this is where it gets interesting. I use MediaRecorder to capture raw audio, then process it through a full pipeline: decode, analyze for quality metrics like clipping and silence detection, normalize the volume using a dynamics compressor, resample to 16kHz which is what Whisper expects, chunk it intelligently at silence points to handle long files, then send to Groq's Whisper API. This gives much better accuracy.

Third, **File Mode** - users can drag and drop audio files. Same processing pipeline runs, but now we also check a local cache so if they transcribe the same file twice, it's instant."

---

## FEATURE 4: LIVE TRANSCRIPTION

**SAY:**
"For Live mode, I used the Web Speech API - specifically the SpeechRecognition interface. I set it to continuous mode with interim results so users see text appear as they speak, not just when they pause. I implemented auto-restart on the recognition service - if it drops, it reconnects automatically within 50ms so there's no manual intervention needed.

The key challenge was handling the final vs interim text differently. Interim shows in real-time, then when the API marks something as final, I commit it to the transcript. I also track the gap time between utterances to enable smart punctuation."

---

## FEATURE 5: QUALITY RECORDING

**SAY:**
"For Quality mode, I use the MediaRecorder API with mime-type fallback logic - it tries webm with opus first, then webm, then ogg. The audio captures in chunks every second for efficiency.

When recording stops, I trigger the full transcription pipeline. The cool part is the preprocessing: I use OfflineAudioContext to apply a high-pass filter at 80Hz to remove rumble, a dynamics compressor to even out volume, and then automatic gain normalization targeting 0.89 peak. This ensures consistent quality regardless of microphone or speaking volume."

---

## FEATURE 6: AUDIO PROCESSING PIPELINE

**SAY:**
"I built a comprehensive audio processing pipeline. First, analyzeAudio() checks for peak levels, RMS, clipping percentage, and detects silence ranges using a windowed approach. Then processAudioBuffer() applies the compression and normalization. Then resampleTo16k() converts to the sample rate Whisper requires. Then chunkWavBlob() splits long audio intelligently - I find silence points in the audio and split there to avoid cutting words mid-sentence. Each chunk gets overlap added to ensure nothing is lost at boundaries.

Finally, audioBufferToWav() converts everything to proper WAV format with the correct header structure for the API."

---

## FEATURE 7: SMART PUNCTUATION

**SAY:**
"One detail I added is smart punctuation. The browser API often returns text without capitalization or punctuation. I track the time gap between final utterances - if it's more than 2 seconds, I insert a period. If it's 0.7-2 seconds, I insert a comma. I also capitalize the first letter of each new segment. This makes the raw transcript look much more polished."

---

## FEATURE 8: SEGMENT MANAGEMENT

**SAY:**
"Instead of just plain text, I store everything as segments. Each segment has: timestamp, confidence score from the API, language detection, optional speaker label, and the actual text. This enables the timestamped view, the confidence coloring in the UI, and gives users granular control to edit or lock individual segments."

---

## FEATURE 9: MEMORY SYSTEM

**SAY:**
"I built a memory system that lets users import context about themselves - their name, projects, preferences, terminology, anything they want the AI to know. This gets injected into prompts as system context. I also implemented memory packs - separate memory sets for different projects or clients, stored in localStorage with create, switch, and delete functionality. This makes the AI output much more personalized."

---

## FEATURE 10: AI OUTPUT TOOLS

**SAY:**
"I integrated AI processing through Groq's chat API. The app has several AI actions: AI Clean fixes transcription errors, Summary generates summaries, Action Items extracts tasks, and there's a Prompt Builder for custom prompts. Each action uses a different system prompt optimized for that task. I also track output styles - default, concise, executive, technical, founder, client-ready, meeting notes - each with different instructions to the AI about tone and format."

---

## FEATURE 11: VERBA ASSISTANT

**SAY:**
"I built a full chat interface with the Verba Assistant. It has smart model routing - if you upload files like images or PDFs, it switches to Gemini. For long outputs, it uses Llama 3.3 70B. For quick questions, it uses the fast 8B model. This optimizes both quality and speed while managing API costs.

The assistant can also access the current transcript as context, so you can ask it questions about what you've transcribed. I implemented full conversation history, multi-file attachments, and even voice input using speech recognition."

---

## FEATURE 12: THREE-COLUMN WORKSPACE

**SAY:**
"I designed a modern three-column layout using CSS Grid. The left rail has setup guides and AI tools, the center is the main workspace for recording and editing, and the right rail shows session stats and utilities. I used CSS custom properties throughout for theming, and there's a professional light/dark aesthetic with glass-morphism effects using backdrop-filter.

The layout is fully responsive - it collapses to a single column on tablet and mobile, with sticky recording controls and adjusted touch targets."

---

## FEATURE 13: AUDIO VISUALIZATION

**SAY:**
"One visual feature I'm particularly happy with is the voice orb. It's rendered on HTML5 Canvas using the Web Audio API's AnalyserNode. The orb reacts to microphone input in real-time - the wave inside rises and falls with volume, there's a pulsing animation, and a liquid effect. I used radial gradients, clip-paths, and frame-by-frame animation at 60fps using requestAnimationFrame. It gives users clear visual feedback that recording is working."

---

## FEATURE 14: EXPORT SYSTEM

**SAY:**
"I implemented multiple export formats so users can use transcripts anywhere: Plain Text for documents, SRT and VTT for subtitles with proper timestamp formatting, JSON for developers or data processing, Markdown for note-taking apps, and CSV for spreadsheet analysis. Each format is generated on-demand using JavaScript's Blob API and downloaded via URL.createObjectURL."

---

## FEATURE 15: KEYBOARD SHORTCUTS

**SAY:**
"I added keyboard shortcuts for power users: Space toggles recording, Ctrl+C copies the transcript, Ctrl+D opens the download menu, Ctrl+O switches to file mode, Ctrl+Enter transcribes an uploaded file, and Ctrl+Z can restore from undo. The app intelligently detects when you're in an input field to avoid triggering shortcuts at the wrong time."

---

## FEATURE 16: TOAST NOTIFICATIONS

**SAY:**
"I built a toast notification system for feedback. These are non-blocking popups at the bottom of the screen - they auto-dismiss after 2-4 seconds depending on type. Different styles for success, error, warning, and info. They're rendered as DOM elements with CSS animations for smooth entry and exit."

---

## FEATURE 17: CACHING & PERSISTENCE

**SAY:**
"I implemented smart caching to avoid redundant API calls. Files are hashed using ArrayBuffer hashing, and transcriptions are cached in localStorage by this hash plus the processing parameters. So if a user uploads the same file twice with same settings, it's instant - pulled from cache.

For workspace persistence, the app auto-saves transcript, AI output, settings, memory, assistant conversations - everything - to localStorage and sessionStorage as appropriate. There's even an undo feature that saves the last transcript state."

---

## CLOSING

**SAY:**
"So that's the full feature set. The whole thing is about 6,700 lines of vanilla JavaScript, organized into logical sections with state management, UI rendering, API integration, audio processing, and persistence. It runs entirely client-side once the page loads, no backend required. The main cost is the Groq API calls which are very affordable even at scale."

---

*END OF SCRIPT*

