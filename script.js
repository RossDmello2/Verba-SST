// â”€â”€â”€ Feature Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const mainContent = document.getElementById('mainContent');

        function detectRuntimeCapabilities() {
            const ua = navigator.userAgent || '';
            const vendor = navigator.vendor || '';
            const platform = navigator.platform || '';
            const maxTouch = Number(navigator.maxTouchPoints || 0);
            const isIOS = /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
            const isAndroid = /Android/i.test(ua);
            const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|SamsungBrowser|Firefox|FxiOS/i.test(ua) && /Apple/i.test(vendor || '');
            const isEdge = /Edg/i.test(ua);
            const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge;
            const isFirefox = /Firefox|FxiOS/i.test(ua);
            const coarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            const isMobile = isIOS || isAndroid || coarsePointer;
            const hasSpeechRecognition = !!SR;
            const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
            const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
            const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext || window.OfflineAudioContext);
            const hasGetUserMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
            const supportsMicQuality = hasMediaRecorder && hasGetUserMedia;
            const supportsTabOrScreenCapture = hasDisplayMedia && hasMediaRecorder && !isMobile && !isIOS && !isSafari;
            let browserFamily = 'Unknown';
            if (isSafari) browserFamily = 'Safari';
            else if (isEdge) browserFamily = 'Edge';
            else if (isChrome) browserFamily = 'Chrome';
            else if (isFirefox) browserFamily = 'Firefox';
            let platformFamily = 'Desktop';
            if (isIOS) platformFamily = 'iOS';
            else if (isAndroid) platformFamily = 'Android';
            else if (/Win/i.test(platform)) platformFamily = 'Windows';
            else if (/Mac/i.test(platform)) platformFamily = 'macOS';
            else if (/Linux/i.test(platform)) platformFamily = 'Linux';
            return {
                browserFamily,
                platformFamily,
                isSafari,
                isIOS,
                isMobile,
                isSecureContext: !!window.isSecureContext,
                hasSpeechRecognition,
                hasMediaRecorder,
                hasDisplayMedia,
                hasAudioContext,
                hasGetUserMedia,
                supportsMicQuality,
                supportsTabOrScreenCapture,
                canBoot: hasSpeechRecognition || supportsMicQuality || hasAudioContext
            };
        }

        const runtimeCapabilities = detectRuntimeCapabilities();

        if (!runtimeCapabilities.canBoot) {
            mainContent.innerHTML = `
    <div class="not-supported">
      <div class="ns-icon">MIC</div>
      <h2>Browser support is too limited</h2>
      <p>This browser does not expose the speech, recording, or audio APIs Verba needs.</p>
      <p>Use Chrome or Edge for full meeting capture. Safari can still work for file transcription and some microphone flows when opened on HTTPS or localhost.</p>
    </div>`;
        } else {
            buildApp();
        }

        function buildApp() {
            mainContent.innerHTML = `
    <!-- API Config Panel -->
    <div class="api-panel" id="apiPanel">
      <div class="api-header" id="apiHeader">
        <span class="api-header-title">API Configuration</span>
        <span class="api-status-label" id="apiStatusLabel">Not configured</span>
        <span class="api-status-dot" id="apiStatusDot"></span>
        <svg class="api-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="api-body">
        <div class="api-row">
          <span class="api-label">Provider</span>
          <select id="apiProvider" class="api-select">
            <option value="groq">Groq - whisper-large-v3-turbo (free)</option>
            <option value="openai">OpenAI - whisper-1</option>
          </select>
        </div>
        <div class="api-row">
          <span class="api-label">API Key</span>
          <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Paste your API key here..." autocomplete="off" spellcheck="false">
          <button class="api-btn-sm" id="apiKeyToggle" title="Show API key">Show</button>
          <button class="api-btn-sm save-btn" id="apiKeySave">Save</button>
          <button class="api-btn-sm" id="apiKeyTest">Test</button>
        </div>
        <div class="api-row">
          <span class="api-label">Gemini key</span>
          <input type="password" class="api-key-input" id="geminiKeyInput" placeholder="Optional for assistant image and PDF analysis" autocomplete="off" spellcheck="false">
          <button class="api-btn-sm" id="geminiKeyToggle" title="Show Gemini API key">Show</button>
          <button class="api-btn-sm save-btn" id="geminiKeySave">Save</button>
          <button class="api-btn-sm" id="geminiKeyTest">Test</button>
        </div>
        <div class="api-row" style="align-items:flex-start;">
          <span class="api-label">Gemini vault</span>
          <textarea class="api-key-input" id="geminiKeyVault" rows="3" placeholder="Optional Gemini keys - one per line - used only for assistant image and PDF analysis"></textarea>
          <button class="api-btn-sm save-btn" id="geminiVaultSave">Save vault</button>
        </div>
        <div class="api-row api-model-row">
          <span class="api-label">Gemini model</span>
          <select id="geminiModelSelect" class="api-inline-select api-select" aria-label="Gemini analysis model">
            <option value="">Loading Gemini models...</option>
          </select>
          <div class="api-info-wrap">
            <button class="api-info-btn" type="button" aria-label="Gemini free-tier model info" title="Gemini free-tier model info">i</button>
            <div class="api-info-popover" role="note" aria-label="Gemini free-tier model guide">
              <div class="api-info-title">Gemini Model Guide</div>
              <div class="api-info-sub">Free-key limits plus paid-only note for image/PDF analysis models</div>
              <table class="api-info-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>RPM</th>
                    <th>RPD</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gemini 2.5 Pro</td>
                    <td>5</td>
                    <td>100</td>
                    <td>Paid Gemini key only</td>
                  </tr>
                  <tr>
                    <td>Gemini 2.5 Flash</td>
                    <td>10</td>
                    <td>250</td>
                    <td>General use, chatbots</td>
                  </tr>
                  <tr>
                    <td>Gemini 2.5 Flash-Lite</td>
                    <td>15</td>
                    <td>1,000</td>
                    <td>Bulk tasks, simple Q&amp;A</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="api-row" style="align-items:flex-start;">
          <span class="api-label">Gemini usage</span>
          <div class="gemini-usage-card" id="geminiUsageCard">
            <div class="gemini-usage-head">
              <div class="gemini-usage-title" id="geminiUsageTitle">App-tracked Gemini usage</div>
              <button class="api-btn-sm" id="geminiUsageReset" type="button">Reset</button>
            </div>
            <div class="gemini-usage-stat">
              <span>Minute window</span>
              <span id="geminiUsageMinuteText">0 / 15 used</span>
            </div>
            <div class="gemini-usage-bar"><span id="geminiUsageMinuteBar"></span></div>
            <div class="gemini-usage-stat">
              <span>Daily window</span>
              <span id="geminiUsageDayText">0 / 1000 used</span>
            </div>
            <div class="gemini-usage-bar gemini-usage-bar-day"><span id="geminiUsageDayBar"></span></div>
            <div class="gemini-usage-note" id="geminiUsageNote">Tracked from this app only. External Gemini usage is not included.</div>
          </div>
        </div>
        <div class="api-row">
          <span class="api-label">Audio model</span>
          <input type="text" class="api-key-input" id="audioModelInput" placeholder="Speech model. Groq translation auto-switches to whisper-large-v3">
        </div>
        <div class="api-row api-model-row">
          <span class="api-label">Chat model</span>
          <input type="text" class="api-key-input" id="chatModelInput" list="chatModelSuggestions" placeholder="Groq recommendation: openai/gpt-oss-120b">
          <select id="chatModelSelect" class="api-inline-select api-select">
            <option value="">Loading models...</option>
          </select>
          <datalist id="chatModelSuggestions"></datalist>
        </div>
        <div class="api-row" style="align-items:flex-start;">
          <span class="api-label">Key vault</span>
          <textarea class="api-key-input" id="apiKeyVault" rows="4" placeholder="Optional extra API keys - one per line - stored locally only"></textarea>
          <button class="api-btn-sm save-btn" id="apiVaultSave">Save vault</button>
        </div>
        <div class="api-note">
          Stored only in your browser's localStorage. Never hardcode real keys inside the HTML when sharing this file.<br>
          Get a free Groq key: <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> |
          OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> |
          Gemini: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a><br>
          <span id="apiVaultMeta">No extra keys saved</span><br>
          <span id="geminiVaultMeta">No keys stored for gemini</span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="mode-toggle">
        <button class="mode-btn active" id="modeRealtime" data-mode="realtime"><span class="mode-dot"></span> Live</button>
        <button class="mode-btn" id="modeQuality" data-mode="quality"><span class="mode-dot"></span> Quality</button>
        <button class="mode-btn" id="modeFile" data-mode="file"><span class="mode-dot"></span> File</button>
      </div>
      <div class="lang-wrap">
        <span class="lang-label">Lang</span>
        <select id="langSelect">
          <option value="auto">Auto-detect</option>
          <optgroup label="English">
            <option value="en-IN" data-wlang="en">English - India</option>
            <option value="en-US" data-wlang="en">English - US</option>
            <option value="en-GB" data-wlang="en">English - UK</option>
            <option value="en-AU" data-wlang="en">English - AU</option>
          </optgroup>
          <optgroup label="Indian Languages">
            <option value="hi-IN" data-wlang="hi">Hindi</option>
            <option value="ta-IN" data-wlang="ta">Tamil</option>
            <option value="te-IN" data-wlang="te">Telugu</option>
            <option value="mr-IN" data-wlang="mr">Marathi</option>
            <option value="bn-IN" data-wlang="bn">Bengali</option>
            <option value="gu-IN" data-wlang="gu">Gujarati</option>
            <option value="kn-IN" data-wlang="kn">Kannada</option>
            <option value="ml-IN" data-wlang="ml">Malayalam</option>
            <option value="pa-IN" data-wlang="pa">Punjabi</option>
            <option value="ur-PK" data-wlang="ur">Urdu</option>
          </optgroup>
          <optgroup label="Other Languages">
            <option value="es-ES" data-wlang="es">Spanish</option>
            <option value="fr-FR" data-wlang="fr">French</option>
            <option value="de-DE" data-wlang="de">German</option>
            <option value="ja-JP" data-wlang="ja">Japanese</option>
            <option value="zh-CN" data-wlang="zh">Mandarin</option>
            <option value="ar-SA" data-wlang="ar">Arabic</option>
            <option value="pt-BR" data-wlang="pt">Portuguese</option>
            <option value="ko-KR" data-wlang="ko">Korean</option>
            <option value="ru-RU" data-wlang="ru">Russian</option>
          </optgroup>
        </select>
      </div>
      <div class="spacer"></div>
      <button class="btn-toggle" id="punctBtn" title="Smart punctuation"><span class="toggle-dot"></span> Punct</button>
      <button class="btn-toggle" id="autoCopyBtn" title="Auto-copy after silence"><span class="toggle-dot"></span> Auto-Copy</button>
    </div>

    <div class="workspace-banner">
      <div class="field">
        <label for="presetSelect">Preset</label>
        <select id="presetSelect" class="studio-select">
          <option value="dictation">Dictation</option>
          <option value="meeting">Meeting</option>
          <option value="subtitle">Subtitle</option>
          <option value="interview">Interview</option>
          <option value="voice-notes">Voice Notes</option>
          <option value="prompt">Prompt Builder</option>
          <option value="build">Build Spec</option>
          <option value="debug">Debug Report</option>
          <option value="docs">Docs Notes</option>
        </select>
      </div>
      <div class="field">
        <label for="speakerModeToggle">Speaker labels</label>
        <button class="btn-toggle" id="speakerModeToggle" title="Render transcript with speaker labels"><span class="toggle-dot"></span> Speakers</button>
      </div>
      <div class="field">
        <label for="autosaveToggle">Workspace autosave</label>
        <button class="btn-toggle" id="autosaveToggle" title="Autosave workspace in browser"><span class="toggle-dot"></span> Autosave</button>
      </div>
      <div class="field">
        <label>Quick tools</label>
        <div class="pill-row">
          <button class="pill-btn preset-pill" id="rebuildTranscriptBtn">Rebuild</button>
          <button class="pill-btn preset-pill" id="diagToggleBtn">Diagnostics</button>
        </div>
      </div>
    </div>
    <div class="workspace-shell">
      <aside class="workspace-left-rail">
        <div class="utility-card utility-card-capture" id="captureSupportCard">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Support</span>
            <div class="utility-card-title">Capture setup</div>
          </div>
          <div class="capture-toolbar" id="captureToolbar">
            <div class="capture-source-wrap">
              <span class="capture-label">Capture source</span>
              <select id="captureSourceSelect" class="capture-select" aria-label="Capture source">
                <option value="mic">Microphone</option>
                <option value="browser-tab">Browser tab audio</option>
                <option value="screen-audio">Screen + system audio</option>
                <option value="external-help">External app / phone help</option>
              </select>
            </div>
            <div class="capture-capability-note" id="captureCapabilityNote">Microphone capture ready.</div>
            <button class="pill-btn preset-pill capture-help-toggle" id="captureHelpToggle" type="button" aria-expanded="false" aria-controls="captureHelpPanel">
              <span>Capture setup guide</span>
              <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div class="capture-help-panel" id="captureHelpPanel" hidden>
            <div class="capture-help-head">
              <div class="capture-help-title">Capture setup guide</div>
              <div class="capture-help-tip" id="captureHelpTip">Choose the source that matches your meeting or device.</div>
            </div>
            <div class="capture-help-copy" id="captureHelpCopy"></div>
          </div>
        </div>

        <div class="utility-card utility-card-shortcuts">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Keyboard</span>
            <div class="utility-card-title">Quick access</div>
          </div>
          <button class="pill-btn preset-pill capture-help-toggle shortcuts-toggle" id="shortcutsToggle" type="button" aria-expanded="false" aria-controls="shortcutsPanel">
            <span>Keyboard quick access</span>
            <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="shortcuts-panel" id="shortcutsPanel" hidden>
            <div class="shortcuts-bar">
              <div class="shortcut"><kbd>Space</kbd> Start / Stop</div>
              <div class="shortcut"><kbd>Ctrl+C</kbd> Copy text</div>
              <div class="shortcut"><kbd>Ctrl+D</kbd> Download</div>
              <div class="shortcut"><kbd>Ctrl+O</kbd> Open file</div>
              <div class="shortcut"><kbd>Ctrl+U</kbd> Assistant file</div>
              <div class="shortcut"><kbd>Ctrl+Enter</kbd> Transcribe file</div>
              <div class="shortcut"><kbd>Ctrl+Z</kbd> Recover</div>
            </div>
          </div>
        </div>

        <div class="tool-panel utility-card-ai">
          <div class="tool-header">
            <div>
              <div class="tool-title">AI Output</div>
              <div class="tool-sub">Groq-first summaries, action items, and prompt packs using your configured provider and chat model.</div>
            </div>
            <div class="inline-actions">
              <button class="micro-btn" id="copyAiOutputBtn">Copy</button>
              <button class="micro-btn" id="clearAiOutputBtn">Clear</button>
            </div>
          </div>
          <button class="pill-btn preset-pill capture-help-toggle ai-output-toggle" id="aiOutputToggle" type="button" aria-expanded="true" aria-controls="aiOutputPanel">
            <span>AI output tools</span>
            <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="ai-output-panel" id="aiOutputPanel">
            <div class="field full">
              <label for="outputStyleSelect">Output style</label>
              <select id="outputStyleSelect" class="studio-select">
                <option value="default">Default</option>
                <option value="concise">Concise</option>
                <option value="executive">Executive</option>
                <option value="technical">Technical</option>
                <option value="founder">Founder</option>
                <option value="client-ready">Client-ready</option>
                <option value="meeting-notes">Meeting Notes</option>
              </select>
              <div class="mini-note" id="aiContextNote">AI Output will use the active memory pack and selected style automatically.</div>
            </div>
            <div class="inline-actions" style="margin-bottom:10px;">
              <button class="pill-btn" id="cleanAiBtn">AI Clean</button>
              <button class="pill-btn" id="summaryBtn">Summary</button>
              <button class="pill-btn" id="actionItemsBtn">Action Items</button>
              <button class="pill-btn" id="promptPackBtn">Prompt Pack</button>
            </div>
            <div class="field full">
              <label for="askTranscriptInput">Ask This Transcript</label>
              <textarea id="askTranscriptInput" class="studio-textarea ask-transcript-input" placeholder="Ask a direct question about this transcript. Example: What are the blockers, what should I do next, or convert this into a client-ready brief?"></textarea>
              <div class="inline-actions">
                <button class="pill-btn" id="askTranscriptBtn">Ask transcript</button>
              </div>
            </div>
            <div class="output-stack">
              <textarea id="aiOutput" class="ai-output" placeholder="AI notes, cleaned transcript, summaries, or paste-ready prompts will appear here."></textarea>
              <div class="mini-note">Recommended on Groq: openai/gpt-oss-120b. Use openai/gpt-oss-20b when you want a faster fallback.</div>
            </div>
          </div>
        </div>
      </aside>

      <div class="workspace-main">
        <!-- Upload Panel -->
        <div class="upload-panel" id="uploadPanel">
          <div class="upload-header">
            <span class="upload-title">Audio File</span>
          </div>
          <div class="upload-body">
            <div class="drop-zone" id="dropZone">
              <input type="file" id="fileInput" accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm,.mp4,.aac">
              <div class="drop-zone-icon">UP</div>
              <div class="drop-zone-text">Drop audio file here or click to browse</div>
              <div class="drop-zone-sub">MP3 | WAV | M4A | FLAC | OGG | WebM - Max 200MB - Any language</div>
            </div>
            <div class="file-info" id="fileInfo">
              <div class="file-info-row">
                <span class="file-name" id="fileName"></span>
                <div class="file-meta" id="fileMeta"></div>
                <button class="file-remove-btn" id="fileRemoveBtn">Remove</button>
              </div>
              <audio class="file-audio-player" id="fileAudioPlayer" controls></audio>
              <div class="file-options">
                <label class="file-option-label"><input type="checkbox" id="optNormalize" checked> Normalize volume</label>
                <label class="file-option-label"><input type="checkbox" id="optTranslate"> Translate to English</label>
                <label class="file-option-label"><input type="checkbox" id="optUseCache" checked> Use transcript cache</label>
              </div>
              <div class="audio-analysis" id="audioAnalysis"></div>
              <button class="transcribe-btn" id="transcribeBtn" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Transcribe
              </button>
              <div class="progress-wrap" id="progressWrap">
                <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                <div class="progress-label">
                  <span id="progressLabel">Preparing...</span>
                  <button class="progress-cancel" id="progressCancel">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recording Panel -->
        <div class="rec-panel" id="recPanel">
          <div class="rec-hero">
            <div class="rec-orb-stage" id="orbTrigger" role="button" tabindex="0" aria-label="Toggle recording from voice orb" aria-pressed="false">
              <div class="waveform-wrap">
                <canvas id="waveCanvas"></canvas>
                <div class="orb-runtime">
                  <div class="orb-status-main" id="orbStatusMain">Tap to record</div>
                  <div class="orb-timer-display" id="orbTimerDisplay">00:00</div>
                </div>
                <div class="waveform-overlay" id="waveOverlay"></div>
              </div>
              <div class="status-main sr-only-live" id="statusMain">Ready to record</div>
              <div class="status-sub sr-only-live" id="statusSub">Click orb or press Space</div>
              <div class="timer-display sr-only-live" id="timerDisplay">00:00</div>
            </div>
          </div>
          <div class="interim-box">
            <div class="live-dot"></div>
            <div id="interimText" class="idle-hint">Interim transcription appears here as you speak...</div>
          </div>
          <div class="autocopy-bar" id="autoCopyBar"><div class="autocopy-fill" id="autoCopyFill"></div></div>
        </div>

        <!-- Transcript Panel -->
        <div class="transcript-panel">
          <div class="tp-header">
            <span class="tp-title">Transcript</span>
          </div>
          <textarea id="transcript" placeholder="Your verbatim transcription will appear here.&#10;You can edit this text directly." spellcheck="true"></textarea>
          <div class="segments-view" id="segmentsView"></div>
        </div>

        <div class="studio-grid studio-grid-single">
          <div class="tool-panel">
            <div class="tool-header">
              <div>
                <div class="tool-title">Imported Memory</div>
                <div class="tool-sub">Paste your exported memory once so AI Output and Verba Assistant can generate more accurate summaries, action items, prompt packs, and answers.</div>
              </div>
              <div class="workspace-meta">
                <span class="workspace-chip" id="memoryStatusChip">No memory loaded</span>
                <span class="workspace-chip" id="workspaceStatus">Workspace idle</span>
                <span class="workspace-chip" id="cacheStatus">Cache idle</span>
              </div>
            </div>
            <div class="memory-stack">
              <div class="field full">
                <label for="memoryPackSelect">Project memory pack</label>
                <div class="tool-grid">
                  <div class="field">
                    <select id="memoryPackSelect" class="studio-select" aria-label="Project memory pack"></select>
                  </div>
                  <div class="field">
                    <input type="text" id="memoryPackNameInput" class="studio-input" placeholder="New pack name">
                  </div>
                </div>
                <div class="inline-actions">
                  <button class="pill-btn" id="createMemoryPackBtn">Create pack</button>
                  <button class="pill-btn" id="deleteMemoryPackBtn">Delete pack</button>
                </div>
                <div class="mini-note" id="memoryPackMeta">Use separate packs for workstreams like Client A, Startup, Personal, or Research.</div>
              </div>
              <div class="field full">
                <label for="memoryPromptExport">Import memory prompt</label>
                <div class="mini-note">Copy this prompt into your other AI provider, export your memory, then paste the result below.</div>
                <textarea id="memoryPromptExport" class="studio-textarea memory-prompt-box" readonly spellcheck="false"></textarea>
                <div class="inline-actions">
                  <button class="pill-btn" id="copyMemoryPromptBtn">Copy prompt</button>
                </div>
              </div>
              <div class="field full">
                <label for="memoryInput">Imported memory</label>
                <textarea id="memoryInput" class="studio-textarea memory-input" placeholder="Paste your exported memory here. The app will use it for AI Output and Verba Assistant."></textarea>
                <div class="mini-note" id="memoryMeta">No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.</div>
                <div class="inline-actions">
                  <button class="pill-btn" id="importMemoryBtn">Import memory</button>
                  <button class="pill-btn" id="clearMemoryBtn">Clear memory</button>
                </div>
              </div>
              <div class="field full">
                <div class="mini-note">Imported memory is treated as long-term user context. Transcript text remains the source of current facts, while memory supplies preferences, projects, terminology, and working style.</div>
              </div>
              <button class="pill-btn preset-pill capture-help-toggle memory-tools-toggle" id="memoryToolsToggle" type="button" aria-expanded="false" aria-controls="memoryToolsPanel">
                <span>Advanced transcript tools</span>
                <svg class="capture-help-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="memory-tools-panel" id="memoryToolsPanel" hidden>
                <div class="field full">
                  <label for="glossaryInput">Terminology / local replacements</label>
                  <textarea id="glossaryInput" class="studio-textarea" placeholder="One rule per line - examples:
hpcl => HPCL
n8n => n8n
qdrant => Qdrant"></textarea>
                  <div class="mini-note">Applied locally after transcription and whenever you click Apply Glossary.</div>
                </div>
                <div class="field full">
                  <div class="inline-actions">
                    <button class="pill-btn" id="applyGlossaryBtn">Apply glossary</button>
                    <button class="pill-btn" id="cleanLocalBtn">Clean locally</button>
                    <button class="pill-btn" id="redactBtn">Redact PII</button>
                    <button class="pill-btn" id="saveWorkspaceBtn">Save workspace</button>
                    <button class="pill-btn" id="exportWorkspaceBtn">Export workspace</button>
                    <button class="pill-btn" id="importWorkspaceBtn">Import workspace</button>
                    <button class="pill-btn" id="clearCacheBtn">Clear cache</button>
                  </div>
                  <input class="import-input" type="file" id="workspaceFileInput" accept=".json,application/json">
                </div>
                <div class="field full">
                  <div class="mini-note warning-note">Do not paste real API keys into the transcript, imported memory, or exported workspace if you plan to share the file.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="diagnostics-panel" id="diagnosticsPanel">
          <div class="tool-header">
            <div>
              <div class="tool-title">Diagnostics</div>
              <div class="tool-sub">Provider pressure, retries, cache usage, chunk counts, and current workspace metadata.</div>
            </div>
          </div>
          <div class="diag-grid" id="diagGrid"></div>
          <textarea id="diagLog" class="diag-log" readonly placeholder="Diagnostics log will appear here."></textarea>
        </div>

        <div class="undo-indicator" id="undoIndicator" style="display:none;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          Last text restorable - press <kbd>Ctrl+Z</kbd> to recover
        </div>
      </div>

      <aside class="workspace-right-rail">
        <div class="utility-card session-summary-card">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Runtime</span>
            <div class="utility-card-title">Session summary</div>
          </div>
          <div class="summary-pill-row">
            <div class="stat-pill" id="wordPill">0 words</div>
            <div class="stat-pill" id="charPill">0 chars</div>
          </div>
          <div class="summary-meta-grid">
            <div class="summary-meta-block">
              <span class="summary-label">Detected language</span>
              <span class="detected-lang-badge" id="detectedLangBadge" style="display:none"></span>
            </div>
            <div class="summary-meta-block">
              <span class="summary-label">Segments</span>
              <span class="summary-value" id="segCount">0 segments</span>
            </div>
            <div class="summary-meta-block">
              <span class="summary-label">Duration</span>
              <span class="summary-value" id="durStat">0:00 duration</span>
            </div>
          </div>
        </div>

        <div class="utility-card utility-card-actions">
          <div class="utility-card-head">
            <span class="utility-card-kicker">Utilities</span>
            <div class="utility-card-title">Transcript tools</div>
          </div>
          <div class="action-bar">
            <div class="view-toggle">
              <button class="view-btn active" id="btnRaw" data-view="raw">Plain</button>
              <button class="view-btn" id="btnSeg" data-view="segments">Timestamped</button>
            </div>
            <button class="btn btn-history" id="historyBtn" title="Copy history">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </button>
            <div class="download-wrap">
              <button class="btn btn-download" id="downloadBtn" title="Download transcript">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              <div class="download-dropdown" id="downloadDropdown">
                <button class="download-option" data-format="txt">Plain Text (.txt)</button>
                <button class="download-option" data-format="srt">Subtitles (.srt)</button>
                <button class="download-option" data-format="vtt">WebVTT (.vtt)</button>
                <button class="download-option" data-format="json">JSON (.json)</button>
                <button class="download-option" data-format="md">Markdown (.md)</button>
                <button class="download-option" data-format="csv">Segments CSV (.csv)</button>
                <button class="download-option" data-format="workspace">Workspace (.json)</button>
              </div>
            </div>
            <button class="btn btn-clear" id="clearBtn" title="Clear transcript">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Clear
            </button>
          </div>
        </div>

        <div class="history-panel" id="historyPanel">
          <div class="history-header">
            <span class="history-title">Copy History</span>
            <button class="history-clear-btn" id="historyClearBtn">Clear history</button>
          </div>
          <div class="history-list" id="historyList">
            <div class="history-empty">No history yet - copied text will appear here</div>
          </div>
        </div>
      </aside>
    </div>

    <div class="assistant-shell" id="assistantShell">
      <div class="assistant-panel" id="assistantPanel" hidden>
        <div class="assistant-header">
          <div class="assistant-title">
            <div class="assistant-mini-bot" aria-hidden="true"></div>
            <div class="assistant-heading">
              <div class="assistant-name">Verba Assistant</div>
              <div class="assistant-sub" id="assistantRuntimeMeta">General + workspace help - grounded in current Verba state</div>
            </div>
          </div>
          <div class="assistant-actions">
            <button class="assistant-icon-btn" id="assistantQuickNewBtn" title="New chat" aria-label="New chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantHistoryBtn" title="Conversation history" aria-label="Conversation history">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l3 3"></path></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantCopyLastBtn" title="Copy last assistant answer" aria-label="Copy last assistant answer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantClearBtn" title="Clear assistant thread" aria-label="Clear assistant thread">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantMinBtn" title="Minimize assistant" aria-label="Minimize assistant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantMaxBtn" title="Expand assistant" aria-label="Expand assistant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>
            <button class="assistant-icon-btn" id="assistantCloseBtn" title="Close assistant" aria-label="Close assistant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="assistant-history-panel" id="assistantHistoryPanel" hidden>
          <div class="assistant-history-top">
            <div class="assistant-history-title">Chats</div>
            <button class="assistant-history-new" id="assistantNewChatBtn" type="button">New chat</button>
          </div>
          <div class="assistant-history-list" id="assistantHistoryList"></div>
        </div>
        <div class="assistant-toolbar" id="assistantQuickPrompts">
          <button class="assistant-chip" data-prompt="How do Live, Quality, and File differ?">Modes</button>
          <button class="assistant-chip" data-prompt="How does translate-to-English work in this app?">Translate</button>
          <button class="assistant-chip" data-prompt="What does Auto-Copy do and when does it trigger?">Auto-Copy</button>
          <button class="assistant-chip" data-prompt="How do exports and workspace save work?">Export + Save</button>
        </div>
        <div class="assistant-empty" id="assistantEmpty">
          Ask about modes, language selection, provider setup, imported memory, exports, AI Output, presets, or the current runtime state.
        </div>
        <div class="assistant-messages" id="assistantMessages"></div>
        <div class="assistant-footer">
          <div class="assistant-input-wrap" id="assistantInputWrap">
            <textarea class="assistant-input" id="assistantInput" placeholder="Ask anything. Example: What does Quality mode do, or explain ML in simple terms."></textarea>
            <div class="assistant-attachment-preview" id="assistantAttachmentPreview" hidden>
              <div class="assistant-attachment-pill">
                <span class="assistant-attachment-kind" id="assistantAttachmentKind">Image</span>
                <span class="assistant-attachment-name" id="assistantAttachmentMeta">No file attached</span>
                <button class="assistant-attachment-close" id="assistantAttachmentRemove" type="button" aria-label="Remove attached file">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="assistant-footer-row">
              <div class="assistant-meta" id="assistantModelMeta">Groq-first assistant</div>
              <select id="assistantModelSelect" class="assistant-model-select" aria-label="Assistant model">
                <option value="">Loading models...</option>
              </select>
              <input type="file" id="assistantFileInput" hidden multiple accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json">
              <button class="assistant-attach-btn" id="assistantAttachBtn" type="button" aria-label="Add photos and files" title="Add photos and files">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.9-9.9a4 4 0 1 1 5.66 5.66l-10 10a2 2 0 0 1-2.83-2.83l8.84-8.84"></path>
                </svg>
                <span class="assistant-attach-label">Add photos & files</span>
              </button>
              <button class="assistant-mic-btn" id="assistantMicBtn" type="button" aria-label="Start voice input" title="Voice input (English)">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z"></path>
                  <path d="M19 11a7 7 0 0 1-14 0"></path>
                  <path d="M12 18v3"></path>
                  <path d="M8 21h8"></path>
                </svg>
              </button>
              <button class="assistant-send" id="assistantSend" aria-label="Send assistant message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
          <div class="assistant-note">Uses the assistant model you pick below for chat. Image, PDF, and file analysis can route through the Gemini model set in API Configuration.</div>
        </div>
      </div>
      <div class="assistant-dock">
        <button class="btn btn-copy" id="copyBtn" title="Copy all text">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        <button class="assistant-launcher" id="assistantLauncher" aria-label="Open Verba Assistant" title="Open Verba Assistant">
          <span class="assistant-unread" id="assistantUnread">0</span>
          <span class="assistant-launcher-label">Verba Assistant</span>
          <div class="robot-3d" aria-hidden="true">
            <div class="robot-antenna"><div class="robot-antenna-dot"></div><div class="robot-antenna-stem"></div></div>
            <div class="robot-head">
              <div class="robot-ear robot-ear-l"></div>
              <div class="robot-eye"><div class="robot-pupil"></div></div>
              <div class="robot-ear robot-ear-r"></div>
            </div>
            <div class="robot-neck"></div>
            <div class="robot-base">
              <div class="robot-base-shoulder"></div>
              <div class="robot-base-body"><div class="robot-led robot-led-1"></div><div class="robot-led robot-led-2"></div><div class="robot-led robot-led-3"></div></div>
            </div>
            <div class="robot-shadow"></div>
          </div>
        </button>
      </div>
    </div>
  `;

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // STATE
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            let state = {
                mode: 'realtime',
                captureSource: localStorage.getItem('vt_capture_source') || 'mic',
                captureHelpOpen: false,
                isRecording: false,
                segments: [],
                sessionStart: null,
                timerInterval: null,
                confirmedText: '',
                currentView: 'raw',
                smartPunctEnabled: false,
                autoCopyEnabled: false,
                lastEndTime: 0,
                noSpeechTimer: null,
                restartTimeout: null,
                autoCopyTimer: null,
                autoCopyCountdown: null,
                // Audio
                audioCtx: null,
                analyser: null,
                source: null,
                animFrame: null,
                micStream: null,
                captureSessionStream: null,
                visualLevel: 0,
                orbPhase: 0,
                orbSeed: Math.random() * Math.PI * 2,
                // Quality mode
                mediaRecorder: null,
                recordedChunks: [],
                recorderMimeType: '',
                // File mode
                uploadedFile: null,
                uploadedAudioBuffer: null,
                audioAnalysis: null,
                isProcessing: false,
                abortController: null,
                detectedLanguage: '',
                // API
                apiProvider: localStorage.getItem('vt_provider') || 'groq',
                apiKey: localStorage.getItem('vt_api_key') || '',
                apiConnected: false,
                audioModel: localStorage.getItem('vt_audio_model') || '',
                chatModel: localStorage.getItem('vt_chat_model') || '',
                providerKeys: (() => {
                    try { return normalizeProviderKeyStore(JSON.parse(localStorage.getItem('vt_provider_keys') || '{}')); }
                    catch (e) { return normalizeProviderKeyStore({}); }
                })(),
                preset: localStorage.getItem('vt_preset') || 'dictation',
                glossaryRaw: localStorage.getItem('vt_glossary') || 'hpcl => HPCL\nn8n => n8n\nqdrant => Qdrant',
                memoryRaw: localStorage.getItem('vt_memory_raw') || '',
                memoryImportedAt: localStorage.getItem('vt_memory_imported_at') || '',
                memoryPacks: (() => {
                    try {
                        const saved = JSON.parse(localStorage.getItem('vt_memory_packs') || '[]');
                        return Array.isArray(saved) ? saved : [];
                    } catch (e) {
                        return [];
                    }
                })(),
                activeMemoryPackId: localStorage.getItem('vt_memory_pack_active') || '',
                outputStyle: localStorage.getItem('vt_output_style') || 'default',
                geminiAnalysisModel: localStorage.getItem('vt_gemini_analysis_model') || '',
                geminiUsage: (() => {
                    try { return JSON.parse(localStorage.getItem('vt_gemini_usage') || '{}') || {}; }
                    catch (e) { return {}; }
                })(),
                autosaveEnabled: localStorage.getItem('vt_autosave') !== '0',
                speakerMode: localStorage.getItem('vt_speaker_mode') === '1',
                fileHash: '',
                cacheKey: '',
                audioDurationSec: 0,
                aiBusy: false,
                aiOutput: sessionStorage.getItem('vt_ai_output') || '',
                capabilities: runtimeCapabilities,
                diagnostics: (() => {
                    try { return JSON.parse(sessionStorage.getItem('vt_diag') || '{}'); }
                    catch (e) { return {}; }
                })(),
                assistant: {
                    isOpen: false,
                    minimized: true,
                    maximized: false,
                    showHistory: false,
                    isSending: false,
                    isListening: false,
                    unread: 0,
                    model: localStorage.getItem('vt_assistant_model') || '',
                    draft: sessionStorage.getItem('vt_assistant_draft') || '',
                    pendingAttachment: null,
                    currentConversationId: localStorage.getItem('vt_assistant_current') || '',
                    conversations: (() => {
                        try {
                            const saved = JSON.parse(localStorage.getItem('vt_assistant_conversations') || '[]');
                            return Array.isArray(saved) ? saved : [];
                        } catch (e) {
                            return [];
                        }
                    })(),
                    messages: (() => {
                        try {
                            const saved = JSON.parse(localStorage.getItem('vt_assistant_thread') || '[]');
                            return Array.isArray(saved) ? saved : [];
                        } catch (e) {
                            return [];
                        }
                    })(),
                    ui: (() => {
                        try {
                            return JSON.parse(localStorage.getItem('vt_assistant_ui') || '{}') || {};
                        } catch (e) {
                            return {};
                        }
                    })()
                },
                // History
                copyHistory: JSON.parse(sessionStorage.getItem('vt_history') || '[]'),
                undoBuffer: sessionStorage.getItem('vt_undo') || '',
                lastInterimText: '',
                manualStop: false,
                workspaceSaveTimer: null,
            };

            const ASSISTANT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
            const assistantAttachmentCache = new Map();
            let assistantAttachmentSeq = 0;
            const AUTO_COPY_DELAY = 4000;
            const MEMORY_IMPORT_PROMPT = [
                "Export all of my stored memories and any context you've learned about me from past conversations. Preserve my words verbatim where possible, especially for instructions and preferences.",
                "",
                "## Categories (output in this order):",
                "",
                "1. **Instructions**: Rules I've explicitly asked you to follow going forward — tone, format, style, \"always do X\", \"never do Y\", and corrections to your behavior. Only include rules from stored memories, not from conversations.",
                "",
                "2. **Identity**: Name, age, location, education, family, relationships, languages, and personal interests.",
                "",
                "3. **Career**: Current and past roles, companies, and general skill areas.",
                "",
                "4. **Projects**: Projects I meaningfully built or committed to. Ideally ONE entry per project. Include what it does, current status, and any key decisions. Use the project name or a short descriptor as the first words of the entry.",
                "",
                "5. **Preferences**: Opinions, tastes, and working-style preferences that apply broadly.",
                "",
                "## Format:",
                "",
                "Use section headers for each category. Within each category, list one entry per line, sorted by oldest date first. Format each line as:",
                "",
                "[YYYY-MM-DD] - Entry content here.",
                "",
                "If no date is known, use [unknown] instead.",
                "",
                "## Output:",
                "- Wrap the entire export in a single code block for easy copying.",
                "- After the code block, state whether this is the complete set or if more remain."
            ].join('\n');

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // ELEMENTS
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            const $ = id => document.getElementById(id);
            const micBtn = $('micBtn');
            const recPanel = $('recPanel');
            const micOuter = $('micOuter');
            const statusMain = $('statusMain');
            const statusSub = $('statusSub');
            const interimEl = $('interimText');
            const timerEl = $('timerDisplay');
            const orbStatusMain = $('orbStatusMain');
            const orbTimerDisplay = $('orbTimerDisplay');
            const transcript = $('transcript');
            const segView = $('segmentsView');
            const langSelect = $('langSelect');
            const modeRealtimeBtn = $('modeRealtime');
            const modeQualityBtn = $('modeQuality');
            const modeFileBtn = $('modeFile');
            const captureSupportCard = $('captureSupportCard');
            const captureToolbar = $('captureToolbar');
            const captureSourceSelect = $('captureSourceSelect');
            const captureCapabilityNote = $('captureCapabilityNote');
            const captureHelpToggle = $('captureHelpToggle');
            const captureHelpPanel = $('captureHelpPanel');
            const captureHelpTip = $('captureHelpTip');
            const captureHelpCopy = $('captureHelpCopy');
            const shortcutsToggle = $('shortcutsToggle');
            const shortcutsPanel = $('shortcutsPanel');
            const aiOutputToggle = $('aiOutputToggle');
            const aiOutputPanel = $('aiOutputPanel');
            const wordPill = $('wordPill');
            const charPill = $('charPill');
            const segCount = $('segCount');
            const durStat = $('durStat');
            const canvas = $('waveCanvas');
            const ctx2d = canvas.getContext('2d');
            const waveOverlay = $('waveOverlay');
            const orbTrigger = $('orbTrigger');
            const undoIndicator = $('undoIndicator');
            const autoCopyBtn = $('autoCopyBtn');
            const autoCopyBar = $('autoCopyBar');
            const autoCopyFill = $('autoCopyFill');
            const punctBtn = $('punctBtn');
            const historyBtn = $('historyBtn');
            const historyPanel = $('historyPanel');
            const historyList = $('historyList');
            const uploadPanel = $('uploadPanel');
            const dropZone = $('dropZone');
            const fileInput = $('fileInput');
            const fileInfo = $('fileInfo');
            const fileName = $('fileName');
            const fileMeta = $('fileMeta');
            const fileAudioPlayer = $('fileAudioPlayer');
            const transcribeBtn = $('transcribeBtn');
            const progressWrap = $('progressWrap');
            const progressFill = $('progressFill');
            const progressLabel = $('progressLabel');
            const progressCancel = $('progressCancel');
            const audioAnalysisEl = $('audioAnalysis');
            const detectedLangBadge = $('detectedLangBadge');
            const apiPanel = $('apiPanel');
            const apiHeader = $('apiHeader');
            const apiNote = apiPanel.querySelector('.api-note');
            const apiKeyInput = $('apiKeyInput');
            const apiKeyToggleBtn = $('apiKeyToggle');
            const geminiKeyInput = $('geminiKeyInput');
            const geminiKeyVault = $('geminiKeyVault');
            const geminiKeyToggleBtn = $('geminiKeyToggle');
            const geminiKeySaveBtn = $('geminiKeySave');
            const geminiKeyTestBtn = $('geminiKeyTest');
            const geminiVaultSaveBtn = $('geminiVaultSave');
            const geminiModelSelect = $('geminiModelSelect');
            const geminiUsageTitle = $('geminiUsageTitle');
            const geminiUsageMinuteText = $('geminiUsageMinuteText');
            const geminiUsageMinuteBar = $('geminiUsageMinuteBar');
            const geminiUsageDayText = $('geminiUsageDayText');
            const geminiUsageDayBar = $('geminiUsageDayBar');
            const geminiUsageNote = $('geminiUsageNote');
            const geminiUsageResetBtn = $('geminiUsageReset');
            const apiProvider = $('apiProvider');
            const apiStatusDot = $('apiStatusDot');
            const apiStatusLabel = $('apiStatusLabel');
            const downloadBtn = $('downloadBtn');
            const downloadDropdown = $('downloadDropdown');
            const presetSelect = $('presetSelect');
            const speakerModeToggle = $('speakerModeToggle');
            const autosaveToggle = $('autosaveToggle');
            const rebuildTranscriptBtn = $('rebuildTranscriptBtn');
            const diagnosticsPanel = $('diagnosticsPanel');
            const diagGrid = $('diagGrid');
            const diagLog = $('diagLog');
            const workspaceStatus = $('workspaceStatus');
            const cacheStatus = $('cacheStatus');
            const audioModelInput = $('audioModelInput');
            const chatModelInput = $('chatModelInput');
            const chatModelSelect = $('chatModelSelect');
            const chatModelSuggestions = $('chatModelSuggestions');
            const apiKeyVault = $('apiKeyVault');
            let apiVaultMeta = $('apiVaultMeta');
            let geminiVaultMeta = $('geminiVaultMeta');
            const memoryStatusChip = $('memoryStatusChip');
            const memoryPackSelect = $('memoryPackSelect');
            const memoryPackNameInput = $('memoryPackNameInput');
            const createMemoryPackBtn = $('createMemoryPackBtn');
            const deleteMemoryPackBtn = $('deleteMemoryPackBtn');
            const memoryPackMeta = $('memoryPackMeta');
            const memoryPromptExport = $('memoryPromptExport');
            const copyMemoryPromptBtn = $('copyMemoryPromptBtn');
            const memoryInput = $('memoryInput');
            const memoryMeta = $('memoryMeta');
            const importMemoryBtn = $('importMemoryBtn');
            const clearMemoryBtn = $('clearMemoryBtn');
            const memoryToolsToggle = $('memoryToolsToggle');
            const memoryToolsPanel = $('memoryToolsPanel');
            const glossaryInput = $('glossaryInput');
            const aiOutput = $('aiOutput');
            const outputStyleSelect = $('outputStyleSelect');
            const aiContextNote = $('aiContextNote');
            const askTranscriptInput = $('askTranscriptInput');
            const askTranscriptBtn = $('askTranscriptBtn');
            const workspaceFileInput = $('workspaceFileInput');
            const assistantShell = $('assistantShell');
            const assistantPanel = $('assistantPanel');
            const assistantLauncher = $('assistantLauncher');
            const assistantUnread = $('assistantUnread');
            const assistantMessages = $('assistantMessages');
            const assistantInput = $('assistantInput');
            const assistantInputWrap = $('assistantInputWrap');
            const assistantRuntimeMeta = $('assistantRuntimeMeta');
            const assistantModelMeta = $('assistantModelMeta');
            const assistantModelSelect = $('assistantModelSelect');
            const assistantFileInput = $('assistantFileInput');
            const assistantAttachBtn = $('assistantAttachBtn');
            const assistantAttachmentPreview = $('assistantAttachmentPreview');
            const assistantAttachmentKind = $('assistantAttachmentKind');
            const assistantAttachmentMeta = $('assistantAttachmentMeta');
            const assistantAttachmentRemove = $('assistantAttachmentRemove');
            const assistantMicBtn = $('assistantMicBtn');
            const assistantHistoryPanel = $('assistantHistoryPanel');
            const assistantHistoryList = $('assistantHistoryList');
            const assistantEmpty = $('assistantEmpty');
            const assistantSend = $('assistantSend');
            const assistantHistoryBtn = $('assistantHistoryBtn');
            const assistantQuickNewBtn = $('assistantQuickNewBtn');
            const assistantNewChatBtn = $('assistantNewChatBtn');
            const assistantCopyLastBtn = $('assistantCopyLastBtn');
            const assistantClearBtn = $('assistantClearBtn');
            const assistantMinBtn = $('assistantMinBtn');
            const assistantMaxBtn = $('assistantMaxBtn');
            const assistantCloseBtn = $('assistantCloseBtn');

            if (apiProvider?.options?.[0]) apiProvider.options[0].textContent = 'Groq - whisper-large-v3-turbo recommended';
            if (apiProvider?.options?.[1]) apiProvider.options[1].textContent = 'OpenAI - whisper-1 secondary fallback';
            audioModelInput.placeholder = 'Speech model. Groq translation auto-switches to whisper-large-v3';
            chatModelInput.placeholder = 'Groq recommendation: openai/gpt-oss-120b';
            populateChatModelControls();
            populateAssistantModelControls();
            populateGeminiModelControls();
            if (apiNote) {
                apiNote.innerHTML = `
      Stored only in your browser localStorage. Keep shared copies of this HTML free of real keys.<br>
      Groq-first defaults: transcription whisper-large-v3-turbo, translation whisper-large-v3, AI cleanup openai/gpt-oss-120b, fast fallback openai/gpt-oss-20b.<br>
      Groq keys: <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> |
      OpenAI fallback: <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> |
      Gemini assistant files: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a> |
      Free Gemini key: use Flash-Lite or Flash. Gemini 2.5 Pro is paid-key only.<br>
      <span id="apiVaultMeta">No extra keys saved</span><br>
      <span id="geminiVaultMeta">No keys stored for gemini</span>
    `;
                apiVaultMeta = $('apiVaultMeta');
                geminiVaultMeta = $('geminiVaultMeta');
            }

            function syncApiKeyToggleButton() {
                if (!apiKeyInput || !apiKeyToggleBtn) return;
                const showing = apiKeyInput.type === 'text';
                apiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show';
                apiKeyToggleBtn.title = showing ? 'Hide API key' : 'Show API key';
                apiKeyToggleBtn.setAttribute('aria-label', showing ? 'Hide API key' : 'Show API key');
            }

            function syncGeminiKeyToggleButton() {
                if (!geminiKeyInput || !geminiKeyToggleBtn) return;
                const showing = geminiKeyInput.type === 'text';
                geminiKeyToggleBtn.textContent = showing ? 'Hide' : 'Show';
                geminiKeyToggleBtn.title = showing ? 'Hide Gemini API key' : 'Show Gemini API key';
                geminiKeyToggleBtn.setAttribute('aria-label', showing ? 'Hide Gemini API key' : 'Show Gemini API key');
            }

            function isTouchPrimary() {
                return !!(runtimeCapabilities.isMobile || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
            }

            function getCaptureSourceLabel(source = state.captureSource) {
                return ({
                    mic: 'Microphone',
                    'browser-tab': 'Browser tab audio',
                    'screen-audio': 'Screen + system audio',
                    'external-help': 'External app / phone help'
                })[source] || 'Microphone';
            }

            function canUseLiveMode() {
                return !!runtimeCapabilities.hasSpeechRecognition;
            }

            function canUseQualityMode(source = state.captureSource) {
                if (source === 'mic') return !!runtimeCapabilities.supportsMicQuality;
                return !!runtimeCapabilities.supportsTabOrScreenCapture;
            }

            function getIdleHint() {
                return isTouchPrimary() ? 'Tap the orb to start' : 'Click orb or press Space';
            }

            function getActiveHint() {
                return isTouchPrimary() ? 'Speak now - tap the orb to stop' : 'Speak now - tap the orb or press Space to stop';
            }

            function getReadyStatusForCurrentState(mode = state.mode, source = state.captureSource) {
                if (source === 'external-help') return { main: 'Capture setup help', sub: 'Open Capture Help for Zoom, Meet, Safari, and phone guidance' };
                if (mode === 'quality' && source === 'browser-tab') return { main: 'Ready for tab audio', sub: 'Share the browser tab with audio, then stop to transcribe' };
                if (mode === 'quality' && source === 'screen-audio') return { main: 'Ready for system audio', sub: 'Share the screen or app audio, then stop to transcribe' };
                if (mode === 'quality') return { main: 'Ready to record', sub: 'Quality mode records first, then transcribes' };
                if (!canUseLiveMode()) return { main: 'Live mode limited here', sub: 'Use Quality or File mode in this browser' };
                return { main: 'Ready to record', sub: getIdleHint() };
            }

            function getActiveStatusForCurrentState(mode = state.mode, source = state.captureSource) {
                if (mode === 'quality' && source === 'browser-tab') return { main: 'Recording tab audio', sub: 'Keep the shared tab audio live until you stop' };
                if (mode === 'quality' && source === 'screen-audio') return { main: 'Recording system audio', sub: 'Keep the shared screen audio live until you stop' };
                if (mode === 'quality') return { main: 'Recording quality audio', sub: getActiveHint() };
                return { main: 'Recording', sub: getActiveHint() };
            }

            function stopTracks(stream) {
                try { stream?.getTracks?.().forEach(track => track.stop()); } catch (e) { }
            }

            function stopActiveCaptureTracks() {
                const primary = state.micStream;
                const session = state.captureSessionStream;
                if (primary && primary !== session) stopTracks(primary);
                stopTracks(session);
                state.micStream = null;
                state.captureSessionStream = null;
            }

            function pickRecorderMimeType() {
                if (typeof MediaRecorder === 'undefined') return '';
                const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'video/mp4', 'audio/ogg;codecs=opus'];
                for (const mimeType of candidates) {
                    try {
                        if (typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(mimeType)) return mimeType;
                    } catch (e) { }
                }
                return '';
            }

            function setCaptureHelpOpen(nextOpen) {
                state.captureHelpOpen = !!nextOpen;
                if (captureHelpPanel) captureHelpPanel.hidden = !state.captureHelpOpen;
                captureHelpToggle?.classList.toggle('active', state.captureHelpOpen);
                captureHelpToggle?.setAttribute('aria-expanded', state.captureHelpOpen ? 'true' : 'false');
            }

            function setShortcutsOpen(nextOpen) {
                const open = !!nextOpen;
                if (shortcutsPanel) shortcutsPanel.hidden = !open;
                shortcutsToggle?.classList.toggle('active', open);
                shortcutsToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
            }

            function setAiOutputOpen(nextOpen) {
                const open = !!nextOpen;
                if (aiOutputPanel) aiOutputPanel.hidden = !open;
                aiOutputToggle?.classList.toggle('active', open);
                aiOutputToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
            }

            function setMemoryToolsOpen(nextOpen) {
                const open = !!nextOpen;
                if (memoryToolsPanel) memoryToolsPanel.hidden = !open;
                memoryToolsToggle?.classList.toggle('active', open);
                memoryToolsToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
            }

            function normalizeMemoryPacks(packs = []) {
                const list = Array.isArray(packs) ? packs : [];
                const normalized = list.map((pack, index) => ({
                    id: String(pack?.id || `memory_${Date.now()}_${index}`),
                    name: String(pack?.name || `Pack ${index + 1}`).trim() || `Pack ${index + 1}`,
                    raw: normalizeImportedMemory(pack?.raw || ''),
                    importedAt: String(pack?.importedAt || '')
                }));
                if (!normalized.length) {
                    normalized.push({
                        id: 'memory_primary',
                        name: 'Primary',
                        raw: normalizeImportedMemory(state.memoryRaw || ''),
                        importedAt: String(state.memoryImportedAt || '')
                    });
                }
                return normalized;
            }

            function getActiveMemoryPack() {
                return (state.memoryPacks || []).find(pack => pack.id === state.activeMemoryPackId) || state.memoryPacks?.[0] || null;
            }

            function syncActiveMemoryPackState() {
                const active = getActiveMemoryPack();
                if (!active) {
                    state.memoryRaw = '';
                    state.memoryImportedAt = '';
                    return;
                }
                state.activeMemoryPackId = active.id;
                state.memoryRaw = normalizeImportedMemory(active.raw || '');
                state.memoryImportedAt = active.importedAt || '';
            }

            function persistMemoryPacksStore() {
                localStorage.setItem('vt_memory_packs', JSON.stringify(state.memoryPacks || []));
                localStorage.setItem('vt_memory_pack_active', state.activeMemoryPackId || '');
                localStorage.setItem('vt_memory_raw', state.memoryRaw || '');
                localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt || '');
                localStorage.setItem('vt_output_style', state.outputStyle || 'default');
            }

            function ensureMemoryPackStore() {
                state.memoryPacks = normalizeMemoryPacks(state.memoryPacks);
                if (!state.activeMemoryPackId || !state.memoryPacks.some(pack => pack.id === state.activeMemoryPackId)) {
                    state.activeMemoryPackId = state.memoryPacks[0]?.id || 'memory_primary';
                }
                syncActiveMemoryPackState();
                persistMemoryPacksStore();
            }

            function setActiveMemoryPack(packId) {
                if (!packId) return;
                if (!state.memoryPacks.some(pack => pack.id === packId)) return;
                state.activeMemoryPackId = packId;
                syncActiveMemoryPackState();
                persistMemoryPacksStore();
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
            }

            function createMemoryPack(name) {
                const cleanName = String(name || '').trim();
                if (!cleanName) {
                    toast('Enter a memory pack name first', 'warning');
                    return;
                }
                const id = `memory_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                state.memoryPacks.push({ id, name: cleanName, raw: '', importedAt: '' });
                state.activeMemoryPackId = id;
                syncActiveMemoryPackState();
                persistMemoryPacksStore();
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
                if (memoryPackNameInput) memoryPackNameInput.value = '';
                toast('Memory pack created', 'success');
            }

            function deleteActiveMemoryPack() {
                const active = getActiveMemoryPack();
                if (!active) return;
                if ((state.memoryPacks || []).length <= 1) {
                    active.raw = '';
                    active.importedAt = '';
                    syncActiveMemoryPackState();
                    persistMemoryPacksStore();
                    renderMemoryUi();
                    renderAssistantMessages();
                    scheduleWorkspaceSave();
                    toast('Primary memory pack cleared', 'info');
                    return;
                }
                state.memoryPacks = (state.memoryPacks || []).filter(pack => pack.id !== active.id);
                state.activeMemoryPackId = state.memoryPacks[0]?.id || '';
                syncActiveMemoryPackState();
                persistMemoryPacksStore();
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
                toast('Memory pack deleted', 'info');
            }

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

            function normalizeImportedMemory(text = '') {
                let value = String(text || '').replace(/\r\n/g, '\n').trim();
                value = value.replace(/^```[a-zA-Z0-9_-]*\s*/m, '').replace(/\s*```$/m, '').trim();
                return value;
            }

            function formatRelativeMemoryTime(iso = '') {
                if (!iso) return 'unknown time';
                const ts = Date.parse(iso);
                if (!Number.isFinite(ts)) return 'unknown time';
                const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
                if (diffMin < 1) return 'just now';
                if (diffMin < 60) return `${diffMin}m ago`;
                const diffHr = Math.floor(diffMin / 60);
                if (diffHr < 24) return `${diffHr}h ago`;
                const diffDay = Math.floor(diffHr / 24);
                return `${diffDay}d ago`;
            }

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

            function getTaskMemoryGuidance(taskName = '') {
                if (taskName === 'ai-clean') {
                    return 'Use memory lightly for terminology, proper nouns, and writing preferences. Do not inject unrelated facts.';
                }
                if (taskName === 'summary') {
                    return 'Use memory strongly to prioritize what matters most to this user, their projects, and their preferred output style.';
                }
                if (taskName === 'action-items') {
                    return 'Use memory to interpret project context and likely priorities, but only derive action items from what the transcript supports.';
                }
                if (String(taskName || '').startsWith('prompt-pack')) {
                    return 'Use memory strongly to tailor the prompt structure, requirements, and context to this user and their ongoing work.';
                }
                return 'Use memory when it improves relevance, but do not override transcript facts.';
            }

            function renderMemoryUi() {
                if (memoryPromptExport) memoryPromptExport.value = MEMORY_IMPORT_PROMPT;
                if (memoryInput && document.activeElement !== memoryInput) memoryInput.value = state.memoryRaw || '';
                const imported = normalizeImportedMemory(state.memoryRaw || '');
                if (memoryStatusChip) {
                    memoryStatusChip.textContent = imported
                        ? `Memory loaded • ${formatRelativeMemoryTime(state.memoryImportedAt)}`
                        : 'No memory loaded';
                }
                if (memoryMeta) {
                    memoryMeta.textContent = imported
                        ? `Imported ${imported.length.toLocaleString()} characters. AI Output and Verba Assistant will use this memory automatically. Last updated ${formatRelativeMemoryTime(state.memoryImportedAt)}.`
                        : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
                }
            }

            function persistMemoryStore() {
                localStorage.setItem('vt_memory_raw', state.memoryRaw || '');
                localStorage.setItem('vt_memory_imported_at', state.memoryImportedAt || '');
            }

            function setImportedMemory(rawText, { announce = true } = {}) {
                const normalized = normalizeImportedMemory(rawText);
                state.memoryRaw = normalized;
                state.memoryImportedAt = normalized ? new Date().toISOString() : '';
                persistMemoryStore();
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
                if (announce) {
                    toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info');
                }
            }

            function getCaptureCapabilitySummary() {
                if (!runtimeCapabilities.isSecureContext) return 'Recording permissions need HTTPS, localhost, or 127.0.0.1. file pages may fail.';
                if (state.captureSource === 'external-help') return 'Use the setup guide below for Zoom, Google Meet, Safari, and phone fallback workflows.';
                if (state.captureSource === 'browser-tab') {
                    return runtimeCapabilities.supportsTabOrScreenCapture
                        ? 'Best for Google Meet, browser media, or a single tab with shared audio on desktop Chrome or Edge.'
                        : 'Browser tab audio capture is limited here. Use microphone, File mode, or another desktop Chromium browser.';
                }
                if (state.captureSource === 'screen-audio') {
                    return runtimeCapabilities.supportsTabOrScreenCapture
                        ? 'Use this for Zoom, Teams, or desktop app audio when the browser exposes shared system audio.'
                        : 'System audio capture is limited here. Open Capture Help for Safari, iPhone, iPad, and external app fallback paths.';
                }
                if (!runtimeCapabilities.hasSpeechRecognition && runtimeCapabilities.supportsMicQuality) {
                    return 'Microphone capture works here. Live speech recognition is limited, so Quality mode is recommended.';
                }
                return 'Microphone capture is ready. Use Live for fast dictation or Quality for API transcription.';
            }

            function renderCaptureHelp() {
                if (!captureHelpCopy) return;
                const cards = [];
                if (!runtimeCapabilities.isSecureContext) {
                    cards.push({ title: 'Open the app on localhost or HTTPS', body: 'Safari and many mobile browsers block microphone, tab, and screen capture on file pages. Open this HTML through localhost, 127.0.0.1, or HTTPS before trying to record.' });
                }
                if (state.captureSource === 'browser-tab' || state.captureSource === 'mic') {
                    cards.push({ title: 'Google Meet or browser media', body: 'Choose Browser tab audio, start recording, then pick the exact meeting or media tab and enable Share audio. This is the cleanest path for browser-based meetings on desktop Chrome or Edge.' });
                }
                if (state.captureSource === 'screen-audio' || state.captureSource === 'external-help' || state.captureSource === 'mic') {
                    cards.push({ title: 'Zoom or Teams desktop apps on Windows', body: 'Choose Screen + system audio, start recording, then share the screen or app and enable system audio if the browser offers it. If audio is still missing, use a loopback device such as Stereo Mix or another OS audio loopback input as the microphone source.' });
                }
                cards.push({ title: 'Safari desktop', body: 'Microphone capture is the primary path. Browser-tab and system-audio capture are limited in Safari, so if meeting audio is important use Quality mode with a microphone or switch to Chrome or Edge for shared tab or system audio.' });
                cards.push({ title: 'iPhone and iPad', body: 'A browser on iPhone or iPad cannot directly capture audio from another app because of OS privacy rules. Use the microphone from speaker output, record in Voice Memos and upload it in File mode, or run the meeting on another device and use this device as the recorder.' });
                if (state.captureSource === 'external-help') {
                    cards.push({ title: 'External app or phone workflow', body: 'If the speaker is in another app or on another phone, the most reliable path is to play the audio on one device and capture it with the microphone on another device, or save the recording and upload it in File mode for transcription.' });
                }
                captureHelpTip.textContent = `Current source: ${getCaptureSourceLabel()}`;
                captureHelpCopy.innerHTML = cards.map(card => `<div class="capture-help-card"><h4>${card.title}</h4><p>${card.body}</p></div>`).join('');
            }

            function renderCaptureUi() {
                if (!captureSourceSelect) return;
                captureSourceSelect.value = state.captureSource;
                if (captureSourceSelect.options[1]) {
                    captureSourceSelect.options[1].disabled = !runtimeCapabilities.supportsTabOrScreenCapture;
                    captureSourceSelect.options[1].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Browser tab audio' : 'Browser tab audio (Desktop Chrome/Edge)';
                }
                if (captureSourceSelect.options[2]) {
                    captureSourceSelect.options[2].disabled = !runtimeCapabilities.supportsTabOrScreenCapture;
                    captureSourceSelect.options[2].textContent = runtimeCapabilities.supportsTabOrScreenCapture ? 'Screen + system audio' : 'Screen + system audio (Desktop Chrome/Edge)';
                }
                if (captureCapabilityNote) captureCapabilityNote.textContent = getCaptureCapabilitySummary();
                renderCaptureHelp();
                setCaptureHelpOpen(state.captureHelpOpen);
                if (modeRealtimeBtn) {
                    modeRealtimeBtn.disabled = !runtimeCapabilities.hasSpeechRecognition;
                    modeRealtimeBtn.classList.toggle('disabled', !runtimeCapabilities.hasSpeechRecognition);
                    modeRealtimeBtn.title = runtimeCapabilities.hasSpeechRecognition ? 'Live dictation with browser speech recognition' : 'Live mode is limited here. Use Quality or File mode.';
                }
                if (captureSupportCard) {
                    captureSupportCard.style.display = '';
                    captureSupportCard.classList.toggle('is-file-mode', state.mode === 'file');
                }
                if (captureToolbar) captureToolbar.style.display = '';
                if (captureHelpPanel) captureHelpPanel.hidden = !state.captureHelpOpen;
            }

            function setCaptureSource(source, options = {}) {
                const allowed = ['mic', 'browser-tab', 'screen-audio', 'external-help'];
                state.captureSource = allowed.includes(source) ? source : 'mic';
                localStorage.setItem('vt_capture_source', state.captureSource);
                if (state.captureSource === 'external-help') state.captureHelpOpen = true;
                else if (!options.keepHelp) state.captureHelpOpen = false;
                if (state.captureSource === 'external-help') {
                    renderCaptureUi();
                    setStatus('Capture setup help', 'Choose the best setup below, or switch back to Microphone to record now');
                } else if (state.captureSource !== 'mic' && state.mode === 'realtime') {
                    if (!options.silent) toast('Live mode only works with the microphone. Switched to Quality.', 'warning');
                    setMode('quality', { silent: true });
                } else {
                    renderCaptureUi();
                    const ready = getReadyStatusForCurrentState();
                    setStatus(ready.main, ready.sub);
                }
                updateDiagnostics({ captureSource: state.captureSource, captureMode: state.mode }, `Capture source set to ${state.captureSource}`);
            }

            function ensureSecureContextForCapture() {
                if (runtimeCapabilities.isSecureContext) return true;
                state.captureHelpOpen = true;
                renderCaptureUi();
                setStatus('Secure context required', 'Open this app via localhost or HTTPS to record audio');
                toast('Recording needs HTTPS, localhost, or 127.0.0.1. file pages may fail.', 'warning', 4200);
                return false;
            }

            async function acquireCaptureStream(source = state.captureSource) {
                if (!ensureSecureContextForCapture()) throw new Error('Capture requires HTTPS, localhost, or 127.0.0.1.');
                if (source === 'external-help') {
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    throw new Error('Open Capture Help for the recommended setup on this device.');
                }
                if (source === 'mic') {
                    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is not available in this browser.');
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                        video: false
                    });
                    state.captureSessionStream = stream;
                    state.micStream = stream;
                    return stream;
                }
                if (!runtimeCapabilities.supportsTabOrScreenCapture || !navigator.mediaDevices?.getDisplayMedia) {
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    throw new Error('Meeting audio capture from tabs or apps is limited here. Use Capture Help for the best fallback.');
                }
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const audioTracks = displayStream.getAudioTracks();
                if (!audioTracks.length) {
                    stopTracks(displayStream);
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    throw new Error(source === 'browser-tab' ? 'No tab audio was shared. Pick the correct tab and enable Share audio.' : 'No shared audio track was provided. Enable system audio or use microphone or File mode.');
                }
                const audioOnlyStream = new MediaStream(audioTracks);
                state.captureSessionStream = displayStream;
                state.micStream = audioOnlyStream;
                return audioOnlyStream;
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // SPEECH RECOGNITION (Live Mode)
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            let recognition = null;
            let assistantRecognition = null;
            let assistantDictationBase = '';
            let assistantDictationFinal = '';
            if (SR) {
                recognition = new SR();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;
                recognition.lang = 'en-IN';

                recognition.onresult = (e) => {
                    clearNoSpeechTimer();
                    clearAutoCopyCountdown();
                    autoCopyBtn.classList.remove('auto-copy-active');

                    let interim = '';
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        const res = e.results[i];
                        let text = res[0].transcript.trim();
                        const conf = res[0].confidence;
                        if (res.isFinal) {
                            if (!text) continue;
                            const gapMs = state.lastEndTime ? Date.now() - state.lastEndTime : 0;
                            text = applySmartPunct(text, gapMs);
                            addSegment(text, conf);
                            state.confirmedText = transcript.value;
                            state.lastInterimText = '';
                            interimEl.textContent = '';
                            interimEl.classList.remove('idle-hint');
                            state.lastEndTime = Date.now();
                        } else {
                            interim = text;
                        }
                    }
                    if (interim) {
                        state.lastInterimText = interim;
                        interimEl.textContent = interim;
                        interimEl.classList.remove('idle-hint');
                        const sep = state.confirmedText && !state.confirmedText.endsWith('\n') ? ' ' : '';
                        transcript.value = state.confirmedText + sep + interim;
                        transcript.scrollTop = transcript.scrollHeight;
                    }
                    setNoSpeechTimer();
                };

                recognition.onerror = (e) => {
                    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                        forceStop();
                        setStatus('Microphone access denied', 'Grant mic permission and try again');
                        toast('Microphone permission denied', 'error');
                    } else if (e.error === 'no-speech') {
                        // handled by timer
                    } else if (e.error === 'network') {
                        if (state.isRecording) {
                            setStatus('Network hiccup - reconnecting...', '');
                            scheduleRestart();
                        }
                    } else if (e.error === 'aborted') {
                        // intentional
                    } else {
                        toast('Recognition error: ' + e.error, 'error');
                    }
                };

                recognition.onend = () => {
                    if (state.manualStop) {
                        commitPendingRealtimeInterim();
                        state.manualStop = false;
                        return;
                    }
                    if (state.isRecording && state.mode === 'realtime' && !state.restartTimeout) {
                        scheduleRestart(50);
                    }
                };

                assistantRecognition = new SR();
                assistantRecognition.continuous = true;
                assistantRecognition.interimResults = true;
                assistantRecognition.maxAlternatives = 1;
                assistantRecognition.lang = 'en-US';

                assistantRecognition.onresult = (e) => {
                    let interim = '';
                    for (let i = e.resultIndex; i < e.results.length; i++) {
                        const result = e.results[i];
                        const text = String(result?.[0]?.transcript || '').trim();
                        if (!text) continue;
                        if (result.isFinal) {
                            assistantDictationFinal = assistantDictationFinal
                                ? `${assistantDictationFinal} ${text}`
                                : text;
                        } else {
                            interim = interim ? `${interim} ${text}` : text;
                        }
                    }
                    const next = [assistantDictationBase, assistantDictationFinal, interim].filter(Boolean).join(' ').trim();
                    if (assistantInput) assistantInput.value = next;
                    setAssistantDraft(next);
                };

                assistantRecognition.onend = () => {
                    state.assistant.isListening = false;
                    renderAssistantMessages();
                };

                assistantRecognition.onerror = (e) => {
                    console.warn('Assistant speech recognition error:', e.error);
                    state.assistant.isListening = false;
                    renderAssistantMessages();
                    if (e.error !== 'aborted' && e.error !== 'no-speech') {
                        toast('Assistant voice input unavailable', 'warning');
                    }
                };
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // AUDIO PREPROCESSING
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

            function analyzeAudio(buffer) {
                const data = buffer.getChannelData(0);
                let peak = 0, sumSq = 0, clipping = 0;
                const silenceRanges = [];
                let silStart = -1;
                const winSize = Math.floor(buffer.sampleRate * 0.05);
                const silThresh = 0.01;

                for (let i = 0; i < data.length; i++) {
                    const abs = Math.abs(data[i]);
                    if (abs > peak) peak = abs;
                    sumSq += data[i] * data[i];
                    if (abs > 0.99) clipping++;
                }

                // Silence detection (simple windowed)
                for (let i = 0; i < data.length; i += winSize) {
                    let winSum = 0;
                    const end = Math.min(i + winSize, data.length);
                    for (let j = i; j < end; j++) winSum += data[j] * data[j];
                    const rms = Math.sqrt(winSum / (end - i));
                    if (rms < silThresh) {
                        if (silStart < 0) silStart = i / buffer.sampleRate;
                    } else {
                        if (silStart >= 0) {
                            const silEnd = i / buffer.sampleRate;
                            if (silEnd - silStart > 0.3) silenceRanges.push([silStart, silEnd]);
                            silStart = -1;
                        }
                    }
                }
                if (silStart >= 0) {
                    const silEnd = data.length / buffer.sampleRate;
                    if (silEnd - silStart > 0.3) silenceRanges.push([silStart, silEnd]);
                }

                const rmsLevel = Math.sqrt(sumSq / data.length);
                const clippingPct = (clipping / data.length) * 100;

                return { peak, rmsLevel, clippingPct, silenceRanges, duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels };
            }

            async function processAudioBuffer(buffer, analysis, normalize) {
                const sr = buffer.sampleRate;
                const len = buffer.length;
                const offCtx = new OfflineAudioContext(1, len, sr);

                const src = offCtx.createBufferSource();
                src.buffer = buffer;

                if (normalize) {
                    // High pass filter at 80Hz
                    const hp = offCtx.createBiquadFilter();
                    hp.type = 'highpass';
                    hp.frequency.value = 80;

                    // Compressor
                    const comp = offCtx.createDynamicsCompressor();
                    comp.threshold.value = -24;
                    comp.knee.value = 12;
                    comp.ratio.value = 4;
                    comp.attack.value = 0.003;
                    comp.release.value = 0.25;

                    // Gain normalization
                    const gain = offCtx.createGain();
                    const targetPeak = 0.89;
                    gain.gain.value = analysis.peak > 0.001 ? Math.min(targetPeak / analysis.peak, 10) : 1;

                    src.connect(hp);
                    hp.connect(comp);
                    comp.connect(gain);
                    gain.connect(offCtx.destination);
                } else {
                    // Just mix to mono
                    src.connect(offCtx.destination);
                }

                src.start(0);
                return offCtx.startRendering();
            }

            async function resampleTo16k(buffer) {
                const targetRate = 16000;
                if (buffer.sampleRate === targetRate && buffer.numberOfChannels === 1) return buffer;
                const duration = buffer.duration;
                const outLen = Math.ceil(duration * targetRate);
                const offCtx = new OfflineAudioContext(1, outLen, targetRate);
                const src = offCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(offCtx.destination);
                src.start(0);
                return offCtx.startRendering();
            }

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

                function writeStr(offset, str) { for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i)); }
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

                let offset = 44;
                for (let i = 0; i < data.length; i++) {
                    let s = Math.max(-1, Math.min(1, data[i]));
                    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    dv.setInt16(offset, s, true);
                    offset += 2;
                }
                return new Blob([ab], { type: 'audio/wav' });
            }

            function chunkWavBlob(buffer, maxBytes) {
                // Calculate samples per chunk
                const bytesPerSample = 2; // 16-bit
                const headerSize = 44;
                const maxSamplesPerChunk = Math.floor((maxBytes - headerSize) / bytesPerSample);
                const data = buffer.getChannelData(0);
                const totalSamples = data.length;

                if (totalSamples * bytesPerSample + headerSize <= maxBytes) {
                    return [{ blob: audioBufferToWav(buffer), startTime: 0, endTime: buffer.duration, index: 0 }];
                }

                // Find silence points for smart splitting
                const analysis = analyzeAudio(buffer);
                const silencePoints = analysis.silenceRanges.map(r => Math.floor((r[0] + r[1]) / 2 * buffer.sampleRate));

                const chunks = [];
                let pos = 0;
                let idx = 0;

                while (pos < totalSamples) {
                    let end = Math.min(pos + maxSamplesPerChunk, totalSamples);

                    // Try to split at silence point
                    if (end < totalSamples) {
                        let bestSplit = end;
                        let bestDist = Infinity;
                        for (const sp of silencePoints) {
                            if (sp > pos + maxSamplesPerChunk * 0.5 && sp < end) {
                                const dist = Math.abs(sp - end);
                                if (dist < bestDist) { bestDist = dist; bestSplit = sp; }
                            }
                        }
                        end = bestSplit;
                    }

                    // Add overlap
                    const overlapSamples = Math.floor(buffer.sampleRate * 0.5);
                    const chunkStart = Math.max(0, pos - (idx > 0 ? overlapSamples : 0));
                    const chunkData = data.slice(chunkStart, end);

                    // Create AudioBuffer for this chunk
                    const chunkCtx = new OfflineAudioContext(1, chunkData.length, buffer.sampleRate);
                    const chunkBuf = chunkCtx.createBuffer(1, chunkData.length, buffer.sampleRate);
                    chunkBuf.getChannelData(0).set(chunkData);

                    chunks.push({
                        blob: audioBufferToWav(chunkBuf),
                        startTime: chunkStart / buffer.sampleRate,
                        endTime: end / buffer.sampleRate,
                        index: idx
                    });

                    pos = end;
                    idx++;
                }

                return chunks;
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // API INTEGRATION
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function getApiEndpoint() {
                return getAudioEndpoint('transcriptions');
            }

            function getWhisperLang() {
                const sel = langSelect.selectedOptions[0];
                if (!sel || langSelect.value === 'auto') return null;
                return sel.dataset.wlang || null;
            }

            async function testApiKey() {
                if (!getProviderKeys().length) { toast('Enter an API key first', 'warning'); return; }
                try {
                    const silentBuf = new AudioBuffer({ length: 16000, sampleRate: 16000, numberOfChannels: 1 });
                    const testBlob = audioBufferToWav(silentBuf);
                    const result = await providerRequest({
                        url: getApiEndpoint(),
                        responseType: 'json',
                        purpose: 'api-test',
                        buildBody: () => {
                            const fd = new FormData();
                            fd.append('file', testBlob, 'test.wav');
                            fd.append('model', getEffectiveAudioModel());
                            fd.append('response_format', 'json');
                            return fd;
                        }
                    });
                    state.apiConnected = true;
                    apiStatusDot.className = 'api-status-dot connected';
                    apiStatusLabel.textContent = 'Connected';
                    updateDiagnostics({ provider: state.apiProvider, audioModel: getEffectiveAudioModel(), audioTask: 'api-test', fileHash: state.fileHash || '' }, 'API key validated');
                    toast('API key valid', 'success');
                } catch (e) {
                    state.apiConnected = false;
                    apiStatusDot.className = 'api-status-dot error';
                    apiStatusLabel.textContent = 'Error';
                    toast('Connection failed: ' + e.message, 'error');
                }
                updateTranscribeBtn();
            }

            async function testGeminiKey() {
                if (!getProviderKeys('gemini').length) { toast('Enter a Gemini key first', 'warning'); return; }
                try {
                    recordGeminiUsage(getConfiguredGeminiAnalysisModel());
                    const resp = await fetch(getGeminiGenerateEndpoint(getConfiguredGeminiAnalysisModel()), {
                        method: 'POST',
                        headers: {
                            'x-goog-api-key': getProviderKeys('gemini')[0],
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                role: 'user',
                                parts: [{ text: 'Reply with OK only.' }]
                            }]
                        })
                    });
                    const raw = await resp.text().catch(() => '');
                    const payload = safeJsonParse(raw, null);
                    if (!resp.ok) throw new Error(payload?.error?.message || payload?.message || raw || `Gemini test failed (${resp.status})`);
                    const btn = geminiKeyTestBtn;
                    if (btn) {
                        btn.classList.add('saved');
                        btn.textContent = 'Ready';
                        setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Test'; }, 1500);
                    }
                    toast('Gemini key valid', 'success');
                } catch (e) {
                    toast('Gemini connection failed: ' + e.message, 'error');
                }
            }

            async function transcribeBlob(blob, options = {}) {
                const endpoint = getAudioEndpoint(options.translate ? 'translations' : 'transcriptions');
                return providerRequest({
                    url: endpoint,
                    responseType: 'json',
                    signal: options.signal,
                    purpose: options.translate ? 'translate-audio' : 'transcribe-audio',
                    buildBody: () => {
                        const fd = new FormData();
                        fd.append('file', blob, 'audio.wav');
                        fd.append('model', getEffectiveAudioModel({ translate: !!options.translate }));
                        fd.append('response_format', 'verbose_json');
                        fd.append('timestamp_granularities[]', 'segment');
                        if (options.language) fd.append('language', options.language);
                        if (options.prompt) fd.append('prompt', options.prompt);
                        return fd;
                    }
                });
            }

            async function transcribeChunks(chunks, options, onProgress, cacheKey = '') {
                let partial = cacheKey ? readPartialProgress(cacheKey) : null;
                let results = Array.isArray(partial?.results) ? partial.results : [];
                let startIndex = typeof partial?.nextIndex === 'number' ? partial.nextIndex : 0;
                if (startIndex > 0) updateDiagnostics({ resumedFromChunk: startIndex + 1 }, `Resuming chunk transcription from ${startIndex + 1}/${chunks.length}`);
                for (let i = startIndex; i < chunks.length; i++) {
                    if (state.abortController?.signal.aborted) throw new Error('Cancelled');
                    onProgress?.({ current: i + 1, total: chunks.length });
                    const prompt = results.length > 0 ? (results[results.length - 1].text || '').slice(-240) : '';
                    const result = await transcribeBlob(chunks[i].blob, {
                        ...options,
                        prompt,
                        signal: state.abortController?.signal
                    });
                    if (result.segments) {
                        result.segments.forEach(seg => {
                            seg.start += chunks[i].startTime;
                            seg.end += chunks[i].startTime;
                        });
                    }
                    results.push(result);
                    if (cacheKey) savePartialProgress(cacheKey, { results, nextIndex: i + 1 });
                    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 250));
                }
                if (cacheKey) clearPartialProgress(cacheKey);
                return mergeResults(results);
            }

            function mergeResults(results) {
                let allText = '';
                let allSegments = [];
                let detectedLang = '';
                let totalDuration = 0;
                const langCounts = {};

                results.forEach((r) => {
                    if (r.language) {
                        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
                    }
                    if (r.duration) totalDuration = Math.max(totalDuration, (r.segments?.[r.segments.length - 1]?.end || r.duration));
                    if (r.segments && r.segments.length) {
                        if (allSegments.length && r.segments.length) {
                            const lastEnd = allSegments[allSegments.length - 1].end;
                            const firstStart = r.segments[0].start;
                            if (firstStart < lastEnd) {
                                const lastText = allSegments[allSegments.length - 1].text.trim().toLowerCase();
                                const firstText = r.segments[0].text.trim().toLowerCase();
                                if (textSimilarity(lastText, firstText) > 0.6) r.segments.shift();
                            }
                        }
                        allSegments = allSegments.concat(r.segments);
                    }
                    if (r.text) {
                        if (allText) allText += ' ';
                        allText += r.text.trim();
                    }
                });

                let maxCount = 0;
                for (const [lang, count] of Object.entries(langCounts)) {
                    if (count > maxCount) { maxCount = count; detectedLang = lang; }
                }

                return { text: applyGlossaryToText(allText), segments: allSegments, language: detectedLang, duration: totalDuration };
            }

            function textSimilarity(a, b) {
                if (!a || !b) return 0;
                const longer = a.length > b.length ? a : b;
                const shorter = a.length > b.length ? b : a;
                if (longer.length === 0) return 1;
                if (longer.includes(shorter)) return shorter.length / longer.length;
                let matches = 0;
                const aArr = a.split('');
                const bSet = new Set(b.split(''));
                aArr.forEach(c => { if (bSet.has(c)) matches++; });
                return matches / Math.max(a.length, b.length);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // FILE PROCESSING
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            async function processUploadedFile() {
                if (!state.uploadedFile || !state.apiKey) return;
                if (state.isProcessing) return;

                state.isProcessing = true;
                state.abortController = new AbortController();
                progressWrap.classList.add('visible');
                transcribeBtn.disabled = true;
                transcribeBtn.classList.add('processing');
                transcribeBtn.innerHTML = '<span>Processing...</span>';

                try {
                    // Step 1: Decode
                    setProgress(-1, 'Decoding audio...');
                    const arrayBuf = await state.uploadedFile.arrayBuffer();
                    state.fileHash = await hashArrayBuffer(arrayBuf);
                    const translate = $('optTranslate').checked;
                    const useCache = $('optUseCache').checked;
                    const wLang = getWhisperLang();
                    const effectiveAudioModel = getEffectiveAudioModel({ translate });

                    state.cacheKey = buildTranscriptCacheKey(state.fileHash, {
                        translate,
                        normalize: doNormalize,
                        language: wLang,
                        model: effectiveAudioModel
                    });
                    updateDiagnostics({
                        fileHash: state.fileHash,
                        cacheKey: state.cacheKey,
                        audioModel: effectiveAudioModel,
                        audioTask: translate ? 'translate-en' : 'transcribe',
                        cacheHit: false
                    }, translate && state.apiProvider === 'groq'
                        ? 'Translation requested - using whisper-large-v3 on Groq'
                        : 'File loaded');
                    const cached = useCache ? readTranscriptCache(state.cacheKey) : null;
                    if (cached) {
                        displayFileResult(cached);
                        setCacheStatus('Cache hit - reused previous transcript');
                        updateDiagnostics({ cacheHit: true }, 'Transcript cache hit');
                        setCacheStatus('Cache hit - reused previous transcript');
                        toast('Loaded cached transcript', 'success');
                        return;
                    }
                    setCacheStatus('Cache miss - transcribing');
                    setCacheStatus(useCache ? 'Cache miss - transcribing' : 'Cache bypassed - transcribing');
                    const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const decoded = await tempCtx.decodeAudioData(arrayBuf);
                    tempCtx.close();

                    // Step 2: Analyze
                    setProgress(-1, 'Analyzing audio...');
                    const analysis = analyzeAudio(decoded);
                    state.audioAnalysis = analysis;
                    showAnalysis(analysis);

                    // Step 3: Preprocess
                    const doNormalize = $('optNormalize').checked;
                    setProgress(-1, 'Preprocessing audio...');
                    const processed = await processAudioBuffer(decoded, analysis, doNormalize);

                    // Step 4: Resample
                    setProgress(-1, 'Resampling to 16kHz...');
                    const resampled = await resampleTo16k(processed);

                    // Step 5: Chunk
                    setProgress(-1, 'Preparing chunks...');
                    const maxChunkBytes = 24 * 1024 * 1024;
                    const chunks = chunkWavBlob(resampled, maxChunkBytes);

                    // Step 6: Transcribe
                    setProgress(-1, translate ? 'Preparing English translation...' : 'Preparing transcription...');
                    setProgress(-1, translate ? 'Preparing English translation...' : 'Preparing transcription...');
                    const result = await transcribeChunks(chunks, {
                        language: wLang,
                        translate
                    }, (prog) => {
                        const pct = Math.round((prog.current / prog.total) * 100);
                        setProgress(pct, `${translate ? 'Translating' : 'Transcribing'} chunk ${prog.current}/${prog.total}...`);
                        setProgress(pct, `Transcribing chunk ${prog.current}/${prog.total}...`);
                        setProgress(pct, `${translate ? 'Translating' : 'Transcribing'} chunk ${prog.current}/${prog.total}...`);
                    }, state.cacheKey);
                    if (useCache) {
                        saveTranscriptCache(state.cacheKey, result);
                        setCacheStatus('Transcript cached locally');
                    } else {
                        setCacheStatus('Cache bypassed for this run');
                    }

                    // Step 7: Display
                    setProgress(100, 'Complete!');
                    displayFileResult(result);

                    state.detectedLanguage = result.language || '';
                    if (state.detectedLanguage) {
                        detectedLangBadge.textContent = state.detectedLanguage.toUpperCase();
                        detectedLangBadge.style.display = 'inline-block';
                    }

                    toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');

                } catch (err) {
                    if (err.message === 'Cancelled') {
                        toast('Transcription cancelled', 'info');
                    } else {
                        toast('Error: ' + err.message, 'error');
                        console.error(err);
                    }
                } finally {
                    state.isProcessing = false;
                    state.abortController = null;
                    progressWrap.classList.remove('visible');
                    transcribeBtn.disabled = false;
                    transcribeBtn.classList.remove('processing');
                    transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> Transcribe';
                    updateTranscribeBtn();
                }
            }

            function displayFileResult(result) {
                state.segments = [];
                segView.innerHTML = '';
                transcript.value = cleanTranscriptLocal(result.text || '');
                state.confirmedText = transcript.value;
                state.audioDurationSec = result.duration || state.audioDurationSec || 0;
                if (result.segments) {
                    result.segments.forEach((seg, idx) => {
                        const conf = seg.avg_logprob ? Math.exp(seg.avg_logprob) : (seg.confidence || 0.9);
                        state.segments.push(normalizeSegment({
                            text: seg.text?.trim() || '',
                            conf,
                            time: formatTimestamp(seg.start),
                            lang: seg.language || result.language,
                            startSec: seg.start,
                            endSec: seg.end,
                            speaker: state.preset === 'meeting' || state.preset === 'interview' ? (idx % 2 === 0 ? 'Speaker A' : 'Speaker B') : ''
                        }, idx));
                    });
                    renderSegments();
                    rebuildTranscriptFromSegments();
                } else {
                    updateStats();
                }
                transcript.scrollTop = 0;
                scheduleWorkspaceSave();
            }

            function formatTimestamp(seconds) {
                if (seconds == null) return '00:00';
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            }

            function formatTimestampFull(seconds) {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = Math.floor(seconds % 60);
                const ms = Math.floor((seconds % 1) * 1000);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
            }

            function formatTimestampVTT(seconds) {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = Math.floor(seconds % 60);
                const ms = Math.floor((seconds % 1) * 1000);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
            }

            function normalizeUiText(text = '') {
                return String(text || '')
                    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦|Ã¢â‚¬Â¦/g, '...')
                    .replace(/Ã¢â‚¬â€/g, '-')
                    .replace(/Ã‚Â·/g, ' | ')
                    .replace(/Whisper API/g, 'speech-to-text')
                    .replace(/Whisper transcription/g, 'quality transcription')
                    .replace(/Whisper/g, 'speech-to-text');
            }

            function setProgress(pct, label) {
                label = normalizeUiText(label);
                progressLabel.querySelector('span') ? progressLabel.querySelector('span').textContent = label : (progressLabel.childNodes[0].textContent = label);
                if (pct < 0) {
                    progressFill.classList.add('indeterminate');
                    progressFill.style.width = '40%';
                } else {
                    progressFill.classList.remove('indeterminate');
                    progressFill.style.width = pct + '%';
                }
            }

            function showAnalysis(a) {
                const peakDb = a.peak > 0 ? (20 * Math.log10(a.peak)).toFixed(1) : '-inf';
                const rmsDb = a.rmsLevel > 0 ? (20 * Math.log10(a.rmsLevel)).toFixed(1) : '-inf';
                const peakColor = a.peak > 0.95 ? 'red' : a.peak > 0.5 ? 'green' : 'yellow';
                const clipColor = a.clippingPct > 1 ? 'red' : a.clippingPct > 0 ? 'yellow' : 'green';

                audioAnalysisEl.innerHTML = `
      <span class="analysis-item"><span class="dot ${peakColor}"></span> Peak: ${peakDb} dB</span>
      <span class="analysis-item"><span class="dot green"></span> RMS: ${rmsDb} dB</span>
      <span class="analysis-item"><span class="dot ${clipColor}"></span> Clipping: ${a.clippingPct.toFixed(2)}%</span>
      <span class="analysis-item"><span class="dot green"></span> ${a.sampleRate / 1000}kHz | ${a.channels}ch | ${fmtTime(a.duration * 1000)}</span>
    `;
                audioAnalysisEl.classList.add('visible');
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // QUALITY MODE (Record â†’ Whisper)
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function startQualityRecording() {
                navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                    state.micStream = stream;
                    state.recordedChunks = [];

                    // Use the best available format
                    let mimeType = 'audio/webm;codecs=opus';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'audio/webm';
                        if (!MediaRecorder.isTypeSupported(mimeType)) {
                            mimeType = 'audio/ogg;codecs=opus';
                            if (!MediaRecorder.isTypeSupported(mimeType)) {
                                mimeType = '';
                            }
                        }
                    }

                    const options = mimeType ? { mimeType } : {};
                    state.mediaRecorder = new MediaRecorder(stream, options);

                    state.mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) state.recordedChunks.push(e.data);
                    };

                    state.mediaRecorder.onstop = async () => {
                        const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType || 'audio/webm' });
                        stream.getTracks().forEach(t => t.stop());

                        if (!getProviderKeys().length) {
                            toast('API key required for Quality mode transcription', 'warning');
                            return;
                        }

                        setStatus('Processing recording...', 'Sending to speech-to-text');
                        interimEl.textContent = 'Transcribing your recording...';
                        interimEl.classList.remove('idle-hint');

                        try {
                            // Decode and preprocess
                            const arrayBuf = await blob.arrayBuffer();
                            const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const decoded = await tempCtx.decodeAudioData(arrayBuf);
                            tempCtx.close();

                            const analysis = analyzeAudio(decoded);
                            const processed = await processAudioBuffer(decoded, analysis, true);
                            const resampled = await resampleTo16k(processed);
                            const wavBlob = audioBufferToWav(resampled);

                            const maxChunkBytes = 24 * 1024 * 1024;
                            const chunks = chunkWavBlob(resampled, maxChunkBytes);
                            const wLang = getWhisperLang();

                            const result = await transcribeChunks(chunks, { language: wLang }, null);

                            displayFileResult(result);
                            if (result.language) {
                                detectedLangBadge.textContent = result.language.toUpperCase();
                                detectedLangBadge.style.display = 'inline-block';
                            }
                            toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');
                            scheduleWorkspaceSave();
                        } catch (err) {
                            toast('Transcription error: ' + err.message, 'error');
                        }

                        interimEl.textContent = 'Interim transcription appears here as you speak...';
                        interimEl.classList.add('idle-hint');
                        orbTrigger?.setAttribute('aria-pressed', 'false');
                        setStatus('Ready to record', 'Click orb or press Space');
                    };

                    state.mediaRecorder.start(1000);
                    state.isRecording = true;
                    recPanel.classList.add('recording');
                    micOuter?.classList.add('recording');
                    orbTrigger?.setAttribute('aria-pressed', 'true');
                    setStatus('Recording (Quality)', 'Speak now - tap the orb or press Space to stop');
                    interimEl.textContent = 'Recording audio for quality transcription...';
                    setStatus('Recording (Quality)', 'Speak now - transcribes after you stop');
                    interimEl.classList.remove('idle-hint');
                    startTimer();
                    startAudioVisualizer(stream);
                }).catch(err => {
                    toast('Microphone access denied', 'error');
                });
            }

            function stopQualityRecording() {
                if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                    state.mediaRecorder.stop();
                }
                state.isRecording = false;
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                stopTimer();
                stopAudio();
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // AUDIO VISUALIZATION
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function ensureCanvasSize() {
                const dpr = window.devicePixelRatio || 1;
                const W = canvas.offsetWidth;
                const H = canvas.offsetHeight;
                if (!W || !H) return { W: 0, H: 0 };
                if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                    canvas.width = W * dpr;
                    canvas.height = H * dpr;
                    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
                }
                return { W, H };
            }

            function analyzeLiveLevel(data) {
                if (!data?.length) return 0;
                let peak = 0;
                let sumSq = 0;
                for (let i = 0; i < data.length; i++) {
                    const centered = (data[i] - 128) / 128;
                    const abs = Math.abs(centered);
                    if (abs > peak) peak = abs;
                    sumSq += centered * centered;
                }
                const rms = Math.sqrt(sumSq / data.length);
                return Math.min(1, rms * 2.6 + peak * 0.35);
            }

            function drawOrbFrame(level = 0, isLive = false, waveform = null) {
                const { W, H } = ensureCanvasSize();
                if (!W || !H) return;

                const t = performance.now() * 0.001;
                const cx = W / 2;
                const cy = H / 2;
                const size = Math.min(W, H);
                const radius = size * 0.205;
                const easedLevel = Math.pow(Math.max(0, Math.min(1, level)), 0.8);
                const pulse = 1 + easedLevel * 0.032 + (isLive ? 0.006 : 0);

                ctx2d.clearRect(0, 0, W, H);

                const bg = ctx2d.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.8);
                bg.addColorStop(0, 'rgba(10, 24, 46, 0.12)');
                bg.addColorStop(0.45, 'rgba(4, 10, 24, 0.28)');
                bg.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
                ctx2d.fillStyle = bg;
                ctx2d.fillRect(0, 0, W, H);

                const halo = ctx2d.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.95);
                halo.addColorStop(0, 'rgba(125, 211, 252, 0.04)');
                halo.addColorStop(0.48, `rgba(59, 130, 246, ${0.05 + easedLevel * 0.12})`);
                halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
                ctx2d.fillStyle = halo;
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
                ctx2d.fill();

                state.orbPhase += 0.004 + easedLevel * 0.016 + (isLive ? 0.0015 : 0);

                ctx2d.save();
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
                ctx2d.clip();

                const shell = ctx2d.createRadialGradient(cx, cy - radius * 0.35, radius * 0.08, cx, cy, radius * 1.05);
                shell.addColorStop(0, 'rgba(242, 250, 255, 0.98)');
                shell.addColorStop(0.28, 'rgba(205, 235, 255, 0.94)');
                shell.addColorStop(0.58, 'rgba(96, 183, 255, 0.92)');
                shell.addColorStop(1, 'rgba(19, 118, 255, 0.98)');
                ctx2d.fillStyle = shell;
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx2d.fill();

                const liquidLevel = cy + radius * (0.24 - easedLevel * 0.12);
                const waveAmp = radius * (0.024 + easedLevel * 0.038 + (isLive ? 0.014 : 0));
                const waveFreq = 2.15;
                const phase = t * (0.72 + easedLevel * 0.42) + state.orbPhase * 3.2;

                ctx2d.beginPath();
                ctx2d.moveTo(cx - radius * 1.1, cy + radius * 1.1);
                for (let x = -radius * 1.1; x <= radius * 1.1; x += 3) {
                    const normalized = x / radius;
                    const sampleIndex = waveform ? Math.min(waveform.length - 1, Math.max(0, Math.floor(((normalized + 1) * 0.5) * waveform.length))) : 0;
                    const sample = waveform ? (waveform[sampleIndex] - 128) / 128 : 0;
                    const y = liquidLevel
                        + Math.sin(normalized * waveFreq + phase) * waveAmp
                        + Math.sin(normalized * (waveFreq * 0.55) - phase * 0.65) * waveAmp * 0.34
                        + sample * waveAmp * 0.34;
                    ctx2d.lineTo(cx + x, y);
                }
                ctx2d.lineTo(cx + radius * 1.1, cy + radius * 1.1);
                ctx2d.closePath();

                const liquid = ctx2d.createLinearGradient(cx, cy - radius, cx, cy + radius);
                liquid.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
                liquid.addColorStop(0.16, 'rgba(223, 242, 255, 0.96)');
                liquid.addColorStop(0.5, 'rgba(98, 191, 255, 0.95)');
                liquid.addColorStop(1, 'rgba(18, 126, 255, 0.97)');
                ctx2d.fillStyle = liquid;
                ctx2d.fill();

                ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.24)';
                ctx2d.lineWidth = Math.max(2, radius * 0.016);
                ctx2d.beginPath();
                for (let x = -radius * 0.92; x <= radius * 0.92; x += 4) {
                    const normalized = x / radius;
                    const y = liquidLevel
                        + Math.sin(normalized * waveFreq + phase) * waveAmp
                        + Math.sin(normalized * (waveFreq * 0.55) - phase * 0.65) * waveAmp * 0.34;
                    if (x === -radius * 0.92) ctx2d.moveTo(cx + x, y);
                    else ctx2d.lineTo(cx + x, y);
                }
                ctx2d.stroke();

                const highlight = ctx2d.createRadialGradient(cx - radius * 0.18, cy - radius * 0.34, radius * 0.04, cx, cy, radius * 0.92);
                highlight.addColorStop(0, 'rgba(255,255,255,0.82)');
                highlight.addColorStop(0.2, 'rgba(236,246,255,0.42)');
                highlight.addColorStop(1, 'rgba(255,255,255,0)');
                ctx2d.fillStyle = highlight;
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
                ctx2d.fill();
                ctx2d.restore();

                ctx2d.save();
                ctx2d.globalCompositeOperation = 'lighter';
                ctx2d.strokeStyle = `rgba(170, 225, 255, ${0.09 + easedLevel * 0.12})`;
                ctx2d.lineWidth = radius * 0.04 * pulse;
                ctx2d.filter = 'blur(18px)';
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius * 1.03, 0, Math.PI * 2);
                ctx2d.stroke();
                ctx2d.restore();

                ctx2d.strokeStyle = `rgba(214, 241, 255, ${0.2 + easedLevel * 0.12})`;
                ctx2d.lineWidth = Math.max(2, radius * 0.018);
                ctx2d.beginPath();
                ctx2d.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
                ctx2d.stroke();
            }

            function startAudioVisualizer(stream) {
                state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (state.audioCtx.state === 'suspended') {
                    state.audioCtx.resume().catch(() => { });
                }
                state.analyser = state.audioCtx.createAnalyser();
                state.analyser.fftSize = 512;
                state.analyser.smoothingTimeConstant = 0.58;
                state.source = state.audioCtx.createMediaStreamSource(stream);
                state.source.connect(state.analyser);
                drawWave();
            }

            function startAudioFromMic() {
                acquireCaptureStream('mic')
                    .then(stream => {
                        startAudioVisualizer(stream);
                        updateDiagnostics({ captureSource: 'mic', captureMode: state.mode }, 'Microphone capture active');
                    }).catch((err) => {
                        setStatus('Microphone unavailable', 'Grant permission and try again');
                        toast(err.message || 'Microphone access denied', 'error');
                    });
            }

            function stopAudio() {
                if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
                if (state.source) { state.source.disconnect(); state.source = null; }
                if (state.audioCtx) { state.audioCtx.close().catch(() => { }); state.audioCtx = null; }
                if (state.micStream && state.mode !== 'quality') {
                    stopActiveCaptureTracks();
                }
                state.visualLevel = 0;
                drawOrbFrame(0, false);
            }

            function drawWave() {
                state.animFrame = requestAnimationFrame(drawWave);
                if (!state.analyser) {
                    drawOrbFrame(0, false);
                    return;
                }
                const bufLen = state.analyser.frequencyBinCount;
                const data = new Uint8Array(bufLen);
                state.analyser.getByteTimeDomainData(data);
                const liveLevel = analyzeLiveLevel(data);
                state.visualLevel = state.visualLevel * 0.82 + liveLevel * 0.18;
                drawOrbFrame(state.visualLevel, true, data);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // TIMER
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function startTimer() {
                state.sessionStart = Date.now();
                state.timerInterval = setInterval(updateTimer, 500);
            }

            function stopTimer() {
                clearInterval(state.timerInterval);
                if (state.sessionStart) {
                    durStat.textContent = fmtTime(Date.now() - state.sessionStart) + ' duration';
                }
            }

            function updateTimer() {
                if (!state.sessionStart) return;
                timerEl.textContent = fmtTime(Date.now() - state.sessionStart);
                if (orbTimerDisplay) orbTimerDisplay.textContent = timerEl.textContent;
            }

            function fmtTime(ms) {
                const s = Math.floor(ms / 1000);
                const m = Math.floor(s / 60);
                return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
            }

            function commitPendingRealtimeInterim() {
                const rawInterim = String(state.lastInterimText || '').trim();
                if (!rawInterim) return false;

                const displayValue = String(transcript.value || '').trim();
                const confirmedValue = String(state.confirmedText || '').trim();
                let commitText = '';

                if (!confirmedValue) {
                    commitText = displayValue || rawInterim;
                } else if (displayValue && displayValue !== confirmedValue) {
                    commitText = displayValue.startsWith(confirmedValue)
                        ? displayValue.slice(confirmedValue.length).trim()
                        : rawInterim;
                } else {
                    commitText = rawInterim;
                }

                if (!commitText) {
                    state.lastInterimText = '';
                    return false;
                }

                const gapMs = state.lastEndTime ? Date.now() - state.lastEndTime : 0;
                const finalText = applySmartPunct(commitText, gapMs);
                addSegment(finalText, 0.75);
                state.confirmedText = transcript.value;
                state.lastInterimText = '';
                interimEl.textContent = '';
                interimEl.classList.remove('idle-hint');
                state.lastEndTime = Date.now();
                return true;
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // START / STOP
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function startRecording() {
                if (state.mode === 'file') return;
                if (state.mode === 'quality') {
                    if (!state.apiKey) {
                        toast('API key required for Quality mode', 'warning');
                        apiPanel.classList.add('open');
                        return;
                    }
                    startQualityRecording();
                    return;
                }
                // Realtime mode
                if (!recognition) {
                    toast('Speech Recognition not available', 'error');
                    return;
                }
                const lang = langSelect.value;
                recognition.lang = lang === 'auto' ? 'en-US' : lang;
                recognition.start();
                state.isRecording = true;
                recPanel.classList.add('recording');
                micOuter?.classList.add('recording');
                orbTrigger?.setAttribute('aria-pressed', 'true');
                setStatus('Recording', 'Speak now - the orb reacts to your voice');
                setStatus('Recording', 'Speak now - tap the orb or press Space to stop');
                interimEl.classList.remove('idle-hint');
                interimEl.textContent = '';
                startTimer();
                startAudioFromMic();
                setStatus('Recording', 'Speak now - the orb reacts to your voice');
                setNoSpeechTimer();
                updateStats();
            }

            function stopRecording() {
                if (state.mode === 'quality') {
                    stopQualityRecording();
                    return;
                }
                commitPendingRealtimeInterim();
                state.isRecording = false;
                state.manualStop = true;
                clearNoSpeechTimer();
                clearAutoCopyCountdown();
                autoCopyBtn.classList.remove('auto-copy-active');
                clearTimeout(state.restartTimeout); state.restartTimeout = null;
                try {
                    if (recognition && typeof recognition.stop === 'function') recognition.stop();
                    else if (recognition) recognition.abort();
                } catch (e) {
                    try { if (recognition) recognition.abort(); } catch (e2) { }
                }
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                interimEl.textContent = 'Interim transcription appears here as you speak...';
                interimEl.classList.add('idle-hint');
                setStatus('Ready to record', 'Click orb or press Space');
                setStatus('Ready to record', 'Click orb or press Space');
                stopTimer();
                stopAudio();
                scheduleWorkspaceSave();
            }

            function forceStop() {
                state.isRecording = false;
                clearNoSpeechTimer();
                clearAutoCopyCountdown();
                autoCopyBtn.classList.remove('auto-copy-active');
                clearTimeout(state.restartTimeout); state.restartTimeout = null;
                try { if (recognition) recognition.abort(); } catch (e) { }
                if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                    try { state.mediaRecorder.stop(); } catch (e) { }
                }
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                stopTimer();
                stopAudio();
            }

            function scheduleRestart(delay = 50) {
                clearTimeout(state.restartTimeout);
                state.restartTimeout = setTimeout(() => {
                    state.restartTimeout = null;
                    if (state.isRecording && state.mode === 'realtime' && recognition) {
                        try {
                            const lang = langSelect.value;
                            recognition.lang = lang === 'auto' ? 'en-US' : lang;
                            recognition.start();
                        } catch (e) { }
                    }
                }, delay);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // NO-SPEECH / AUTO-COPY
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function setNoSpeechTimer() {
                clearNoSpeechTimer();
                state.noSpeechTimer = setTimeout(() => {
                    if (state.isRecording) {
                        statusSub.textContent = 'Waiting for speech...';
                        if (state.autoCopyEnabled && state.confirmedText.trim()) {
                            autoCopyBtn.classList.add('auto-copy-active');
                            startAutoCopyCountdown();
                        }
                    }
                }, 4000);
            }

            function clearNoSpeechTimer() {
                clearTimeout(state.noSpeechTimer);
                if (state.isRecording) statusSub.textContent = state.mode === 'quality' ? 'Speak now - tap the orb or press Space to stop' : 'Speak now - tap the orb or press Space to stop';
            }

            function startAutoCopyCountdown() {
                clearAutoCopyCountdown();
                if (!state.autoCopyEnabled || !state.isRecording) return;
                if (!state.confirmedText.trim()) return;

                autoCopyBar.classList.add('visible');
                autoCopyFill.style.width = '100%';
                const start = Date.now();

                state.autoCopyCountdown = setInterval(() => {
                    const elapsed = Date.now() - start;
                    const pct = Math.max(0, 100 - (elapsed / AUTO_COPY_DELAY) * 100);
                    autoCopyFill.style.width = pct + '%';
                    if (elapsed >= AUTO_COPY_DELAY) {
                        clearAutoCopyCountdown();
                        triggerAutoCopy();
                    }
                }, 80);
            }

            function clearAutoCopyCountdown() {
                clearInterval(state.autoCopyCountdown);
                state.autoCopyCountdown = null;
                autoCopyBar.classList.remove('visible');
                autoCopyFill.style.width = '100%';
            }

            function triggerAutoCopy() {
                const text = transcript.value.trim();
                if (!text) return;
                copyToClipboard(text, () => {
                    addToHistory(text);
                    saveUndo(transcript.value);
                    clearTranscript();
                    autoCopyBtn.classList.remove('auto-copy-active');
                    toast('Auto-copied & cleared', 'success');
                });
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // SMART PUNCTUATION
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function applySmartPunct(text, gapMs) {
                if (!state.smartPunctEnabled) return text;
                let result = text.trim();
                result = result.charAt(0).toUpperCase() + result.slice(1);
                if (state.confirmedText && gapMs > 0) {
                    const last = state.confirmedText.trimEnd();
                    const lastChar = last.slice(-1);
                    if (!/[.!?,;:\-]/.test(lastChar)) {
                        if (gapMs > 2000) {
                            state.confirmedText = last + '. ';
                            transcript.value = state.confirmedText;
                        } else if (gapMs > 700) {
                            state.confirmedText = last + ', ';
                            transcript.value = state.confirmedText;
                        }
                    }
                }
                return result;
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // SEGMENT & TRANSCRIPT
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
                if (state.segments.length > 1) {
                    const prev = state.segments[state.segments.length - 2];
                    if (!prev.endSec) prev.endSec = seg.startSec;
                }
                renderSegments();
                rebuildTranscriptFromSegments();
            }

            function parseTimeStr(ts) {
                const parts = ts.split(':');
                return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }

            function appendToTranscript(text) {
                if (!text) return;
                const now = Date.now();
                const gap = now - state.lastEndTime;
                const cur = transcript.value;
                let sep = '';
                if (cur && !cur.endsWith('\n')) {
                    sep = (gap > 2500 && state.lastEndTime > 0) ? '\n\n' : ' ';
                }
                transcript.value += sep + text;
                transcript.scrollTop = transcript.scrollHeight;
                updateStats();
            }

            function clearTranscript() {
                transcript.value = '';
                state.confirmedText = '';
                state.segments = [];
                state.detectedLanguage = '';
                state.fileHash = '';
                state.cacheKey = '';
                state.audioDurationSec = 0;
                segView.innerHTML = '';
                segCount.textContent = '0 segments';
                durStat.textContent = '0:00 duration';
                timerEl.textContent = '00:00';
                if (orbTimerDisplay) orbTimerDisplay.textContent = '00:00';
                detectedLangBadge.style.display = 'none';
                renderSegments();
                updateStats();
                scheduleWorkspaceSave();
            }

            function updateStats() {
                const raw = transcript.value.trim();
                const words = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
                const chars = raw.length;
                wordPill.textContent = words + ' word' + (words !== 1 ? 's' : '');
                charPill.textContent = chars + ' char' + (chars !== 1 ? 's' : '');
                wordPill.classList.toggle('active', words > 0);
                charPill.classList.toggle('active', chars > 0);
                sessionStorage.setItem('vt_ai_output', aiOutput?.value || '');
            }

            function escHtml(s) {
                return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // VIEW TOGGLE
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function switchView(v) {
                state.currentView = v;
                $('btnRaw').classList.toggle('active', v === 'raw');
                $('btnSeg').classList.toggle('active', v === 'segments');
                transcript.style.display = (v === 'raw') ? 'block' : 'none';
                segView.style.display = (v === 'segments') ? 'block' : 'none';
            }

            $('btnRaw').addEventListener('click', () => switchView('raw'));
            $('btnSeg').addEventListener('click', () => switchView('segments'));

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // MODE TOGGLE
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function setMode(mode) {
                if (state.isRecording) forceStop();
                state.mode = mode;

                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === mode);
                });

                uploadPanel.classList.toggle('visible', mode === 'file');
                recPanel.style.display = mode === 'file' ? 'none' : '';
                if (mode !== 'file') requestAnimationFrame(() => drawOrbFrame(0, false));

                if (mode === 'file') {
                    setStatus('File mode', 'Upload an audio file to transcribe');
                    waveOverlay.textContent = 'Orb preview pauses in file mode';
                } else if (mode === 'quality') {
                    setStatus('Ready to record', 'Quality mode - records, then sends to speech-to-text');
                    setStatus('Ready to record', 'Quality mode - records then sends to Whisper');
                    waveOverlay.textContent = 'Click the orb to record in quality mode';
                    setStatus('Ready to record', 'Quality mode - records, then sends to speech-to-text');
                } else {
                    setStatus('Ready to record', 'Click orb or press Space');
                    waveOverlay.textContent = 'Blue voice orb listens for live dictation';
                }
            }

            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', () => setMode(btn.dataset.mode));
            });

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // STATUS
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function setStatus(main, sub) {
                statusMain.textContent = normalizeUiText(main);
                statusSub.textContent = normalizeUiText(sub);
                if (orbStatusMain) orbStatusMain.textContent = normalizeUiText(main);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // TOAST
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function toast(msg, type = 'info', duration = 2400) {
                const container = $('toastContainer');
                const el = document.createElement('div');
                el.className = `toast ${type}`;
                el.textContent = normalizeUiText(msg);
                container.appendChild(el);
                setTimeout(() => {
                    el.classList.add('out');
                    setTimeout(() => el.remove(), 300);
                }, duration);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // CLIPBOARD
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function copyToClipboard(text, onSuccess) {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text).then(onSuccess).catch(() => legacyCopy(text, onSuccess));
                } else {
                    legacyCopy(text, onSuccess);
                }
            }

            function legacyCopy(text, onSuccess) {
                const el = document.createElement('textarea');
                el.value = text;
                el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                document.body.appendChild(el);
                el.focus();
                el.select();
                try { document.execCommand('copy'); onSuccess(); } catch (e) { toast('Copy failed', 'error'); }
                document.body.removeChild(el);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // UNDO / HISTORY
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function saveUndo(text) {
                state.undoBuffer = text;
                sessionStorage.setItem('vt_undo', text);
                undoIndicator.style.display = text ? 'flex' : 'none';
            }

            function addToHistory(text) {
                if (!text.trim()) return;
                state.copyHistory.unshift({
                    text,
                    preview: text.trim().slice(0, 120),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                if (state.copyHistory.length > 10) state.copyHistory.pop();
                sessionStorage.setItem('vt_history', JSON.stringify(state.copyHistory));
                renderHistory();
            }

            function renderHistory() {
                if (!state.copyHistory.length) {
                    historyList.innerHTML = '<div class="history-empty">No history yet - copied text will appear here</div>';
                    return;
                }
                historyList.innerHTML = state.copyHistory.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <div class="history-item-meta">${item.time}</div>
        <div class="history-item-preview">${escHtml(item.preview)}${item.text.length > 120 ? '...' : ''}</div>
        <button class="history-item-restore" data-index="${i}">Restore</button>
      </div>
    `).join('');

                historyList.querySelectorAll('.history-item-restore').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = parseInt(btn.dataset.index);
                        const item = state.copyHistory[idx];
                        if (item) {
                            transcript.value = item.text;
                            state.confirmedText = item.text;
                            updateStats();
                            toast('Restored from history', 'success');
                        }
                    });
                });
            }

            if (state.undoBuffer) undoIndicator.style.display = 'flex';
            renderHistory();

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // EXPORT HELPERS
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            function generateSRT() {
                return state.segments.map((seg, i) => {
                    const startSec = seg.startSec || 0;
                    const endSec = seg.endSec || (startSec + 5);
                    const line = state.speakerMode && seg.speaker ? `${seg.speaker}: ${seg.text}` : seg.text;
                    return `${i + 1}\n${formatTimestampFull(startSec)} --> ${formatTimestampFull(endSec)}\n${line}\n`;
                }).join('\n');
            }

            function generateVTT() {
                let vtt = 'WEBVTT\n\n';
                state.segments.forEach((seg) => {
                    const startSec = seg.startSec || 0;
                    const endSec = seg.endSec || (startSec + 5);
                    const line = state.speakerMode && seg.speaker ? `${seg.speaker}: ${seg.text}` : seg.text;
                    vtt += `${formatTimestampVTT(startSec)} --> ${formatTimestampVTT(endSec)}\n${line}\n\n`;
                });
                return vtt;
            }

            function generateJSON() {
                return JSON.stringify({
                    text: transcript.value,
                    aiOutput: aiOutput.value,
                    preset: state.preset,
                    language: state.detectedLanguage || '',
                    segments: state.segments.map(s => ({
                        start: s.startSec || 0,
                        end: s.endSec || 0,
                        text: s.text,
                        confidence: s.conf,
                        language: s.lang || '',
                        speaker: s.speaker || '',
                        locked: !!s.locked
                    })),
                    metadata: {
                        wordCount: transcript.value.trim().split(/\s+/).filter(Boolean).length,
                        exportedAt: new Date().toISOString(),
                        fileHash: state.fileHash || ''
                    }
                }, null, 2);
            }

            function generateMarkdown() {
                const title = `# Transcript Export\n\n- Preset: ${state.preset}\n- Language: ${state.detectedLanguage || 'UNKNOWN'}\n- Exported: ${new Date().toLocaleString()}\n\n## Transcript\n\n${transcript.value.trim() || '_Empty_'}\n`;
                const notes = aiOutput.value.trim() ? `\n## AI Output\n\n${aiOutput.value.trim()}\n` : '';
                const segments = state.segments.length ? `\n## Segments\n\n${state.segments.map(seg => `- [${seg.time}] ${seg.speaker ? `**${seg.speaker}:** ` : ''}${seg.text}`).join('\n')}\n` : '';
                return title + notes + segments;
            }

            function generateCSV() {
                const rows = [['index','start','end','speaker','confidence','language','text']];
                state.segments.forEach((seg, idx) => {
                    rows.push([
                        idx + 1,
                        seg.startSec || 0,
                        seg.endSec || 0,
                        seg.speaker || '',
                        typeof seg.conf === 'number' ? seg.conf.toFixed(3) : '',
                        seg.lang || '',
                        seg.text || ''
                    ]);
                });
                return rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
            }

            function generateWorkspaceJSON() {
                return JSON.stringify(getWorkspacePayload(), null, 2);
            }

            function downloadFile(content, filename, mime) {
                const blob = new Blob([content], { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }

            function updateTranscribeBtn() {
                const hasFile = !!state.uploadedFile;
                const hasKey = getProviderKeys().length > 0;
                transcribeBtn.disabled = !hasFile || !hasKey || state.isProcessing;
                if (!hasKey && hasFile) {
                    transcribeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> API key required';
                }
            }

            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / 1048576).toFixed(1) + ' MB';
            }
            function safeJsonParse(text, fallback = null) {
                try { return JSON.parse(text); } catch (e) { return fallback; }
            }

            function normalizeProviderKeyStore(rawStore) {
                const store = rawStore && typeof rawStore === 'object' ? rawStore : {};
                const normalizeList = value => Array.isArray(value)
                    ? [...new Set(value.map(v => String(v || '').trim()).filter(Boolean))]
                    : [];
                return {
                    groq: normalizeList(store.groq),
                    openai: normalizeList(store.openai),
                    gemini: normalizeList(store.gemini)
                };
            }

            function defaultAudioModel(provider) {
                return provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1';
            }

            function defaultChatModel(provider) {
                return provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
            }

            function defaultAssistantModelId() {
                return 'assistant:max';
            }

            function getGeminiAnalysisModelCatalog() {
                return [
                    {
                        value: 'gemini-2.5-flash-lite',
                        label: 'Gemini 2.5 Flash-Lite',
                        meta: 'Recommended for free-tier image/PDF analysis',
                        rpm: 15,
                        rpd: 1000
                    },
                    {
                        value: 'gemini-2.5-flash',
                        label: 'Gemini 2.5 Flash',
                        meta: 'Higher quality multimodal',
                        rpm: 10,
                        rpd: 250
                    },
                    {
                        value: 'gemini-2.5-pro',
                        label: 'Gemini 2.5 Pro',
                        meta: 'Paid Gemini key only',
                        rpm: 5,
                        rpd: 100
                    }
                ];
            }

            function defaultGeminiAnalysisModel() {
                return 'gemini-2.5-flash-lite';
            }

            function getAssistantModelCatalog() {
                return [
                    {
                        id: 'assistant:max',
                        provider: 'smart',
                        model: 'assistant:max',
                        label: 'Max',
                        meta: 'Smart routing for long output + latency',
                        supportsImages: true,
                        supportsPdf: true
                    },
                    {
                        id: 'groq:meta-llama/llama-4-scout-17b-16e-instruct',
                        provider: 'groq',
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                        label: 'Groq - Llama 4 Scout',
                        meta: 'Images + OCR',
                        supportsImages: true,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:meta-llama/llama-4-maverick-17b-128e-instruct',
                        provider: 'groq',
                        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
                        label: 'Groq - Llama 4 Maverick',
                        meta: 'Images + higher quality',
                        supportsImages: true,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:openai/gpt-oss-120b',
                        provider: 'groq',
                        model: 'openai/gpt-oss-120b',
                        label: 'Groq - GPT OSS 120B',
                        meta: 'Text only',
                        supportsImages: false,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:openai/gpt-oss-20b',
                        provider: 'groq',
                        model: 'openai/gpt-oss-20b',
                        label: 'Groq - GPT OSS 20B',
                        meta: 'Fast text',
                        supportsImages: false,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:moonshotai/kimi-k2-instruct',
                        provider: 'groq',
                        model: 'moonshotai/kimi-k2-instruct',
                        label: 'Groq - Kimi K2',
                        meta: 'Large context + analysis',
                        supportsImages: false,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:qwen/qwen3-32b',
                        provider: 'groq',
                        model: 'qwen/qwen3-32b',
                        label: 'Groq - Qwen3 32B',
                        meta: 'Reasoning + coding',
                        supportsImages: false,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:llama-3.3-70b-versatile',
                        provider: 'groq',
                        model: 'llama-3.3-70b-versatile',
                        label: 'Groq - Llama 3.3 70B Versatile',
                        meta: 'Strong general use',
                        supportsImages: false,
                        supportsPdf: false
                    },
                    {
                        id: 'groq:llama-3.1-8b-instant',
                        provider: 'groq',
                        model: 'llama-3.1-8b-instant',
                        label: 'Groq - Llama 3.1 8B Instant',
                        meta: 'Very fast replies',
                        supportsImages: false,
                        supportsPdf: false
                    },
                ];
            }

            function getAssistantProviderLabel(provider) {
                if (provider === 'gemini') return 'Gemini';
                if (provider === 'openai') return 'OpenAI';
                if (provider === 'smart') return 'Max';
                return 'Groq';
            }

            function getAssistantModelOption(id = state.assistant.model) {
                const catalog = getAssistantModelCatalog();
                return catalog.find(item => item.id === id) || catalog[0];
            }

            function getConfiguredGeminiAnalysisModel() {
                const catalog = getGeminiAnalysisModelCatalog();
                const matched = catalog.find(item => item.value === state.geminiAnalysisModel);
                return matched?.value || defaultGeminiAnalysisModel();
            }

            function getConfiguredGeminiAnalysisOption() {
                const model = getConfiguredGeminiAnalysisModel();
                const catalog = getGeminiAnalysisModelCatalog();
                const matched = catalog.find(item => item.value === model) || catalog[0];
                return {
                    id: `gemini:${matched.value}`,
                    provider: 'gemini',
                    model: matched.value,
                    label: `Gemini - ${matched.label.replace(/^Gemini\s*/i, '')}`,
                    meta: matched.meta,
                    supportsImages: true,
                    supportsPdf: true,
                    configured: true
                };
            }

            function findAssistantCatalogOption(id) {
                return getAssistantModelCatalog().find(item => item.id === id) || null;
            }

            function isLongOutputAssistantRequest(text = '') {
                const normalized = String(text || '').trim().toLowerCase();
                if (!normalized) return false;
                if (normalized.length > 280) return true;
                return /(complete implementation|full implementation|full code|complete code|long output|detailed document|detailed explanation|comprehensive|entire file|full api|full project|2000|1500|report|documentation|generate code|generate a project|rest api|express\.js|fastapi|without truncating|all sections)/i.test(normalized);
            }

            function isContextHeavyAssistantRequest(text = '') {
                return /(analyze|architecture|design|refactor|plan|compare|research|large context|codebase|workflow|system design)/i.test(String(text || ''));
            }

            function isQuickAssistantRequest(text = '') {
                return /(quick|brief|short|one line|fast answer|summarize quickly|tl;dr)/i.test(String(text || ''));
            }

            function resolveMaxAssistantModel(attachments = null, text = '') {
                const normalizedAttachments = normalizeAssistantAttachmentList(attachments);
                if (normalizedAttachments.length) {
                    if (getProviderKeys('gemini').length) {
                        return getConfiguredGeminiAnalysisOption();
                    }
                    return findAssistantCatalogOption('groq:meta-llama/llama-4-scout-17b-16e-instruct') || getAssistantModelCatalog()[0];
                }
                if (isLongOutputAssistantRequest(text)) {
                    return findAssistantCatalogOption('groq:llama-3.3-70b-versatile') || getAssistantModelCatalog()[0];
                }
                if (isContextHeavyAssistantRequest(text)) {
                    return findAssistantCatalogOption('groq:moonshotai/kimi-k2-instruct')
                        || findAssistantCatalogOption('groq:qwen/qwen3-32b')
                        || getAssistantModelCatalog()[0];
                }
                if (isQuickAssistantRequest(text)) {
                    return findAssistantCatalogOption('groq:llama-3.1-8b-instant')
                        || findAssistantCatalogOption('groq:openai/gpt-oss-20b')
                        || getAssistantModelCatalog()[0];
                }
                return findAssistantCatalogOption('groq:llama-3.3-70b-versatile')
                    || findAssistantCatalogOption('groq:openai/gpt-oss-120b')
                    || getAssistantModelCatalog()[0];
            }

            function persistGeminiUsage() {
                localStorage.setItem('vt_gemini_usage', JSON.stringify(state.geminiUsage || {}));
            }

            function getGeminiUsageEntry(model = getConfiguredGeminiAnalysisModel()) {
                const now = Date.now();
                const today = new Date().toISOString().slice(0, 10);
                const existing = state.geminiUsage?.[model] && typeof state.geminiUsage[model] === 'object'
                    ? { ...state.geminiUsage[model] }
                    : {};
                const minuteWindowStart = now - Number(existing.minuteWindowStart || 0) < 60000
                    ? Number(existing.minuteWindowStart || now)
                    : now;
                const minuteCount = now - Number(existing.minuteWindowStart || 0) < 60000
                    ? Math.max(0, Number(existing.minuteCount || 0))
                    : 0;
                const dayKey = existing.dayKey === today ? today : today;
                const dayCount = existing.dayKey === today
                    ? Math.max(0, Number(existing.dayCount || 0))
                    : 0;
                const normalized = { minuteWindowStart, minuteCount, dayKey, dayCount };
                state.geminiUsage = { ...(state.geminiUsage || {}), [model]: normalized };
                return normalized;
            }

            function recordGeminiUsage(model = getConfiguredGeminiAnalysisModel()) {
                const entry = getGeminiUsageEntry(model);
                entry.minuteCount += 1;
                entry.dayCount += 1;
                state.geminiUsage = { ...(state.geminiUsage || {}), [model]: entry };
                persistGeminiUsage();
                renderGeminiUsageMeter();
            }

            function resetGeminiUsage(model = getConfiguredGeminiAnalysisModel()) {
                const today = new Date().toISOString().slice(0, 10);
                state.geminiUsage = {
                    ...(state.geminiUsage || {}),
                    [model]: {
                        minuteWindowStart: Date.now(),
                        minuteCount: 0,
                        dayKey: today,
                        dayCount: 0
                    }
                };
                persistGeminiUsage();
                renderGeminiUsageMeter();
            }

            function renderGeminiUsageMeter() {
                const model = getConfiguredGeminiAnalysisModel();
                const quota = getGeminiAnalysisModelCatalog().find(item => item.value === model) || { rpm: 15, rpd: 1000, label: model };
                const entry = getGeminiUsageEntry(model);
                persistGeminiUsage();
                const minuteUsed = Math.max(0, Number(entry.minuteCount || 0));
                const dayUsed = Math.max(0, Number(entry.dayCount || 0));
                const minuteLimit = Math.max(1, Number(quota.rpm || 1));
                const dayLimit = Math.max(1, Number(quota.rpd || 1));
                const minutePct = Math.min(100, (minuteUsed / minuteLimit) * 100);
                const dayPct = Math.min(100, (dayUsed / dayLimit) * 100);
                if (geminiUsageTitle) geminiUsageTitle.textContent = `${quota.label} usage`;
                if (geminiUsageMinuteText) geminiUsageMinuteText.textContent = `${minuteUsed} / ${minuteLimit} used | ${Math.max(0, minuteLimit - minuteUsed)} left`;
                if (geminiUsageDayText) geminiUsageDayText.textContent = `${dayUsed} / ${dayLimit} used | ${Math.max(0, dayLimit - dayUsed)} left`;
                if (geminiUsageMinuteBar) geminiUsageMinuteBar.style.width = `${minutePct}%`;
                if (geminiUsageDayBar) geminiUsageDayBar.style.width = `${dayPct}%`;
                if (geminiUsageNote) geminiUsageNote.textContent = 'Tracked from this app only. External Gemini usage is not included.';
            }

            function getActiveAssistantModelOption() {
                return getAssistantModelOption(state.assistant.model);
            }

            function getActiveAssistantProvider() {
                return getActiveAssistantModelOption().provider;
            }

            function getActiveAssistantModel() {
                return getActiveAssistantModelOption().model;
            }

            function assistantAttachmentAccept(option = getActiveAssistantModelOption()) {
                const textAccept = 'text/plain,.txt,text/markdown,.md,text/csv,.csv,application/json,.json';
                const activeOption = option || getActiveAssistantModelOption();
                if (getProviderKeys('gemini').length) return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
                if (!activeOption) return textAccept;
                if (activeOption.supportsPdf) return `image/png,image/jpeg,image/webp,application/pdf,.pdf,${textAccept}`;
                if (activeOption.supportsImages) return `image/png,image/jpeg,image/webp,${textAccept}`;
                return textAccept;
            }

            function attachmentKindFromMimeType(mimeType = '') {
                const normalized = String(mimeType || '').toLowerCase();
                if (normalized === 'application/pdf') return 'pdf';
                if (normalized.startsWith('image/')) return 'image';
                return 'text';
            }

            function inferAttachmentMimeType(file) {
                const type = String(file?.type || '').trim().toLowerCase();
                if (type) return type;
                const name = String(file?.name || '').toLowerCase();
                if (name.endsWith('.pdf')) return 'application/pdf';
                if (name.endsWith('.png')) return 'image/png';
                if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
                if (name.endsWith('.webp')) return 'image/webp';
                if (name.endsWith('.md')) return 'text/markdown';
                if (name.endsWith('.txt')) return 'text/plain';
                if (name.endsWith('.csv')) return 'text/csv';
                if (name.endsWith('.json')) return 'application/json';
                return '';
            }

            function canAssistantModelUseAttachment(option, attachment) {
                const attachments = normalizeAssistantAttachmentList(attachment);
                if (!option || !attachments.length) return true;
                const hasPdf = attachments.some(item => item.kind === 'pdf');
                const hasText = attachments.some(item => item.kind === 'text');
                if (hasPdf) return !!option.supportsPdf;
                if (hasText) return true;
                return !!option.supportsImages;
            }

            function getAssistantOptionForRequest(attachment = null, text = '') {
                const attachments = normalizeAssistantAttachmentList(attachment);
                const activeOption = getActiveAssistantModelOption();
                if (activeOption.id === 'assistant:max') {
                    return resolveMaxAssistantModel(attachments, text);
                }
                if (!attachments.length) return activeOption;
                if (getProviderKeys('gemini').length) {
                    return getConfiguredGeminiAnalysisOption();
                }
                const hasPdf = attachments.some(item => item.kind === 'pdf');
                if (hasPdf) return getConfiguredGeminiAnalysisOption();
                return activeOption;
            }

            function setAssistantModel(value, options = {}) {
                const next = getAssistantModelOption(value);
                state.assistant.model = next.id;
                localStorage.setItem('vt_assistant_model', state.assistant.model);
                if (!options.skipAttachmentCheck && state.assistant.pendingAttachment && !canAssistantModelUseAttachment(next, state.assistant.pendingAttachment)) {
                    clearAssistantAttachment({ silent: true });
                    toast(next.supportsPdf
                        ? 'Pending attachment cleared because the selected model changed.'
                        : 'Selected model does not support the pending attachment. Attachment cleared.', 'info', 3200);
                }
                if (!options.skipRender) renderAssistantComposer();
            }

            function populateAssistantModelControls() {
                const catalog = getAssistantModelCatalog();
                const recommended = getAssistantModelOption(defaultAssistantModelId());
                const optionMarkup = [
                    `<option value="${recommended.id}">Recommended - ${recommended.label}</option>`,
                    ...catalog
                        .filter(item => item.id !== recommended.id)
                        .map(item => `<option value="${item.id}">${item.label} - ${item.meta}</option>`)
                ].join('');
                if (assistantModelSelect) assistantModelSelect.innerHTML = optionMarkup;
                if (!state.assistant.model || !catalog.some(item => item.id === state.assistant.model)) {
                    state.assistant.model = recommended.id;
                    localStorage.setItem('vt_assistant_model', state.assistant.model);
                }
                if (assistantModelSelect) assistantModelSelect.value = state.assistant.model;
            }

            function populateGeminiModelControls() {
                const catalog = getGeminiAnalysisModelCatalog();
                const active = getConfiguredGeminiAnalysisModel();
                const optionMarkup = [
                    `<option value="${defaultGeminiAnalysisModel()}">Recommended - Gemini 2.5 Flash-Lite</option>`,
                    ...catalog
                        .filter(item => item.value !== defaultGeminiAnalysisModel())
                        .map(item => `<option value="${item.value}">${item.label} - ${item.meta}</option>`)
                ].join('');
                state.geminiAnalysisModel = active;
                localStorage.setItem('vt_gemini_analysis_model', active);
                if (geminiModelSelect) geminiModelSelect.innerHTML = optionMarkup;
                if (geminiModelSelect) geminiModelSelect.value = active;
                renderGeminiUsageMeter();
            }

            function getChatModelCatalog(provider) {
                if (provider === 'groq') {
                    return [
                        { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', meta: 'Balanced reasoning' },
                        { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', meta: 'Fast + low cost' },
                        { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2', meta: 'Large context' },
                        { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', meta: 'Multimodal + fast' },
                        { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick', meta: 'High quality' },
                        { value: 'qwen/qwen3-32b', label: 'Qwen3 32B', meta: 'Reasoning + coding' },
                        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', meta: 'Strong general use' },
                        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', meta: 'Very fast replies' }
                    ];
                }
                return [
                    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', meta: 'Recommended' },
                    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', meta: 'Sharper reasoning' }
                ];
            }

            function getActiveChatModel() {
                return (state.chatModel || defaultChatModel(state.apiProvider)).trim();
            }

            function syncChatModelSelectors() {
                const active = getActiveChatModel();
                const catalog = getChatModelCatalog(state.apiProvider);
                const matched = catalog.some(item => item.value === active)
                    ? active
                    : defaultChatModel(state.apiProvider);
                if (chatModelSelect) chatModelSelect.value = matched;
                if (assistantModelSelect) assistantModelSelect.value = state.assistant.model;
            }

            function populateChatModelControls() {
                const catalog = getChatModelCatalog(state.apiProvider);
                const defaultValue = defaultChatModel(state.apiProvider);
                const optionMarkup = [
                    `<option value="${defaultValue}">Recommended - ${defaultValue}</option>`,
                    ...catalog
                        .filter(item => item.value !== defaultValue)
                        .map(item => `<option value="${item.value}">${item.label} - ${item.value}</option>`),
                ].join('');
                if (chatModelSelect) chatModelSelect.innerHTML = optionMarkup;
                if (chatModelSuggestions) {
                    chatModelSuggestions.innerHTML = catalog
                        .map(item => `<option value="${item.value}"></option>`)
                        .join('');
                }
                syncChatModelSelectors();
            }

            function setChatModel(value, options = {}) {
                const next = String(value || '').trim();
                state.chatModel = next;
                localStorage.setItem('vt_chat_model', state.chatModel);
                if (chatModelInput && chatModelInput.value !== next) chatModelInput.value = next;
                syncChatModelSelectors();
                if (!options.skipRender) renderAssistantMessages();
                if (!options.skipSave) scheduleWorkspaceSave();
            }

            function getApiModel() {
                return (state.audioModel || defaultAudioModel(state.apiProvider)).trim();
            }

            function getEffectiveAudioModel(options = {}) {
                if (state.apiProvider === 'groq' && options.translate) {
                    return 'whisper-large-v3';
                }
                return getApiModel();
            }

            function getProviderKeys(provider = state.apiProvider) {
                state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
                const vault = Array.isArray(state.providerKeys?.[provider]) ? state.providerKeys[provider].filter(Boolean) : [];
                const apiKey = provider === state.apiProvider ? (state.apiKey || '').trim() : '';
                if (apiKey && !vault.includes(apiKey)) return [apiKey, ...vault];
                return vault;
            }

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

            function getGeminiGenerateEndpoint(model) {
                return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
            }

            function getGeminiUploadEndpoint() {
                return 'https://generativelanguage.googleapis.com/upload/v1beta/files';
            }

            function persistProviderStore() {
                state.providerKeys = normalizeProviderKeyStore(state.providerKeys);
                localStorage.setItem('vt_provider_keys', JSON.stringify(state.providerKeys || { groq: [], openai: [], gemini: [] }));
            }

            function updateProviderVaultMeta(provider, element) {
                if (!element) return;
                const count = (state.providerKeys?.[provider] || []).filter(Boolean).length;
                element.textContent = count ? `${count} key${count > 1 ? 's' : ''} stored for ${provider}` : `No keys stored for ${provider}`;
            }

            function updateVaultMeta() {
                updateProviderVaultMeta(state.apiProvider, apiVaultMeta);
                updateProviderVaultMeta('gemini', geminiVaultMeta);
            }

            function setCacheStatus(message) {
                cacheStatus.textContent = message || 'Cache idle';
            }

            function updateDiagnostics(patch = {}, logLine = '') {
                state.diagnostics = { ...(state.diagnostics || {}), ...(patch || {}), updatedAt: new Date().toISOString() };
                sessionStorage.setItem('vt_diag', JSON.stringify(state.diagnostics));
                const entries = [
                    ['Provider', state.diagnostics.provider || state.apiProvider || 'UNKNOWN'],
                    ['Audio model', state.diagnostics.audioModel || getApiModel() || 'UNKNOWN'],
                    ['Audio task', state.diagnostics.audioTask || 'transcribe'],
                    ['Chat model', state.diagnostics.chatModel || getActiveChatModel() || 'UNKNOWN'],
                    ['Preset', state.diagnostics.preset || state.preset || 'UNKNOWN'],
                    ['Detected lang', state.detectedLanguage || state.diagnostics.detectedLanguage || 'UNKNOWN'],
                    ['Segments', String(state.segments?.length || 0)],
                    ['Duration', state.audioDurationSec ? `${state.audioDurationSec.toFixed(1)}s` : 'UNKNOWN'],
                    ['Retries', String(state.diagnostics.retries || 0)],
                    ['Cache', state.diagnostics.cacheHit ? 'HIT' : (state.diagnostics.cacheKey ? 'READY' : 'MISS')],
                    ['File hash', state.fileHash || state.diagnostics.fileHash || 'UNKNOWN']
                ];
                diagGrid.innerHTML = entries.map(([label, value]) => `<div class="diag-card"><div class="diag-label">${escapeHtml(label)}</div><div class="diag-value">${escapeHtml(String(value))}</div></div>`).join('');
                if (logLine) {
                    const ts = new Date().toLocaleTimeString();
                    diagLog.value = `[${ts}] ${logLine}\n` + (diagLog.value || '');
                }
            }

            function escapeHtml(v) {
                return String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
            }

            function parseGlossary() {
                return (state.glossaryRaw || '')
                    .split(/\n+/)
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(line => {
                        const parts = line.split(/=>|->|→/).map(s => s.trim());
                        return parts.length >= 2 ? { from: parts[0], to: parts.slice(1).join(' => ') } : null;
                    })
                    .filter(Boolean);
            }

            function applyGlossaryToText(text = '') {
                let out = String(text || '');
                for (const rule of parseGlossary()) {
                    if (!rule.from) continue;
                    const escaped = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), rule.to);
                }
                return out;
            }

            function cleanTranscriptLocal(text = '') {
                let out = String(text || '').replace(/\r/g, '');
                out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
                out = out.split('\n').map(s => s.trimEnd()).join('\n').trim();
                return applyGlossaryToText(out);
            }

            function redactSensitiveText(text = '') {
                return String(text || '')
                    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
                    .replace(/\b(?:\+?\d[\d\s-]{7,}\d)\b/g, '[REDACTED_PHONE]')
                    .replace(/\b(?:sk|gsk|rk|api)[-_][A-Za-z0-9_-]{10,}\b/gi, '[REDACTED_KEY]');
            }

            function normalizeSegment(seg = {}, idx = 0) {
                const startSec = Number.isFinite(seg.startSec) ? seg.startSec : (Number.isFinite(seg.start) ? seg.start : idx * 3);
                const endSec = Number.isFinite(seg.endSec) ? seg.endSec : (Number.isFinite(seg.end) ? seg.end : null);
                return {
                    id: seg.id || `seg_${Date.now()}_${idx}`,
                    text: applyGlossaryToText((seg.text || '').trim()),
                    conf: typeof seg.conf === 'number' ? seg.conf : (typeof seg.confidence === 'number' ? seg.confidence : 0.85),
                    time: seg.time || formatTimestamp(startSec || 0),
                    lang: seg.lang || seg.language || '',
                    created: seg.created || Date.now(),
                    startSec: startSec || 0,
                    endSec,
                    speaker: seg.speaker || '',
                    locked: !!seg.locked
                };
            }

            function confidenceClass(conf) {
                if (conf >= 0.85) return 'high';
                if (conf >= 0.6) return 'mid';
                return 'low';
            }

            function syncSegmentTimes() {
                state.segments.forEach((seg, idx) => {
                    seg.time = formatTimestamp(seg.startSec || 0);
                    if (idx < state.segments.length - 1 && !Number.isFinite(seg.endSec)) {
                        seg.endSec = state.segments[idx + 1].startSec || null;
                    }
                });
                if (state.segments.length) {
                    const last = state.segments[state.segments.length - 1];
                    if (!Number.isFinite(last.endSec)) last.endSec = state.audioDurationSec || ((last.startSec || 0) + 3);
                }
            }

            function renderSegments() {
                syncSegmentTimes();
                if (!state.segments.length) {
                    segView.innerHTML = '<div class="empty-state">No segments yet. Use live dictation or file transcription first.</div>';
                    updateStats();
                    return;
                }
                segView.innerHTML = '';
                state.segments.forEach((seg, idx) => {
                    const wrap = document.createElement('div');
                    wrap.className = 'segment editable';
                    wrap.dataset.index = idx;
                    wrap.innerHTML = `
                        <div class="segment-top">
                            <button class="seg-time-btn" data-act="seek">${escapeHtml(seg.time)}</button>
                            <span class="seg-badge">${escapeHtml(seg.lang || 'UNSET')}</span>
                            <span class="seg-conf ${confidenceClass(seg.conf)}">${Math.round((seg.conf || 0) * 100)}%</span>
                            <button class="seg-lock ${seg.locked ? 'locked' : ''}" data-act="lock">${seg.locked ? 'Locked' : 'Lock'}</button>
                        </div>
                        <div class="seg-actions">
                            <select class="seg-speaker" data-act="speaker">
                                <option value="" ${!seg.speaker ? 'selected' : ''}>No speaker</option>
                                <option value="Speaker A" ${seg.speaker === 'Speaker A' ? 'selected' : ''}>Speaker A</option>
                                <option value="Speaker B" ${seg.speaker === 'Speaker B' ? 'selected' : ''}>Speaker B</option>
                                <option value="Speaker C" ${seg.speaker === 'Speaker C' ? 'selected' : ''}>Speaker C</option>
                                <option value="Narrator" ${seg.speaker === 'Narrator' ? 'selected' : ''}>Narrator</option>
                            </select>
                            <button class="seg-action" data-act="split">Split</button>
                            <button class="seg-action" data-act="merge-up" ${idx === 0 ? 'disabled' : ''}>Merge Up</button>
                            <button class="seg-action warn" data-act="delete">Delete</button>
                        </div>
                        <textarea class="seg-editor" ${seg.locked ? 'readonly' : ''}>${escapeHtml(seg.text)}</textarea>
                    `;
                    const editor = wrap.querySelector('.seg-editor');
                    editor.addEventListener('input', () => {
                        if (state.segments[idx].locked) return;
                        state.segments[idx].text = editor.value;
                        rebuildTranscriptFromSegments();
                    });
                    wrap.querySelector('[data-act="speaker"]').addEventListener('change', (e) => {
                        state.segments[idx].speaker = e.target.value;
                        rebuildTranscriptFromSegments();
                    });
                    wrap.querySelector('[data-act="seek"]').addEventListener('click', () => {
                        if (fileAudioPlayer && fileAudioPlayer.src) {
                            fileAudioPlayer.currentTime = state.segments[idx].startSec || 0;
                            fileAudioPlayer.play().catch(() => {});
                        } else {
                            toast(`Segment starts at ${state.segments[idx].time}`, 'info');
                        }
                    });
                    wrap.querySelector('[data-act="lock"]').addEventListener('click', () => {
                        state.segments[idx].locked = !state.segments[idx].locked;
                        renderSegments();
                        rebuildTranscriptFromSegments();
                    });
                    wrap.querySelector('[data-act="split"]').addEventListener('click', () => {
                        if (state.segments[idx].locked) return;
                        const txt = state.segments[idx].text || '';
                        const parts = txt.split(/(?<=[.!?])\s+/);
                        if (parts.length < 2) { toast('Nothing obvious to split here', 'info'); return; }
                        const first = parts.shift();
                        const second = parts.join(' ');
                        const base = state.segments[idx];
                        const mid = (Number(base.startSec || 0) + Number(base.endSec || (base.startSec || 0) + 2)) / 2;
                        state.segments.splice(idx, 1,
                            normalizeSegment({ ...base, text: first, endSec: mid }, idx),
                            normalizeSegment({ ...base, text: second, startSec: mid, time: formatTimestamp(mid), id: '' }, idx + 1)
                        );
                        renderSegments();
                        rebuildTranscriptFromSegments();
                    });
                    wrap.querySelector('[data-act="merge-up"]').addEventListener('click', () => {
                        if (idx === 0) return;
                        const prev = state.segments[idx - 1];
                        prev.text = `${prev.text} ${state.segments[idx].text}`.trim();
                        prev.endSec = state.segments[idx].endSec;
                        state.segments.splice(idx, 1);
                        renderSegments();
                        rebuildTranscriptFromSegments();
                    });
                    wrap.querySelector('[data-act="delete"]').addEventListener('click', () => {
                        state.segments.splice(idx, 1);
                        renderSegments();
                        rebuildTranscriptFromSegments();
                    });
                    segView.appendChild(wrap);
                });
                updateStats();
                scheduleWorkspaceSave();
            }

            function rebuildTranscriptFromSegments(keepCursor = false) {
                syncSegmentTimes();
                const text = state.segments.map(seg => {
                    const speaker = state.speakerMode && seg.speaker ? `${seg.speaker}: ` : '';
                    return `${speaker}${seg.text}`.trim();
                }).filter(Boolean).join('\n\n');
                transcript.value = cleanTranscriptLocal(text);
                state.confirmedText = transcript.value;
                updateStats();
                if (!keepCursor) transcript.scrollTop = 0;
                scheduleWorkspaceSave();
            }

            function getWorkspacePayload() {
                return {
                    version: 2,
                    savedAt: new Date().toISOString(),
                    mode: state.mode,
                    preset: state.preset,
                    transcript: transcript.value,
                    aiOutput: aiOutput.value,
                    segments: state.segments,
                    detectedLanguage: state.detectedLanguage,
                    speakerMode: state.speakerMode,
                    glossaryRaw: state.glossaryRaw,
                    memoryRaw: state.memoryRaw,
                    memoryImportedAt: state.memoryImportedAt,
                    memoryPacks: state.memoryPacks,
                    activeMemoryPackId: state.activeMemoryPackId,
                    outputStyle: state.outputStyle,
                    diagnostics: state.diagnostics,
                    fileHash: state.fileHash,
                    audioDurationSec: state.audioDurationSec,
                    provider: state.apiProvider,
                    audioModel: state.audioModel,
                    chatModel: state.chatModel
                };
            }

            function writeWorkspaceToStorage() {
                const payload = getWorkspacePayload();
                localStorage.setItem('vt_workspace_v2', JSON.stringify(payload));
                workspaceStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
            }

            function restoreWorkspaceIfAny() {
                const payload = safeJsonParse(localStorage.getItem('vt_workspace_v2') || '', null);
                if (!payload) {
                    workspaceStatus.textContent = 'No saved workspace';
                    return;
                }
                state.mode = payload.mode || state.mode;
                state.preset = payload.preset || state.preset;
                presetSelect.value = state.preset;
                state.speakerMode = !!payload.speakerMode;
                speakerModeToggle.classList.toggle('on', state.speakerMode);
                transcript.value = payload.transcript || '';
                state.confirmedText = transcript.value;
                aiOutput.value = payload.aiOutput || '';
                state.aiOutput = aiOutput.value;
                state.segments = Array.isArray(payload.segments) ? payload.segments.map((seg, idx) => normalizeSegment(seg, idx)) : [];
                state.detectedLanguage = payload.detectedLanguage || '';
                state.memoryRaw = normalizeImportedMemory(payload.memoryRaw || state.memoryRaw || '');
                state.memoryImportedAt = payload.memoryImportedAt || state.memoryImportedAt || '';
                state.memoryPacks = normalizeMemoryPacks(payload.memoryPacks || state.memoryPacks || []);
                state.activeMemoryPackId = payload.activeMemoryPackId || state.activeMemoryPackId || state.memoryPacks[0]?.id || '';
                state.outputStyle = payload.outputStyle || state.outputStyle || 'default';
                syncActiveMemoryPackState();
                state.diagnostics = payload.diagnostics || state.diagnostics || {};
                state.fileHash = payload.fileHash || '';
                state.audioDurationSec = Number(payload.audioDurationSec || 0);
                persistMemoryStore();
                renderMemoryUi();
                setMode(state.mode || 'realtime');
                renderSegments();
                if (!state.segments.length) updateStats();
                workspaceStatus.textContent = `Restored ${new Date(payload.savedAt || Date.now()).toLocaleString()}`;
                if (state.fileHash) setCacheStatus(`Workspace restored for ${state.fileHash.slice(0, 12)}...`);
            }

            function scheduleWorkspaceSave() {
                if (!state.autosaveEnabled) return;
                clearTimeout(state.workspaceSaveTimer);
                state.workspaceSaveTimer = setTimeout(writeWorkspaceToStorage, 350);
            }

            function buildTranscriptCacheKey(hash, options = {}) {
                return [
                    hash,
                    state.apiProvider || 'unknown',
                    options.translate ? 'translate' : 'transcribe',
                    options.language || 'auto',
                    options.model || getApiModel(),
                    options.normalize ? 'norm' : 'raw'
                ].join('::');
            }

            function transcriptCacheKey(key) { return `vt_tc::${key}`; }
            function partialKey(key) { return `${transcriptCacheKey(key)}::partial`; }
            function readTranscriptCache(key) { return safeJsonParse(localStorage.getItem(transcriptCacheKey(key)) || '', null); }
            function saveTranscriptCache(key, payload) { localStorage.setItem(transcriptCacheKey(key), JSON.stringify(payload)); }
            function readPartialProgress(key) { return safeJsonParse(localStorage.getItem(partialKey(key)) || '', null); }
            function savePartialProgress(key, payload) { localStorage.setItem(partialKey(key), JSON.stringify(payload)); }
            function clearPartialProgress(key) { localStorage.removeItem(partialKey(key)); }

            async function hashArrayBuffer(arrayBuf) {
                const hash = await crypto.subtle.digest('SHA-256', arrayBuf);
                return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            async function requestWithProvider({
                provider = state.apiProvider,
                url,
                buildBody,
                responseType = 'json',
                signal,
                purpose = 'request',
                maxRetries = 2,
                extraHeaders = null,
                syncPrimaryKey = provider === state.apiProvider
            }) {
                const keys = getProviderKeys(provider);
                if (!keys.length) throw new Error(provider === 'gemini' ? 'No Gemini API key configured' : 'No API key configured');
                let lastErr = null;
                for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                    const apiKey = keys[keyIndex];
                    for (let attempt = 0; attempt <= maxRetries; attempt++) {
                        let body = buildBody();
                        const headers = provider === 'gemini'
                            ? { 'x-goog-api-key': apiKey }
                            : { 'Authorization': 'Bearer ' + apiKey };
                        if (extraHeaders) Object.assign(headers, extraHeaders);
                        if (typeof body === 'string') headers['Content-Type'] = 'application/json';
                        try {
                            const resp = await fetch(url, { method: 'POST', headers, body, signal });
                            if (resp.ok) {
                                if (syncPrimaryKey && provider === state.apiProvider && apiKey !== state.apiKey) {
                                    state.apiKey = apiKey;
                                    localStorage.setItem('vt_api_key', apiKey);
                                    apiKeyInput.value = apiKey;
                                }
                                const diagPatch = { provider, retries: attempt, cacheKey: state.cacheKey || '' };
                                if (purpose === 'transcribe-audio') {
                                    diagPatch.audioModel = getEffectiveAudioModel({ translate: false });
                                    diagPatch.audioTask = 'transcribe';
                                } else if (purpose === 'translate-audio') {
                                    diagPatch.audioModel = getEffectiveAudioModel({ translate: true });
                                    diagPatch.audioTask = 'translate-en';
                                } else if (purpose === 'api-test') {
                                    diagPatch.audioModel = getEffectiveAudioModel();
                                    diagPatch.audioTask = 'api-test';
                                }
                                updateDiagnostics(diagPatch, `${purpose} success via key ${keyIndex + 1}`);
                                if (responseType === 'response') return resp;
                                return responseType === 'json' ? await resp.json() : await resp.text();
                            }
                            const rawError = await resp.text().catch(() => '');
                            const err = safeJsonParse(rawError, null);
                            const message = err?.error?.message || err?.message || rawError || `API error ${resp.status}`;
                            const retryable = resp.status === 429 || resp.status >= 500;
                            lastErr = new Error(message);
                            if (!retryable || attempt >= maxRetries) break;
                            const wait = Math.min(4000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
                            updateDiagnostics({ provider, retries: attempt + 1 }, `${purpose} retry ${attempt + 1} after ${resp.status}`);
                            await new Promise(r => setTimeout(r, wait));
                        } catch (err) {
                            lastErr = err;
                            if (signal?.aborted) throw err;
                            if (attempt >= maxRetries) break;
                            const wait = Math.min(4000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
                            updateDiagnostics({ provider, retries: attempt + 1 }, `${purpose} network retry ${attempt + 1}`);
                            await new Promise(r => setTimeout(r, wait));
                        }
                    }
                }
                throw lastErr || new Error('Provider request failed');
            }

            async function providerRequest({ url, buildBody, responseType = 'json', signal, purpose = 'request', maxRetries = 2 }) {
                return requestWithProvider({
                    provider: state.apiProvider,
                    url,
                    buildBody,
                    responseType,
                    signal,
                    purpose,
                    maxRetries
                });
            }

            async function callChatModel(task, rawText, { button } = {}) {
                const text = String(rawText || '').trim();
                if (!text) { toast('Transcript is empty', 'warning'); return; }
                const keys = getProviderKeys();
                if (!keys.length) { toast('API key required', 'warning'); return; }
                const model = getActiveChatModel();
                const importedMemory = getImportedMemoryContext({ maxChars: 9000 });
                const styleInstruction = getOutputStyleInstruction();
                if (button) button.disabled = true;
                state.aiBusy = true;
                try {
                    const result = await providerRequest({
                        url: getChatEndpoint(),
                        responseType: 'json',
                        purpose: task?.name || 'chat-task',
                        buildBody: () => JSON.stringify({
                            model,
                            temperature: 0.2,
                            messages: [
                                { role: 'system', content: task.system },
                                { role: 'system', content: `Current output style: ${styleInstruction}` },
                                ...(importedMemory ? [{
                                    role: 'system',
                                    content: `${getTaskMemoryGuidance(task?.name)}\n\n${importedMemory}`
                                }] : []),
                                { role: 'user', content: `${task.user}\n\nTranscript:\n${text}` }
                            ]
                        }),
                        maxRetries: 2
                    });
                    const out = normalizeAssistantText(result?.choices?.[0]?.message?.content || '');
                    aiOutput.value = out.trim();
                    state.aiOutput = aiOutput.value;
                    sessionStorage.setItem('vt_ai_output', state.aiOutput);
                    updateDiagnostics({ chatModel: model }, `${task?.name || 'chat-task'} complete`);
                    scheduleWorkspaceSave();
                    toast(task?.doneMessage || 'AI output ready', 'success');
                } catch (err) {
                    toast(err.message || 'AI request failed', 'error');
                } finally {
                    state.aiBusy = false;
                    if (button) button.disabled = false;
                }
            }

            async function askTranscriptQuestion(question, { button } = {}) {
                const transcriptText = String(transcript?.value || '').trim();
                const prompt = String(question || '').trim();
                if (!transcriptText) { toast('Transcript is empty', 'warning'); return; }
                if (!prompt) { toast('Ask a transcript question first', 'warning'); return; }
                if (!getProviderKeys().length) { toast('API key required', 'warning'); return; }
                const model = getActiveChatModel();
                const importedMemory = getImportedMemoryContext({ maxChars: 9000 });
                const activePack = getActiveMemoryPack();
                if (button) button.disabled = true;
                state.aiBusy = true;
                try {
                    const result = await providerRequest({
                        url: getChatEndpoint(),
                        responseType: 'json',
                        purpose: 'ask-transcript',
                        buildBody: () => JSON.stringify({
                            model,
                            temperature: 0.2,
                            messages: [
                                {
                                    role: 'system',
                                    content: [
                                        'You answer questions about a transcript.',
                                        'Use the transcript as the source of current truth.',
                                        'Use imported memory only as background context for user preferences, terminology, and ongoing projects.',
                                        `Current output style: ${getOutputStyleInstruction()}`
                                    ].join('\n')
                                },
                                ...(importedMemory ? [{
                                    role: 'system',
                                    content: `Active memory pack: ${activePack?.name || 'Primary'}\n\n${importedMemory}`
                                }] : []),
                                {
                                    role: 'user',
                                    content: `Question:\n${prompt}\n\nTranscript:\n${transcriptText}`
                                }
                            ]
                        }),
                        maxRetries: 2
                    });
                    const out = normalizeAssistantText(result?.choices?.[0]?.message?.content || '');
                    aiOutput.value = out.trim();
                    state.aiOutput = aiOutput.value;
                    sessionStorage.setItem('vt_ai_output', state.aiOutput);
                    updateDiagnostics({ chatModel: model }, 'ask-transcript complete');
                    scheduleWorkspaceSave();
                    toast('Transcript answer ready', 'success');
                } catch (err) {
                    toast(err.message || 'Transcript question failed', 'error');
                } finally {
                    state.aiBusy = false;
                    if (button) button.disabled = false;
                }
            }

            function getImportedMemoryContext({ maxChars = 9000 } = {}) {
                ensureMemoryPackStore();
                const raw = normalizeImportedMemory(state.memoryRaw || '');
                if (!raw) return '';
                const compact = raw.length > maxChars
                    ? `${raw.slice(0, maxChars).trim()}\n\n[Imported memory truncated for token control]`
                    : raw;
                const activePack = getActiveMemoryPack();
                return [
                    `Imported user memory from pack: ${activePack?.name || 'Primary'}`,
                    'Use this for preferences, ongoing projects, terminology, and stable background context.',
                    'If transcript or runtime state conflicts with memory, trust the transcript/runtime state first.',
                    '',
                    compact
                ].join('\n');
            }

            function renderMemoryUi() {
                ensureMemoryPackStore();
                if (memoryPromptExport) memoryPromptExport.value = MEMORY_IMPORT_PROMPT;
                if (memoryPackSelect) {
                    memoryPackSelect.innerHTML = (state.memoryPacks || []).map(pack => `<option value="${escapeHtml(pack.id)}">${escapeHtml(pack.name)}</option>`).join('');
                    memoryPackSelect.value = state.activeMemoryPackId || state.memoryPacks?.[0]?.id || '';
                }
                if (memoryInput && document.activeElement !== memoryInput) memoryInput.value = state.memoryRaw || '';
                if (outputStyleSelect) outputStyleSelect.value = state.outputStyle || 'default';
                const imported = normalizeImportedMemory(state.memoryRaw || '');
                const activePack = getActiveMemoryPack();
                if (memoryStatusChip) {
                    memoryStatusChip.textContent = imported
                        ? `${activePack?.name || 'Memory'} loaded - ${formatRelativeMemoryTime(state.memoryImportedAt)}`
                        : 'No memory loaded';
                }
                if (memoryPackMeta) {
                    memoryPackMeta.textContent = `Active pack: ${activePack?.name || 'Primary'}. Use separate packs for Client A, Startup, Personal, Research, or any other workflow.`;
                }
                if (memoryMeta) {
                    memoryMeta.textContent = imported
                        ? `Imported ${imported.length.toLocaleString()} characters into ${activePack?.name || 'this pack'}. AI Output and Verba Assistant will use it automatically. Last updated ${formatRelativeMemoryTime(state.memoryImportedAt)}.`
                        : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
                }
                if (aiContextNote) {
                    const styleLabel = outputStyleSelect?.selectedOptions?.[0]?.textContent || 'Default';
                    aiContextNote.textContent = `AI Output uses the ${activePack?.name || 'Primary'} memory pack and ${styleLabel} style automatically.`;
                }
            }

            function persistMemoryStore() {
                persistMemoryPacksStore();
            }

            function setImportedMemory(rawText, { announce = true } = {}) {
                const normalized = normalizeImportedMemory(rawText);
                ensureMemoryPackStore();
                const active = getActiveMemoryPack();
                if (active) {
                    active.raw = normalized;
                    active.importedAt = normalized ? new Date().toISOString() : '';
                }
                syncActiveMemoryPackState();
                persistMemoryStore();
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
                if (announce) {
                    toast(normalized ? 'Memory imported' : 'Memory cleared', normalized ? 'success' : 'info');
                }
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // EVENT LISTENERS
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

            const ASSISTANT_KB = `
Verba is a single-file browser transcription workspace with recording, file transcription, cleanup tools, export tools, and AI chat.
You are allowed to answer both Verba-specific questions and normal general questions.
When the user asks about this app, use the runtime state and the details below.
When the user asks a general question, answer directly and clearly instead of refusing.
Do not let general chat override the app's primary functions or controls; stay concise and practical.
Do not use markdown formatting in replies.
Do not use asterisks for emphasis, headings, or bullet points.
Do not output markdown tables.
Write like a practical human assistant using plain sentences, short paragraphs, and numbered steps only when useful.

Modes:
- Live uses browser speech recognition with interim text and final segments.
- Quality records microphone audio, then sends audio to the selected provider for transcription.
- File uploads local audio, supports normalization, transcript cache, and translate-to-English.

Provider defaults:
- Groq-first.
- Groq transcription uses whisper-large-v3-turbo by default.
- Groq translate-to-English forces whisper-large-v3.
- Recommended Groq chat model: openai/gpt-oss-120b.
- Faster fallback: openai/gpt-oss-20b.
- Free-tier planning reference for this app: roughly 30 requests per minute, roughly 6,000 to 14,400 tokens per minute, and roughly 14,400 requests per day.

User profile and operating context:
- The user builds AI automation systems with n8n, APIs, RAG pipelines, and document-processing flows.
- Their stack includes Docker, n8n, local LLMs, Groq/OpenAI-compatible APIs, MinIO, and vector or database systems.
- Their projects include AI chatbots, document analyzers, database chat systems, file-intelligence pipelines, and automation agents.
- They prefer production-ready architecture, deep debugging, cost and token efficiency, and scalable backend workflows.
- They are learning cloud hosting, deployment, DNS, load balancing, and scaling public multi-user apps.
- Their goal is production-grade AI backend systems and automation platforms that can run locally or in the cloud.

When answering architecture or implementation questions for this user:
- optimize for reliability, cost, throughput, and maintainability
- account for Groq free-tier rate limits and avoid burst-heavy designs
- suggest batching, chunking, caching, queues, and concurrency control when relevant
- prefer faster models for high-volume automation steps and stronger models for planning, debugging, and final synthesis

Key controls and tools:
- Language selector affects live recognition and speech-to-text language.
- Punct toggles smart punctuation.
- Auto-Copy triggers after silence when enabled.
- Presets change recommended behavior.
- Speaker labels affect transcript rebuild and subtitle-style exports.
- Imported Memory lets the user paste exported long-term context that AI Output and Verba Assistant can reuse.
- Advanced transcript tools include glossary apply, local cleanup, redaction, workspace save/export/import, and cache clear.
- AI Output includes AI Clean, Summary, Action Items, and Prompt Pack.
- Exports include TXT, SRT, VTT, JSON, Markdown, CSV, and Workspace JSON.
- Keyboard shortcuts include Space, Ctrl+C, Ctrl+D, Ctrl+O, Ctrl+U, Ctrl+Enter, Ctrl+Z, Ctrl+Delete, Ctrl+Shift+Q, and Ctrl+Shift+P.

Preferred answer style:
- concise
- operational
- step-by-step when user asks how to do something
- mention current runtime state when relevant
- answer general questions normally when they are not about the app
- never use markdown stars or bold markers
`.trim();

            function getAssistantRuntimeSummary() {
                return [
                    `mode=${state.mode}`,
                    `audio_provider=${state.apiProvider}`,
                    `assistant_provider=${getActiveAssistantProvider()}`,
                    `language=${langSelect.value || 'auto'}`,
                    `smart_punctuation=${state.smartPunctEnabled ? 'on' : 'off'}`,
                    `auto_copy=${state.autoCopyEnabled ? 'on' : 'off'}`,
                    `speaker_labels=${state.speakerMode ? 'on' : 'off'}`,
                    `preset=${state.preset}`,
                    `autosave=${state.autosaveEnabled ? 'on' : 'off'}`,
                    `memory=${state.memoryRaw ? 'loaded' : 'none'}`,
                    `memory_pack=${getActiveMemoryPack()?.name || 'Primary'}`,
                    `output_style=${state.outputStyle || 'default'}`,
                    `recording=${state.isRecording ? 'active' : 'idle'}`,
                    `normalize=${$('optNormalize')?.checked ? 'on' : 'off'}`,
                    `translate_to_english=${$('optTranslate')?.checked ? 'on' : 'off'}`,
                    `transcript_cache=${$('optUseCache')?.checked ? 'on' : 'off'}`,
                    `detected_language=${state.detectedLanguage || 'unknown'}`,
                    `segments=${String(state.segments?.length || 0)}`,
                    `cache=${state.diagnostics?.cacheHit ? 'hit' : (state.cacheKey ? 'ready' : 'idle')}`,
                    `audio_model=${getEffectiveAudioModel({ translate: !!$('optTranslate')?.checked })}`,
                    `chat_model=${getActiveChatModel()}`,
                    `assistant_model=${getActiveAssistantModel()}`
                ].join('\n');
            }

            function normalizeAssistantAttachmentMeta(raw) {
                if (!raw || typeof raw !== 'object') return null;
                const name = String(raw.name || '').trim();
                if (!name) return null;
                const mimeType = inferAttachmentMimeType(raw) || String(raw.mimeType || '').trim() || 'application/octet-stream';
                const kind = raw.kind
                    || (mimeType === 'application/pdf' ? 'pdf' : (mimeType.startsWith('image/') ? 'image' : 'text'));
                const meta = {
                    id: String(raw.id || ''),
                    kind,
                    name,
                    mimeType,
                    size: Math.max(0, Number(raw.size || 0) || 0),
                    provider: String(raw.provider || '')
                };
                if (raw.fileUri) meta.fileUri = String(raw.fileUri);
                if (raw.fileName) meta.fileName = String(raw.fileName);
                if (raw.uploadedAt) meta.uploadedAt = Number(raw.uploadedAt || 0) || 0;
                if (raw.textContent) meta.textContent = String(raw.textContent);
                return meta;
            }

            function normalizeAssistantAttachmentList(raw) {
                if (Array.isArray(raw)) {
                    return raw
                        .map(item => normalizeAssistantAttachmentMeta(item))
                        .filter(Boolean);
                }
                const fromSingle = normalizeAssistantAttachmentMeta(raw);
                return fromSingle ? [fromSingle] : [];
            }

            function canReuseGeminiFileReference(attachment) {
                if (!attachment?.fileUri) return false;
                const uploadedAt = Number(attachment?.uploadedAt || 0);
                if (!uploadedAt) return false;
                return Date.now() - uploadedAt < (25 * 60 * 1000);
            }

            function cloneAssistantMessage(msg) {
                const attachments = normalizeAssistantAttachmentList(msg?.attachments || msg?.attachment);
                return {
                    role: msg?.role === 'user' ? 'user' : 'assistant',
                    content: String(msg?.content || '').trim(),
                    ts: Number(msg?.ts || Date.now()),
                    ...(attachments.length ? { attachments } : {})
                };
            }

            function createAssistantMessage(role, content, extras = {}) {
                const cleaned = role === 'assistant'
                    ? normalizeAssistantText(content)
                    : String(content || '').trim();
                const message = {
                    role: role === 'user' ? 'user' : 'assistant',
                    content: cleaned,
                    ts: Number(extras.ts || Date.now())
                };
                const attachments = normalizeAssistantAttachmentList(extras.attachments || extras.attachment);
                if (attachments.length) message.attachments = attachments;
                return message;
            }

            function createAssistantConversation(seedMessages = null, seedTitle = 'New chat') {
                const now = Date.now();
                const messages = Array.isArray(seedMessages) && seedMessages.length
                    ? seedMessages.map(msg => cloneAssistantMessage(msg))
                    : [getAssistantWelcomeMessage()];
                return {
                    id: `chat_${now}_${Math.random().toString(36).slice(2, 8)}`,
                    title: seedTitle,
                    createdAt: now,
                    updatedAt: now,
                    messages
                };
            }

            function deriveAssistantConversationTitle(messages = []) {
                const firstUser = (messages || []).find(msg => msg?.role === 'user' && String(msg.content || '').trim());
                const raw = firstUser ? String(firstUser.content || '').replace(/\s+/g, ' ').trim() : '';
                if (!raw) return 'New chat';
                return raw.length > 52 ? `${raw.slice(0, 52).trim()}...` : raw;
            }

            function normalizeAssistantConversation(conv, index = 0) {
                const now = Date.now();
                const messages = Array.isArray(conv?.messages) && conv.messages.length
                    ? conv.messages
                        .filter(Boolean)
                        .map((msg, msgIndex) => cloneAssistantMessage({ ...msg, ts: Number(msg?.ts || (now + msgIndex)) }))
                    : [getAssistantWelcomeMessage()];
                return {
                    id: String(conv?.id || `chat_${now}_${index}`),
                    title: String(conv?.title || deriveAssistantConversationTitle(messages) || 'New chat'),
                    createdAt: Number(conv?.createdAt || messages[0]?.ts || now),
                    updatedAt: Number(conv?.updatedAt || messages[messages.length - 1]?.ts || now),
                    messages
                };
            }

            function getCurrentAssistantConversation() {
                return (state.assistant.conversations || []).find(conv => conv.id === state.assistant.currentConversationId) || null;
            }

            function persistAssistantConversations() {
                const serialized = Array.isArray(state.assistant.conversations)
                    ? state.assistant.conversations.map(conv => ({
                        ...conv,
                        messages: Array.isArray(conv?.messages) ? conv.messages.map(msg => cloneAssistantMessage(msg)) : [getAssistantWelcomeMessage()]
                    }))
                    : [];
                localStorage.setItem('vt_assistant_conversations', JSON.stringify(serialized));
                localStorage.setItem('vt_assistant_current', state.assistant.currentConversationId || '');
            }

            function syncAssistantMessagesFromCurrentConversation() {
                const current = getCurrentAssistantConversation();
                state.assistant.messages = current?.messages?.map(msg => cloneAssistantMessage(msg)) || [getAssistantWelcomeMessage()];
                localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages || []).map(msg => cloneAssistantMessage(msg))));
            }

            function ensureAssistantConversationStore() {
                const normalized = (Array.isArray(state.assistant.conversations) ? state.assistant.conversations : [])
                    .map((conv, index) => normalizeAssistantConversation(conv, index))
                    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
                const legacyThread = Array.isArray(state.assistant.messages) ? state.assistant.messages.filter(Boolean) : [];
                if (!normalized.length) {
                    normalized.push(normalizeAssistantConversation({
                        id: `chat_${Date.now()}_legacy`,
                        title: deriveAssistantConversationTitle(legacyThread) || 'New chat',
                        messages: legacyThread.length ? legacyThread : [getAssistantWelcomeMessage()]
                    }));
                }
                state.assistant.conversations = normalized;
                if (!state.assistant.currentConversationId || !state.assistant.conversations.some(conv => conv.id === state.assistant.currentConversationId)) {
                    state.assistant.currentConversationId = state.assistant.conversations[0]?.id || '';
                }
                syncAssistantMessagesFromCurrentConversation();
                persistAssistantConversations();
            }

            function persistAssistantThread() {
                const current = getCurrentAssistantConversation();
                if (current) {
                    current.messages = Array.isArray(state.assistant.messages)
                        ? state.assistant.messages.map(msg => cloneAssistantMessage(msg))
                        : [getAssistantWelcomeMessage()];
                    current.title = deriveAssistantConversationTitle(current.messages);
                    current.updatedAt = Date.now();
                }
                localStorage.setItem('vt_assistant_thread', JSON.stringify((state.assistant.messages || []).map(msg => cloneAssistantMessage(msg))));
                persistAssistantConversations();
            }

            function persistAssistantUi() {
                localStorage.setItem('vt_assistant_ui', JSON.stringify({
                    isOpen: !!state.assistant.isOpen,
                    minimized: !!state.assistant.minimized,
                    maximized: !!state.assistant.maximized,
                    showHistory: !!state.assistant.showHistory,
                    unread: Number(state.assistant.unread || 0)
                }));
            }

            function sanitizeAssistantUiState(ui) {
                const raw = ui && typeof ui === 'object' ? ui : {};
                return {
                    isOpen: !!raw.isOpen && !raw.minimized,
                    minimized: !!raw.minimized || !raw.isOpen,
                    maximized: false,
                    showHistory: !!raw.showHistory,
                    unread: Math.max(0, Number(raw.unread || 0) || 0)
                };
            }

            function setAssistantDraft(value) {
                state.assistant.draft = value;
                sessionStorage.setItem('vt_assistant_draft', value);
            }

            function getAssistantWelcomeMessage() {
                return createAssistantMessage(
                    'assistant',
                    'I can help with this Verba workspace and also answer general questions. Ask about models, prompts, coding, writing, exports, recording flow, or anything else you need.'
                );
            }

            function ensureAssistantThread() {
                ensureAssistantConversationStore();
            }

            function assistantEscapedHtml(text) {
                return escapeHtml(String(text || '')).replace(/\n/g, '<br>');
            }

            function normalizeAssistantText(text) {
                return String(text || '')
                    .replace(/\r\n/g, '\n')
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/__(.*?)__/g, '$1')
                    .replace(/^\s*[-*]\s+/gm, '')
                    .replace(/^\s*\d+\.\s*\*\*(.*?)\*\*/gm, (m, inner) => `${inner}`)
                    .replace(/\|/g, ' ')
                    .replace(/[ \t]{2,}/g, ' ')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }

            function describeAssistantAttachment(meta) {
                const attachment = normalizeAssistantAttachmentMeta(meta);
                if (!attachment) return '';
                const size = attachment.size ? ` - ${formatFileSize(attachment.size)}` : '';
                return `${attachment.name}${size}`;
            }

            function describeAssistantAttachmentList(raw) {
                const attachments = normalizeAssistantAttachmentList(raw);
                if (!attachments.length) return '';
                if (attachments.length === 1) return describeAssistantAttachment(attachments[0]);
                const pdfCount = attachments.filter(item => item.kind === 'pdf').length;
                const imageCount = attachments.filter(item => item.kind === 'image').length;
                const textCount = attachments.filter(item => item.kind === 'text').length;
                const parts = [];
                if (imageCount) parts.push(`${imageCount} image${imageCount === 1 ? '' : 's'}`);
                if (pdfCount) parts.push(`${pdfCount} PDF${pdfCount === 1 ? '' : 's'}`);
                if (textCount) parts.push(`${textCount} text file${textCount === 1 ? '' : 's'}`);
                return `${parts.join(' + ')} attached`;
            }

            function getDefaultAssistantPromptForAttachment(attachment) {
                const attachments = normalizeAssistantAttachmentList(attachment);
                if (!attachments.length) return '';
                const hasPdf = attachments.some(item => item.kind === 'pdf');
                const hasText = attachments.some(item => item.kind === 'text');
                return hasPdf
                    ? 'Please analyze this PDF and summarize the important content.'
                    : hasText
                        ? 'Please analyze these attached files and summarize the important content.'
                    : attachments.length > 1
                        ? 'Please analyze these images and extract the important details and any readable text.'
                        : 'Please analyze this image and extract the important details and any readable text.';
            }

            function clearAssistantAttachment(options = {}) {
                state.assistant.pendingAttachment = null;
                if (assistantFileInput) assistantFileInput.value = '';
                if (!options.silent) renderAssistantComposer();
            }

            function renderAssistantComposer() {
                const modelOption = getActiveAssistantModelOption();
                const pendingAttachments = normalizeAssistantAttachmentList(state.assistant.pendingAttachment);
                const pendingAttachment = pendingAttachments[0] || null;
                const draftValue = String(assistantInput?.value || state.assistant.draft || '').trim();
                const requestOption = getAssistantOptionForRequest(pendingAttachments, draftValue);
                const providerLabel = getAssistantProviderLabel(modelOption.provider);
                const capabilityLabel = modelOption.supportsPdf
                    ? 'Images + PDFs'
                    : modelOption.supportsImages
                        ? 'Images'
                        : 'Text only';
                const routingLabel = modelOption.id === 'assistant:max'
                    ? ` | routes to ${requestOption.label.replace(/^Groq - /, '').replace(/^Gemini - /, 'Gemini ')}`
                    : pendingAttachment && requestOption.provider === 'gemini' && modelOption.provider !== 'gemini'
                        ? ` | attachment via Gemini ${requestOption.model}`
                        : '';

                if (assistantModelSelect) assistantModelSelect.value = modelOption.id;
                if (assistantModelMeta) assistantModelMeta.textContent = `${providerLabel} | ${modelOption.label.replace(/^.+? - /, '')} | ${capabilityLabel}${routingLabel}`;
                if (assistantFileInput) assistantFileInput.accept = assistantAttachmentAccept(modelOption);
                if (assistantAttachmentPreview) assistantAttachmentPreview.hidden = !pendingAttachments.length;
                if (assistantAttachmentKind && pendingAttachments.length) {
                    const hasPdf = pendingAttachments.some(item => item.kind === 'pdf');
                    const hasText = pendingAttachments.some(item => item.kind === 'text');
                    assistantAttachmentKind.textContent = pendingAttachments.length > 1
                        ? `${pendingAttachments.length} files`
                        : (hasPdf ? 'PDF' : (hasText ? 'File' : 'Image'));
                }
                if (assistantAttachmentMeta && pendingAttachments.length) assistantAttachmentMeta.textContent = describeAssistantAttachmentList(pendingAttachments);
                if (assistantAttachBtn) {
                    const canAttach = !state.assistant.isSending;
                    assistantAttachBtn.disabled = !canAttach;
                    assistantAttachBtn.title = !canAttach
                        ? 'Wait for the current assistant request to finish'
                        : getProviderKeys('gemini').length
                            ? `Add photos, PDFs, and files. Gemini analysis model: ${getConfiguredGeminiAnalysisModel()}`
                        : modelOption.supportsPdf
                            ? 'Add photos, PDFs, and files'
                            : modelOption.supportsImages
                                ? 'Add photos and files. Switch to Gemini for PDFs'
                                : 'Add files';
                    assistantAttachBtn.setAttribute('aria-label', assistantAttachBtn.title);
                }
                if (assistantMicBtn) {
                    const supported = !!assistantRecognition;
                    assistantMicBtn.disabled = !supported || !!state.assistant.isSending;
                    assistantMicBtn.classList.toggle('listening', !!state.assistant.isListening);
                    assistantMicBtn.setAttribute('aria-pressed', state.assistant.isListening ? 'true' : 'false');
                    assistantMicBtn.setAttribute('aria-label', state.assistant.isListening ? 'Stop voice input' : 'Start voice input');
                    assistantMicBtn.title = !supported
                        ? 'Voice input is not supported in this browser'
                        : state.assistant.isListening
                            ? 'Stop voice input'
                            : 'Voice input (English)';
                }
                if (assistantSend) {
                    assistantSend.disabled = !!state.assistant.isSending || (!draftValue && !pendingAttachments.length);
                    assistantSend.classList.toggle('loading', !!state.assistant.isSending);
                    assistantSend.setAttribute(
                        'aria-label',
                        state.assistant.isSending
                            ? (pendingAttachments.length ? 'Processing attachment and sending assistant message' : 'Sending assistant message')
                            : 'Send assistant message'
                    );
                    assistantSend.title = state.assistant.isSending
                        ? (pendingAttachments.length ? 'Processing attachment...' : 'Sending...')
                        : 'Send';
                }
            }

            async function handleAssistantFileSelection(fileList) {
                const files = Array.isArray(fileList) ? fileList : Array.from(fileList || []).filter(Boolean);
                if (!files.length) return;
                const existing = Array.isArray(state.assistant.pendingAttachment)
                    ? [...state.assistant.pendingAttachment]
                    : (state.assistant.pendingAttachment ? [state.assistant.pendingAttachment] : []);
                const nextAttachments = [...existing];
                for (const file of files) {
                    const mimeType = inferAttachmentMimeType(file);
                    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json'].includes(mimeType)) {
                        toast('Supported assistant files: PNG, JPG, JPEG, WEBP, PDF, TXT, MD, CSV, JSON.', 'warning', 3600);
                        return;
                    }
                    if ((file.size || 0) > ASSISTANT_ATTACHMENT_MAX_BYTES) {
                        toast(`Assistant attachments are limited to ${formatFileSize(ASSISTANT_ATTACHMENT_MAX_BYTES)}.`, 'warning', 3600);
                        return;
                    }
                    nextAttachments.push({ ...buildAssistantAttachmentMeta(file), file });
                }
                const requestOption = getAssistantOptionForRequest(nextAttachments, String(assistantInput?.value || state.assistant.draft || '').trim());
                if (!canAssistantModelUseAttachment(requestOption, nextAttachments)) {
                    toast('The selected assistant model does not support that file type.', 'warning', 3200);
                    return;
                }
                if (requestOption.provider === 'gemini') {
                    toast(`Attachments will use Gemini analysis model: ${requestOption.model}`, 'info', 3200);
                }
                state.assistant.pendingAttachment = nextAttachments;
                renderAssistantComposer();
                if (assistantInput) assistantInput.focus();
            }

            function getLastAssistantReply() {
                const msgs = state.assistant.messages || [];
                for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i]?.role === 'assistant' && msgs[i]?.content) return msgs[i].content;
                }
                return '';
            }

            function formatAssistantConversationTime(ts) {
                const time = Number(ts || 0);
                if (!time) return 'Recent';
                const diffMs = Date.now() - time;
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) return 'Just now';
                if (diffMin < 60) return `${diffMin}m ago`;
                const diffHr = Math.floor(diffMin / 60);
                if (diffHr < 24) return `${diffHr}h ago`;
                const diffDay = Math.floor(diffHr / 24);
                if (diffDay < 7) return `${diffDay}d ago`;
                return new Date(time).toLocaleDateString();
            }

            function renderAssistantHistoryList() {
                if (!assistantHistoryList) return;
                const conversations = [...(state.assistant.conversations || [])]
                    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
                if (!conversations.length) {
                    assistantHistoryList.innerHTML = '<div class="assistant-history-empty">No chats yet. Start a new chat and it will appear here.</div>';
                    return;
                }
                assistantHistoryList.innerHTML = conversations.map(conv => {
                    const activeClass = conv.id === state.assistant.currentConversationId ? ' active' : '';
                    const convId = escapeHtml(conv.id);
                    const title = escapeHtml(conv.title || 'New chat');
                    const meta = escapeHtml(formatAssistantConversationTime(conv.updatedAt));
                    return '' +
                        '<div class="assistant-history-item' + activeClass + '" data-conversation-id="' + convId + '">' +
                        '<div class="assistant-history-copy">' +
                        '<div class="assistant-history-name">' + title + '</div>' +
                        '<div class="assistant-history-meta">' + meta + '</div>' +
                        '</div>' +
                        '<button class="assistant-history-delete" type="button" data-delete-conversation="' + convId + '" aria-label="Delete conversation">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>' +
                        '</button>' +
                        '</div>';
                }).join('');
            }

            function selectAssistantConversation(conversationId) {
                if (!conversationId) return;
                persistAssistantThread();
                const next = (state.assistant.conversations || []).find(conv => conv.id === conversationId);
                if (!next) return;
                state.assistant.currentConversationId = conversationId;
                state.assistant.showHistory = false;
                syncAssistantMessagesFromCurrentConversation();
                persistAssistantConversations();
                persistAssistantUi();
                renderAssistantMessages();
                if (state.assistant.isOpen) setTimeout(() => assistantInput.focus(), 60);
            }

            function createNewAssistantConversation() {
                persistAssistantThread();
                const conv = createAssistantConversation([getAssistantWelcomeMessage()]);
                state.assistant.conversations = [conv, ...(state.assistant.conversations || [])];
                state.assistant.currentConversationId = conv.id;
                state.assistant.showHistory = false;
                syncAssistantMessagesFromCurrentConversation();
                persistAssistantConversations();
                persistAssistantUi();
                clearAssistantAttachment({ silent: true });
                renderAssistantMessages();
                setAssistantDraft('');
                if (assistantInput) assistantInput.value = '';
                if (state.assistant.isOpen) setTimeout(() => assistantInput.focus(), 60);
            }

            function deleteAssistantConversation(conversationId) {
                if (!conversationId) return;
                state.assistant.conversations = (state.assistant.conversations || []).filter(conv => conv.id !== conversationId);
                if (!state.assistant.conversations.length) {
                    const fresh = createAssistantConversation([getAssistantWelcomeMessage()]);
                    state.assistant.conversations = [fresh];
                }
                if (!state.assistant.conversations.some(conv => conv.id === state.assistant.currentConversationId)) {
                    state.assistant.currentConversationId = state.assistant.conversations[0]?.id || '';
                }
                syncAssistantMessagesFromCurrentConversation();
                persistAssistantConversations();
                persistAssistantUi();
                clearAssistantAttachment({ silent: true });
                renderAssistantMessages();
            }

            function renderAssistantMessages() {
                const msgs = Array.isArray(state.assistant.messages) ? state.assistant.messages : [];
                const messageMarkup = msgs.map(msg => {
                    const role = msg.role === 'user' ? 'user' : 'assistant';
                    const displayText = role === 'assistant'
                        ? normalizeAssistantText(msg.content || '')
                        : String(msg.content || '');
                    const attachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
                    const attachmentMarkup = attachments.length
                        ? attachments.map(attachment => `<div class="assistant-message-attachment"><span class="assistant-message-attachment-kind">${escapeHtml(attachment.kind === 'pdf' ? 'PDF' : (attachment.kind === 'text' ? 'File' : 'Image'))}</span><span class="assistant-message-attachment-name">${escapeHtml(describeAssistantAttachment(attachment))}</span></div>`).join('')
                        : '';
                    return `
      <div class="assistant-message ${role}">
        ${role === 'assistant' ? '<div class="assistant-avatar-dot" aria-hidden="true"></div>' : ''}
        <div class="assistant-bubble">${attachmentMarkup}${assistantEscapedHtml(displayText)}</div>
      </div>`;
                }).join('');
                const thinkingMarkup = state.assistant.isSending
                    ? `
      <div class="assistant-message assistant assistant-thinking" aria-live="polite" aria-label="Assistant is generating a response">
        <div class="assistant-avatar-dot" aria-hidden="true"></div>
        <div class="assistant-bubble assistant-thinking-bubble">
          <div class="assistant-thinking-label">Generating response...</div>
          <div class="assistant-thinking-dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>`
                    : '';
                assistantMessages.innerHTML = messageMarkup + thinkingMarkup;
                assistantEmpty.style.display = msgs.length ? 'none' : '';
                assistantMessages.scrollTop = assistantMessages.scrollHeight;
                const unread = Number(state.assistant.unread || 0);
                assistantUnread.textContent = unread > 9 ? '9+' : String(unread);
                assistantUnread.classList.toggle('visible', unread > 0);
                assistantRuntimeMeta.textContent = `${state.mode} mode | audio ${state.apiProvider.toUpperCase()} ready | assistant ${getAssistantProviderLabel(getActiveAssistantProvider())} | ${getActiveMemoryPack()?.name || 'Primary'} memory`;
                renderAssistantComposer();
                renderAssistantHistoryList();
                assistantLauncher.classList.toggle('open', !!state.assistant.isOpen);
                assistantShell.classList.toggle('open', !!state.assistant.isOpen);
                assistantShell.classList.toggle('maximized', !!state.assistant.maximized);
                assistantPanel.hidden = !state.assistant.isOpen;
                if (assistantHistoryPanel) assistantHistoryPanel.hidden = !state.assistant.showHistory;
                assistantHistoryBtn?.classList.toggle('active', !!state.assistant.showHistory);
                if (assistantMaxBtn) assistantMaxBtn.title = state.assistant.maximized ? 'Restore assistant' : 'Expand assistant';
                if (assistantMaxBtn) assistantMaxBtn.setAttribute('aria-label', state.assistant.maximized ? 'Restore assistant' : 'Expand assistant');
            }

            function setAssistantOpen(isOpen) {
                state.assistant.isOpen = !!isOpen;
                state.assistant.minimized = !isOpen;
                if (!isOpen && state.assistant.isListening && assistantRecognition) {
                    try { assistantRecognition.stop(); } catch (e) { }
                }
                if (!isOpen) {
                    state.assistant.maximized = false;
                }
                if (isOpen) {
                    state.assistant.unread = 0;
                    setTimeout(() => assistantInput.focus(), 60);
                }
                persistAssistantUi();
                renderAssistantMessages();
            }

            function toggleAssistantMaximized(force) {
                state.assistant.maximized = typeof force === 'boolean' ? force : !state.assistant.maximized;
                if (state.assistant.maximized && !state.assistant.isOpen) {
                    state.assistant.isOpen = true;
                    state.assistant.minimized = false;
                }
                persistAssistantUi();
                renderAssistantMessages();
            }

            function pushAssistantMessage(role, content, extras = {}) {
                const message = createAssistantMessage(role, content, extras);
                state.assistant.messages.push(message);
                persistAssistantThread();
                renderAssistantMessages();
                return message;
            }

            function getAssistantPromptContext() {
                const importedMemory = getImportedMemoryContext({ maxChars: 7000 });
                return {
                    system: `You are Verba Assistant.\n${ASSISTANT_KB}\n\nCurrent runtime state:\n${getAssistantRuntimeSummary()}\n\nPreferred output style:\n${getOutputStyleInstruction()}\n\nWhen generating code, always output the complete implementation without truncating or summarizing. Never say "rest of code here" or "continues below". For documents, use proper headings, sections and formatting. Prioritize completeness over brevity.`,
                    memory: importedMemory
                        ? `Use the imported user memory below as long-term context for preferences, projects, terminology, and stable background facts. Do not let it override transcript text or current runtime state when they conflict.\n\n${importedMemory}`
                        : ''
                };
            }

            function getAssistantGenerationConfig() {
                return {
                    temperature: 0.3,
                    topP: 0.95,
                    maxTokens: 8192,
                    frequencyPenalty: 0,
                    presencePenalty: 0
                };
            }

            function getAttachmentAnalysisInstruction(attachments = null) {
                const normalized = normalizeAssistantAttachmentList(attachments);
                if (!normalized.length) return '';
                const hasPdf = normalized.some(item => item.kind === 'pdf');
                const hasText = normalized.some(item => item.kind === 'text');
                return hasPdf
                    ? 'The latest user message includes attached PDFs. You must inspect the attached documents directly, perform OCR where needed, extract the visible text, tables, form fields, values, dates, names, totals, and key facts, then answer from the attachment contents instead of asking the user to provide the data manually.'
                    : hasText
                        ? 'The latest user message includes attached text-like files. You must read the attached file contents directly, preserve structure where useful, extract important fields, tables, values, sections, and key facts, then answer from the file contents instead of asking the user to provide the data manually.'
                    : 'The latest user message includes attached images. You must inspect the attached images directly, perform OCR where needed, extract all readable text, tables, form fields, values, dates, names, totals, and key facts, then answer from the image contents instead of asking the user to provide the data manually.';
            }

            function buildAssistantPromptMessages(currentAttachment = null) {
                const thread = (state.assistant.messages || [])
                    .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
                    .slice(-8)
                    .map((msg, index, arr) => {
                        const attachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
                        const isLatestAttachment = currentAttachment && msg.role === 'user' && index === arr.length - 1;
                        const effectiveAttachments = isLatestAttachment
                            ? normalizeAssistantAttachmentList(currentAttachment)
                            : attachments;
                        if (effectiveAttachments.length) {
                            const textAttachmentBlocks = effectiveAttachments
                                .filter(item => item?.kind === 'text' && item?.textContent)
                                .map(item => ({
                                    type: 'text',
                                    text: `Attached file: ${item.name}\n\n${String(item.textContent || '').slice(0, 200000)}`
                                }));
                            return {
                                role: msg.role,
                                content: [
                                    { type: 'text', text: String(msg.content || getDefaultAssistantPromptForAttachment(effectiveAttachments)) },
                                    ...textAttachmentBlocks,
                                    ...effectiveAttachments
                                        .filter(item => item?.dataUrl)
                                        .map(item => ({ type: 'image_url', image_url: { url: item.dataUrl } }))
                                ]
                            };
                        }
                        return { role: msg.role, content: String(msg.content || '') };
                    });
                const promptContext = getAssistantPromptContext();
                return [
                    {
                        role: 'system',
                        content: promptContext.system
                    },
                    ...(getAttachmentAnalysisInstruction(currentAttachment) ? [{
                        role: 'system',
                        content: getAttachmentAnalysisInstruction(currentAttachment)
                    }] : []),
                    ...(promptContext.memory ? [{
                        role: 'system',
                        content: promptContext.memory
                    }] : []),
                    ...thread
                ];
            }

            function buildGeminiAssistantContents(currentAttachment = null) {
                return (state.assistant.messages || [])
                    .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
                    .slice(-8)
                    .map((msg, index, arr) => {
                        const isLatestAttachment = currentAttachment && msg.role === 'user' && index === arr.length - 1;
                        const storedAttachments = normalizeAssistantAttachmentList(msg.attachments || msg.attachment);
                        const attachmentsForMessage = isLatestAttachment
                            ? normalizeAssistantAttachmentList(currentAttachment)
                            : storedAttachments.filter(item => (item?.kind === 'text' && item?.textContent) || canReuseGeminiFileReference(item));
                        const parts = [];
                        const text = String(msg.content || '').trim();
                        if (text) parts.push({ text });
                        attachmentsForMessage.forEach(attachmentForMessage => {
                            if (attachmentForMessage?.kind === 'text' && attachmentForMessage?.textContent) {
                                parts.push({
                                    text: `Attached file: ${attachmentForMessage.name}\n\n${String(attachmentForMessage.textContent || '').slice(0, 200000)}`
                                });
                                return;
                            }
                            if (!attachmentForMessage?.fileUri) return;
                            parts.push({
                                file_data: {
                                    mime_type: attachmentForMessage.mimeType,
                                    file_uri: attachmentForMessage.fileUri
                                }
                            });
                        });
                        if (!parts.length) return null;
                        return {
                            role: msg.role === 'assistant' ? 'model' : 'user',
                            parts
                        };
                    })
                    .filter(Boolean);
            }

            function buildAssistantAttachmentMeta(file, provider = '') {
                const mimeType = inferAttachmentMimeType(file);
                return {
                    id: `assistant_att_${Date.now()}_${++assistantAttachmentSeq}`,
                    name: String(file?.name || 'attachment'),
                    size: Math.max(0, Number(file?.size || 0) || 0),
                    mimeType,
                    kind: attachmentKindFromMimeType(mimeType),
                    provider
                };
            }

            function readFileAsDataUrl(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(new Error('Could not read the selected file.'));
                    reader.readAsDataURL(file);
                });
            }

            function readFileAsText(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(new Error('Could not read the selected text file.'));
                    reader.readAsText(file);
                });
            }

            function loadImageElementFromFile(file) {
                return new Promise((resolve, reject) => {
                    const objectUrl = URL.createObjectURL(file);
                    const image = new Image();
                    image.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(image);
                    };
                    image.onerror = () => {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('Could not decode the selected image.'));
                    };
                    image.src = objectUrl;
                });
            }

            async function normalizeAssistantImageFile(file) {
                const mimeType = inferAttachmentMimeType(file);
                if (!mimeType.startsWith('image/')) return file;
                if (typeof document === 'undefined') return file;
                try {
                    const image = await loadImageElementFromFile(file);
                    const width = Math.max(1, Number(image.naturalWidth || image.width || 0));
                    const height = Math.max(1, Number(image.naturalHeight || image.height || 0));
                    if (!width || !height) return file;
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { alpha: false });
                    if (!ctx) return file;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(image, 0, 0, width, height);
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (!(blob instanceof Blob) || !blob.size) return file;
                    const baseName = String(file?.name || 'image').replace(/\.[^.]+$/, '');
                    return new File([blob], `${baseName}.png`, { type: 'image/png' });
                } catch (err) {
                    console.warn('Assistant image normalization skipped:', err);
                    return file;
                }
            }

            async function prepareAssistantAttachmentForProvider(attachment, provider) {
                const attachments = Array.isArray(attachment) ? attachment : normalizeAssistantAttachmentList(attachment);
                if (!attachments.length) return [];
                if (provider === 'gemini') {
                    throw new Error('Gemini attachments must be uploaded with an API key.');
                }
                return Promise.all(attachments.map(async item => {
                    const cached = item.id ? assistantAttachmentCache.get(item.id) : null;
                    if (cached && cached.provider === provider) return { ...cached };
                    if (item.kind === 'text') {
                        const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
                        const prepared = {
                            ...normalizeAssistantAttachmentMeta({
                                ...item,
                                textContent
                            }),
                            provider,
                            textContent
                        };
                        if (item.id) assistantAttachmentCache.set(item.id, prepared);
                        return prepared;
                    }
                    if (item.kind !== 'image') {
                        throw new Error('This model only supports image or text attachments.');
                    }
                    const normalizedFile = item.file ? await normalizeAssistantImageFile(item.file) : item.file;
                    const dataUrl = await readFileAsDataUrl(normalizedFile);
                    const prepared = {
                        ...normalizeAssistantAttachmentMeta({
                            ...item,
                            mimeType: inferAttachmentMimeType(normalizedFile) || item.mimeType
                        }),
                        provider,
                        dataUrl,
                        file: item.file || normalizedFile
                    };
                    if (item.id) assistantAttachmentCache.set(item.id, prepared);
                    return prepared;
                }));
            }

            function startAssistantVoiceInput() {
                if (!assistantRecognition) {
                    toast('Voice input is not supported here', 'warning');
                    return;
                }
                if (state.isRecording) {
                    toast('Stop the main recording first', 'warning');
                    return;
                }
                if (state.assistant.isListening) return;
                assistantDictationBase = String(assistantInput?.value || '').trim();
                assistantDictationFinal = '';
                assistantRecognition.lang = 'en-US';
                try {
                    assistantRecognition.start();
                    state.assistant.isListening = true;
                    renderAssistantMessages();
                    if (assistantInput) assistantInput.focus();
                } catch (e) {
                    console.warn('Assistant voice input start failed:', e);
                    state.assistant.isListening = false;
                    renderAssistantMessages();
                    toast('Assistant voice input unavailable', 'warning');
                }
            }

            function stopAssistantVoiceInput() {
                state.assistant.isListening = false;
                if (assistantRecognition) {
                    try { assistantRecognition.stop(); } catch (e) { }
                }
                renderAssistantMessages();
            }

            async function uploadGeminiFileWithKey(file, apiKey, signal) {
                const mimeType = inferAttachmentMimeType(file) || 'application/octet-stream';
                const startResp = await fetch(getGeminiUploadEndpoint(), {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': apiKey,
                        'X-Goog-Upload-Protocol': 'resumable',
                        'X-Goog-Upload-Command': 'start',
                        'X-Goog-Upload-Header-Content-Length': String(file.size || 0),
                        'X-Goog-Upload-Header-Content-Type': mimeType,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({}),
                    signal
                });
                if (!startResp.ok) {
                    const raw = await startResp.text().catch(() => '');
                    const err = safeJsonParse(raw, null);
                    throw new Error(err?.error?.message || err?.message || raw || `Gemini upload failed (${startResp.status})`);
                }
                const uploadUrl = startResp.headers.get('x-goog-upload-url');
                if (!uploadUrl) throw new Error('Gemini upload URL was not returned.');
                const uploadResp = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'X-Goog-Upload-Command': 'upload, finalize',
                        'X-Goog-Upload-Offset': '0',
                        'Content-Type': mimeType
                    },
                    body: file,
                    signal
                });
                const raw = await uploadResp.text().catch(() => '');
                const payload = safeJsonParse(raw, null);
                if (!uploadResp.ok) {
                    throw new Error(payload?.error?.message || payload?.message || raw || `Gemini upload failed (${uploadResp.status})`);
                }
                const uploaded = payload?.file || payload;
                if (!uploaded?.uri) throw new Error('Gemini did not return a usable file reference.');
                return {
                    uri: String(uploaded.uri),
                    mimeType: String(uploaded.mimeType || mimeType),
                    displayName: String(uploaded.displayName || file.name || 'attachment')
                };
            }

            async function prepareGeminiAttachment(attachment, signal, options = {}) {
                const attachments = Array.isArray(attachment) ? attachment : normalizeAssistantAttachmentList(attachment);
                if (!attachments.length) return [];
                const keys = getProviderKeys('gemini');
                if (!keys.length) throw new Error('Gemini API key required for file analysis.');
                return Promise.all(attachments.map(async item => {
                    const cached = item?.id ? assistantAttachmentCache.get(item.id) : null;
                    if (!options.forceUpload && cached && cached.provider === 'gemini' && (cached.fileUri || cached.textContent)) return { ...cached };
                    if (item.kind === 'text') {
                        const textContent = item.file ? await readFileAsText(item.file) : String(item.textContent || '');
                        const prepared = {
                            ...normalizeAssistantAttachmentMeta({
                                ...item,
                                provider: 'gemini',
                                textContent
                            }),
                            provider: 'gemini',
                            textContent,
                            file: item.file || null
                        };
                        if (item.id) assistantAttachmentCache.set(item.id, prepared);
                        return prepared;
                    }
                    let lastErr = null;
                    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                        try {
                            const normalizedFile = item.kind === 'image' && item.file
                                ? await normalizeAssistantImageFile(item.file)
                                : item.file;
                            const uploaded = await uploadGeminiFileWithKey(normalizedFile, keys[keyIndex], signal);
                            const prepared = {
                                ...normalizeAssistantAttachmentMeta({
                                    ...item,
                                    provider: 'gemini',
                                    fileUri: uploaded.uri,
                                    mimeType: uploaded.mimeType,
                                    fileName: normalizedFile?.name || item.name,
                                    uploadedAt: Date.now()
                                }),
                                file: item.file || normalizedFile
                            };
                            if (item.id) assistantAttachmentCache.set(item.id, prepared);
                            return prepared;
                        } catch (err) {
                            lastErr = err;
                        }
                    }
                    throw lastErr || new Error('Gemini file upload failed.');
                }));
            }

            function extractGeminiText(result) {
                const parts = Array.isArray(result?.candidates?.[0]?.content?.parts)
                    ? result.candidates[0].content.parts
                    : [];
                return parts
                    .map(part => String(part?.text || '').trim())
                    .filter(Boolean)
                    .join('\n\n')
                    .trim();
            }

            function isGeminiExpiredFileError(error) {
                const message = String(error?.message || error || '').toLowerCase();
                return message.includes('do not have permission to access the file')
                    || message.includes('you do not have permission to access the file')
                    || message.includes('may not exist');
            }

            async function requestGeminiAssistantReply(model, preparedAttachment, signal, options = {}) {
                const keys = getProviderKeys('gemini');
                if (!keys.length) throw new Error('Gemini API key required for file analysis.');
                const promptContext = getAssistantPromptContext();
                const generation = getAssistantGenerationConfig();
                const attachmentInstruction = getAttachmentAnalysisInstruction(preparedAttachment);
                let lastErr = null;
                for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                    try {
                        recordGeminiUsage(model);
                        const resp = await fetch(getGeminiGenerateEndpoint(model), {
                            method: 'POST',
                            headers: {
                                'x-goog-api-key': keys[keyIndex],
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                system_instruction: {
                                    parts: [{ text: [promptContext.system, attachmentInstruction, promptContext.memory].filter(Boolean).join('\n\n') }]
                                },
                                generationConfig: {
                                    temperature: generation.temperature,
                                    topP: generation.topP,
                                    maxOutputTokens: generation.maxTokens
                                },
                                contents: buildGeminiAssistantContents(preparedAttachment)
                            }),
                            signal
                        });
                        const raw = await resp.text().catch(() => '');
                        const payload = safeJsonParse(raw, null);
                        if (!resp.ok) {
                            throw new Error(payload?.error?.message || payload?.message || raw || `Gemini request failed (${resp.status})`);
                        }
                        updateDiagnostics({ provider: 'gemini', chatModel: model }, `assistant-chat success via Gemini key ${keyIndex + 1}`);
                        return payload;
                    } catch (err) {
                        lastErr = err;
                    }
                }
                const rawPreparedAttachments = Array.isArray(preparedAttachment)
                    ? preparedAttachment
                    : (preparedAttachment ? [preparedAttachment] : []);
                if (!options.retriedExpiredFiles && isGeminiExpiredFileError(lastErr) && rawPreparedAttachments.some(item => item?.file)) {
                    const refreshedAttachments = await prepareGeminiAttachment(preparedAttachment, signal, { forceUpload: true });
                    updateDiagnostics({ provider: 'gemini', chatModel: model }, 'assistant-chat retry after Gemini file re-upload');
                    return requestGeminiAssistantReply(model, refreshedAttachments, signal, { retriedExpiredFiles: true });
                }
                throw lastErr || new Error('Gemini assistant request failed.');
            }

            async function askAssistant(question) {
                const pendingAttachment = Array.isArray(state.assistant.pendingAttachment)
                    ? state.assistant.pendingAttachment.map(item => ({ ...item }))
                    : (state.assistant.pendingAttachment && typeof state.assistant.pendingAttachment === 'object'
                        ? [{ ...state.assistant.pendingAttachment }]
                        : []);
                const text = String(question || '').trim();
                const finalText = text || getDefaultAssistantPromptForAttachment(pendingAttachment);
                const modelOption = getAssistantOptionForRequest(pendingAttachment, finalText);
                const provider = modelOption.provider;
                if (!finalText && !pendingAttachment.length) return;
                if (state.assistant.isListening) stopAssistantVoiceInput();
                if (pendingAttachment.length && !canAssistantModelUseAttachment(modelOption, pendingAttachment)) {
                    toast(modelOption.provider === 'gemini'
                        ? 'Configured Gemini analysis model does not support that attachment.'
                        : 'Selected model does not support that attachment.', 'warning', 3400);
                    return;
                }
                if (!getProviderKeys(provider).length) {
                    pushAssistantMessage('assistant', provider === 'gemini'
                        ? 'Gemini API key required. Open API Configuration, save a Gemini key, then try the file or image again.'
                        : `API key required for ${getAssistantProviderLabel(provider)}. Open API Configuration, save a key, then ask again.`);
                    toast(`${getAssistantProviderLabel(provider)} key required`, 'warning');
                    return;
                }
                state.assistant.isSending = true;
                renderAssistantComposer();
                assistantModelMeta.textContent = `${getAssistantProviderLabel(provider)} | thinking...`;
                try {
                    let preparedAttachment = [];
                    if (pendingAttachment.length) {
                        preparedAttachment = provider === 'gemini'
                            ? await prepareGeminiAttachment(pendingAttachment)
                            : await prepareAssistantAttachmentForProvider(pendingAttachment, provider);
                    }
                    setAssistantDraft('');
                    if (assistantInput) assistantInput.value = '';
                    clearAssistantAttachment({ silent: true });
                    pushAssistantMessage('user', finalText, { attachments: preparedAttachment });
                    assistantModelMeta.textContent = `${getAssistantProviderLabel(provider)} | thinking...`;
                    const model = modelOption.model;
                    const generation = getAssistantGenerationConfig();
                    let out = '';
                    if (provider === 'gemini') {
                        const result = await requestGeminiAssistantReply(model, preparedAttachment);
                        out = normalizeAssistantText(extractGeminiText(result));
                    } else {
                        const result = await requestWithProvider({
                            provider,
                            url: getChatEndpoint(provider),
                            responseType: 'json',
                            purpose: 'assistant-chat',
                            buildBody: () => JSON.stringify({
                                model,
                                temperature: generation.temperature,
                                top_p: generation.topP,
                                max_tokens: generation.maxTokens,
                                frequency_penalty: generation.frequencyPenalty,
                                presence_penalty: generation.presencePenalty,
                                messages: buildAssistantPromptMessages(preparedAttachment)
                            }),
                            maxRetries: 2,
                            syncPrimaryKey: provider === state.apiProvider
                        });
                        out = normalizeAssistantText(result?.choices?.[0]?.message?.content || '');
                    }
                    pushAssistantMessage('assistant', out || 'I could not generate a grounded answer for that app question.');
                    updateDiagnostics({ provider, chatModel: model }, 'assistant reply ready');
                    if (!state.assistant.isOpen) state.assistant.unread = Math.min(9, Number(state.assistant.unread || 0) + 1);
                } catch (err) {
                    pushAssistantMessage('assistant', `Assistant error: ${err.message || 'request failed'}`);
                } finally {
                    state.assistant.isSending = false;
                    persistAssistantUi();
                    renderAssistantMessages();
                }
            }

            function toggleRecordingFromUi() {
                state.isRecording ? stopRecording() : startRecording();
            }

            // Primary recorder triggers
            micBtn?.addEventListener('click', toggleRecordingFromUi);
            orbTrigger?.addEventListener('click', (e) => {
                toggleRecordingFromUi();
            });
            orbTrigger?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleRecordingFromUi();
                }
            });

            assistantLauncher?.addEventListener('click', () => {
                setAssistantOpen(!state.assistant.isOpen);
            });

            assistantLauncher?.addEventListener('mousemove', (e) => {
                const rect = assistantLauncher.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) - 0.5;
                const y = ((e.clientY - rect.top) / rect.height) - 0.5;
                assistantLauncher.style.setProperty('--assistant-tilt-x', `${(x * 10).toFixed(2)}deg`);
                assistantLauncher.style.setProperty('--assistant-tilt-y', `${(-y * 10).toFixed(2)}deg`);
            });

            assistantLauncher?.addEventListener('mouseleave', () => {
                assistantLauncher.style.setProperty('--assistant-tilt-x', '0deg');
                assistantLauncher.style.setProperty('--assistant-tilt-y', '0deg');
            });

            // ── Global cursor tracking: robot head + pupil follow mouse ──
            (function initRobotTracking() {
                function updateRobot(cx, cy) {
                    if (!assistantLauncher) return;
                    const rect = assistantLauncher.getBoundingClientRect();
                    const robotCX = rect.left + rect.width / 2;
                    const robotCY = rect.top + rect.height / 2;
                    const dx = cx - robotCX;
                    const dy = cy - robotCY;
                    const maxD = Math.max(window.innerWidth, window.innerHeight) * 0.6;
                    const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / maxD);
                    const ry =  (dx / window.innerWidth)  * 22 * t;
                    const rx = -(dy / window.innerHeight) * 15 * t;
                    const px = Math.max(-3.5, Math.min(3.5, dx / window.innerWidth  * 22));
                    const py = Math.max(-3.5, Math.min(3.5, dy / window.innerHeight * 15));
                    assistantLauncher.style.setProperty('--robot-rx', rx.toFixed(2) + 'deg');
                    assistantLauncher.style.setProperty('--robot-ry', ry.toFixed(2) + 'deg');
                    assistantLauncher.style.setProperty('--robot-px', px.toFixed(2) + 'px');
                    assistantLauncher.style.setProperty('--robot-py', py.toFixed(2) + 'px');
                }
                document.addEventListener('mousemove', (e) => updateRobot(e.clientX, e.clientY));
                // Touch support
                document.addEventListener('touchmove', (e) => {
                    if (e.touches.length > 0) updateRobot(e.touches[0].clientX, e.touches[0].clientY);
                }, { passive: true });
            })();

            function submitAssistantDraft() {
                if (state.assistant.isSending) return;
                askAssistant(assistantInput?.value || '');
            }

            assistantInput?.addEventListener('input', () => {
                setAssistantDraft(assistantInput.value);
                renderAssistantComposer();
            });
            assistantInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitAssistantDraft();
                }
            });
            ['dragover', 'dragenter'].forEach(evt => {
                assistantInputWrap?.addEventListener(evt, (e) => {
                    if (assistantAttachBtn?.disabled) return;
                    e.preventDefault();
                    assistantInputWrap.classList.add('drag-over');
                });
            });
            ['dragleave', 'drop'].forEach(evt => {
                assistantInputWrap?.addEventListener(evt, () => {
                    assistantInputWrap.classList.remove('drag-over');
                });
            });
            assistantInputWrap?.addEventListener('drop', (e) => {
                if (assistantAttachBtn?.disabled) return;
                e.preventDefault();
                const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
                if (files.length) handleAssistantFileSelection(files);
            });
            assistantInput?.addEventListener('paste', (e) => {
                if (assistantAttachBtn?.disabled) return;
                const items = Array.from(e.clipboardData?.items || []);
                const files = items
                    .filter(item => item.kind === 'file')
                    .map(item => item.getAsFile())
                    .filter(Boolean);
                if (!files.length) return;
                e.preventDefault();
                handleAssistantFileSelection(files);
            });

            assistantSend?.addEventListener('click', submitAssistantDraft);
            assistantAttachBtn?.addEventListener('click', () => {
                if (assistantAttachBtn.disabled) return;
                if (assistantFileInput) {
                    assistantFileInput.value = '';
                    assistantFileInput.click();
                }
            });
            ['dragover', 'dragenter'].forEach(evt => {
                assistantAttachBtn?.addEventListener(evt, (e) => {
                    if (assistantAttachBtn.disabled) return;
                    e.preventDefault();
                    assistantAttachBtn.classList.add('drag-over');
                });
            });
            ['dragleave', 'drop'].forEach(evt => {
                assistantAttachBtn?.addEventListener(evt, () => {
                    assistantAttachBtn.classList.remove('drag-over');
                });
            });
            assistantAttachBtn?.addEventListener('drop', (e) => {
                if (assistantAttachBtn.disabled) return;
                e.preventDefault();
                const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
                if (files.length) handleAssistantFileSelection(files);
            });
            assistantFileInput?.addEventListener('change', () => {
                const files = Array.from(assistantFileInput.files || []).filter(Boolean);
                if (files.length) handleAssistantFileSelection(files);
            });
            assistantAttachmentRemove?.addEventListener('click', () => {
                clearAssistantAttachment();
                toast('Attachment removed', 'info');
            });
            assistantMicBtn?.addEventListener('click', () => {
                if (state.assistant.isListening) {
                    stopAssistantVoiceInput();
                    return;
                }
                startAssistantVoiceInput();
            });

            assistantHistoryBtn?.addEventListener('click', () => {
                state.assistant.showHistory = !state.assistant.showHistory;
                if (!state.assistant.isOpen) {
                    state.assistant.isOpen = true;
                    state.assistant.minimized = false;
                    state.assistant.unread = 0;
                }
                persistAssistantUi();
                renderAssistantMessages();
            });

            assistantQuickNewBtn?.addEventListener('click', () => {
                createNewAssistantConversation();
                toast('Started a new chat', 'success');
            });

            assistantNewChatBtn?.addEventListener('click', () => {
                createNewAssistantConversation();
                toast('Started a new chat', 'success');
            });

            assistantHistoryList?.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('[data-delete-conversation]');
                if (deleteBtn) {
                    e.stopPropagation();
                    deleteAssistantConversation(deleteBtn.getAttribute('data-delete-conversation'));
                    toast('Conversation deleted', 'info');
                    return;
                }
                const item = e.target.closest('[data-conversation-id]');
                if (!item) return;
                selectAssistantConversation(item.getAttribute('data-conversation-id'));
            });

            assistantMinBtn?.addEventListener('click', () => setAssistantOpen(false));
            assistantMaxBtn?.addEventListener('click', () => toggleAssistantMaximized());
            assistantCloseBtn?.addEventListener('click', () => setAssistantOpen(false));
            assistantClearBtn?.addEventListener('click', () => {
                state.assistant.messages = [getAssistantWelcomeMessage()];
                clearAssistantAttachment({ silent: true });
                persistAssistantThread();
                renderAssistantMessages();
                toast('Assistant thread cleared', 'info');
            });
            assistantCopyLastBtn?.addEventListener('click', () => {
                const reply = getLastAssistantReply();
                if (!reply) {
                    toast('No assistant answer yet', 'warning');
                    return;
                }
                copyToClipboard(reply, () => toast('Assistant answer copied', 'success'));
            });
            document.querySelectorAll('#assistantQuickPrompts .assistant-chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    const prompt = btn.dataset.prompt || '';
                    if (!prompt) return;
                    if (!state.assistant.isOpen) setAssistantOpen(true);
                    setAssistantDraft(prompt);
                    assistantInput.value = prompt;
                    renderAssistantComposer();
                    askAssistant(prompt);
                });
            });

            // Language change
            langSelect.addEventListener('change', () => {
                if (state.isRecording && state.mode === 'realtime') {
                    forceStop();
                    setTimeout(startRecording, 200);
                    toast('Language changed - restarting...', 'info');
                }
            });

            // Punctuation toggle
            punctBtn.addEventListener('click', () => {
                state.smartPunctEnabled = !state.smartPunctEnabled;
                punctBtn.classList.toggle('on', state.smartPunctEnabled);
                toast(state.smartPunctEnabled ? 'Smart punctuation on' : 'Smart punctuation off', 'info');
            });

            // Auto-copy toggle
            autoCopyBtn.addEventListener('click', () => {
                state.autoCopyEnabled = !state.autoCopyEnabled;
                autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
                if (!state.autoCopyEnabled) {
                    clearAutoCopyCountdown();
                    autoCopyBtn.classList.remove('auto-copy-active');
                }
                toast(state.autoCopyEnabled ? `Auto-copy on - fires after ${AUTO_COPY_DELAY / 1000}s silence` : 'Auto-copy off', 'info');
            });

            // Copy button
            $('copyBtn').addEventListener('click', () => {
                const text = transcript.value.trim();
                if (!text) { toast('Nothing to copy yet', 'warning'); return; }
                copyToClipboard(text, () => {
                    addToHistory(text);
                    saveUndo(transcript.value);
                    clearTranscript();
                    const btn = $('copyBtn');
                    btn.classList.add('success');
                    setTimeout(() => btn.classList.remove('success'), 1600);
                    toast('Copied & cleared - Ctrl+Z to recover', 'success');
                });
            });

            // Download button with dropdown
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = transcript.value.trim();
                if (!text) { toast('Nothing to download yet', 'warning'); return; }
                downloadDropdown.classList.toggle('open');
            });

            document.querySelectorAll('.download-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    downloadDropdown.classList.remove('open');
                    const format = btn.dataset.format;
                    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

                    if (format === 'txt') {
                        downloadFile(transcript.value, `transcript-${ts}.txt`, 'text/plain;charset=utf-8');
                    } else if (format === 'srt') {
                        if (!state.segments.length) { toast('No segments for SRT - use timestamped view', 'warning'); return; }
                        downloadFile(generateSRT(), `transcript-${ts}.srt`, 'text/plain;charset=utf-8');
                    } else if (format === 'vtt') {
                        if (!state.segments.length) { toast('No segments for VTT - use timestamped view', 'warning'); return; }
                        downloadFile(generateVTT(), `transcript-${ts}.vtt`, 'text/vtt;charset=utf-8');
                    } else if (format === 'json') {
                        downloadFile(generateJSON(), `transcript-${ts}.json`, 'application/json;charset=utf-8');
                    } else if (format === 'md') {
                        downloadFile(generateMarkdown(), `transcript-${ts}.md`, 'text/markdown;charset=utf-8');
                    } else if (format === 'csv') {
                        if (!state.segments.length) { toast('No segments available for CSV export', 'warning'); return; }
                        downloadFile(generateCSV(), `transcript-${ts}.csv`, 'text/csv;charset=utf-8');
                    } else if (format === 'workspace') {
                        downloadFile(generateWorkspaceJSON(), `workspace-${ts}.json`, 'application/json;charset=utf-8');
                    }
                    toast(`Downloaded as ${format.toUpperCase()}`, 'success');
                });
            });

            // Close dropdown on outside click
            document.addEventListener('click', () => {
                downloadDropdown.classList.remove('open');
            });

            // Clear button
            $('clearBtn').addEventListener('click', () => {
                const text = transcript.value.trim();
                if (!text && !state.segments.length) { toast('Already empty', 'info'); return; }
                saveUndo(transcript.value);
                clearTranscript();
                toast('Cleared - Ctrl+Z to recover', 'info');
            });

            // History button
            historyBtn.addEventListener('click', () => {
                const open = historyPanel.classList.toggle('visible');
                historyBtn.classList.toggle('open', open);
                if (open) renderHistory();
            });

            $('historyClearBtn').addEventListener('click', () => {
                state.copyHistory = [];
                sessionStorage.removeItem('vt_history');
                renderHistory();
                toast('History cleared', 'info');
            });

            // Transcript input
            transcript.addEventListener('input', () => {
                state.confirmedText = transcript.value;
                updateStats();
                scheduleWorkspaceSave();
            });

            // â”€â”€â”€ API Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            apiHeader.addEventListener('click', () => {
                apiPanel.classList.toggle('open');
            });

            // Load saved values
            ensureMemoryPackStore();
            apiProvider.value = state.apiProvider;
            audioModelInput.value = state.audioModel || defaultAudioModel(state.apiProvider);
            chatModelInput.value = getActiveChatModel();
            syncChatModelSelectors();
            glossaryInput.value = state.glossaryRaw;
            presetSelect.value = state.preset;
            speakerModeToggle.classList.toggle('on', state.speakerMode);
            autosaveToggle.classList.toggle('on', state.autosaveEnabled);
            apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
            if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
            if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
            populateGeminiModelControls();
            updateVaultMeta();
            if (state.aiOutput) aiOutput.value = state.aiOutput;
            if (outputStyleSelect) outputStyleSelect.value = state.outputStyle || 'default';
            renderMemoryUi();
            setMemoryToolsOpen(false);
            const activeProviderPrimaryKey = state.providerKeys[state.apiProvider]?.[0] || state.apiKey || '';
            state.apiKey = activeProviderPrimaryKey;
            if (state.apiKey) {
                apiKeyInput.value = state.apiKey;
                apiStatusDot.className = 'api-status-dot connected';
                apiStatusLabel.textContent = 'Key saved';
                state.apiConnected = true;
            }
            syncApiKeyToggleButton();
            syncGeminiKeyToggleButton();

            apiProvider.addEventListener('change', () => {
                const previousProvider = state.apiProvider;
                state.apiProvider = apiProvider.value;
                localStorage.setItem('vt_provider', apiProvider.value);
                if (!state.audioModel || state.audioModel === defaultAudioModel('groq') || state.audioModel === defaultAudioModel('openai')) {
                    state.audioModel = defaultAudioModel(state.apiProvider);
                    audioModelInput.value = state.audioModel;
                    localStorage.setItem('vt_audio_model', state.audioModel);
                }
                if (!state.chatModel || state.chatModel === defaultChatModel(previousProvider)) {
                    setChatModel(defaultChatModel(state.apiProvider), { skipRender: true, skipSave: true });
                }
                chatModelInput.placeholder = state.apiProvider === 'groq'
                    ? 'Groq recommendation: openai/gpt-oss-120b'
                    : 'OpenAI recommendation: gpt-4o-mini';
                populateChatModelControls();
                state.apiKey = state.providerKeys[state.apiProvider]?.[0] || '';
                localStorage.setItem('vt_api_key', state.apiKey);
                apiKeyInput.value = state.apiKey;
                apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
                updateVaultMeta();
                state.apiConnected = false;
                apiStatusDot.className = 'api-status-dot';
                apiStatusLabel.textContent = getProviderKeys().length ? 'Key saved - retest' : 'Not configured';
                renderAssistantMessages();
                scheduleWorkspaceSave();
            });

            $('apiKeySave').addEventListener('click', () => {
                state.apiKey = apiKeyInput.value.trim();
                localStorage.setItem('vt_api_key', state.apiKey);
                const providerKeys = (state.providerKeys[state.apiProvider] || []).filter(Boolean).filter(key => key !== state.apiKey);
                state.providerKeys[state.apiProvider] = state.apiKey ? [state.apiKey, ...providerKeys] : providerKeys;
                persistProviderStore();
                apiKeyVault.value = (state.providerKeys[state.apiProvider] || []).join('\n');
                updateVaultMeta();
                if (state.apiKey) {
                    apiStatusLabel.textContent = 'Key saved';
                    apiStatusDot.className = 'api-status-dot connected';
                    const btn = $('apiKeySave');
                    btn.classList.add('saved');
                    btn.textContent = 'Saved';
                    setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Save'; }, 1500);
                } else {
                    apiStatusLabel.textContent = 'Not configured';
                    apiStatusDot.className = 'api-status-dot';
                }
                updateTranscribeBtn();
                scheduleWorkspaceSave();
            });

            apiKeyToggleBtn.addEventListener('click', () => {
                apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
                syncApiKeyToggleButton();
            });

            $('apiKeyTest').addEventListener('click', testApiKey);

            geminiKeySaveBtn?.addEventListener('click', () => {
                const next = String(geminiKeyInput?.value || '').trim();
                const existing = (state.providerKeys.gemini || []).filter(Boolean).filter(key => key !== next);
                state.providerKeys.gemini = next ? [next, ...existing] : existing;
                persistProviderStore();
                if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
                if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
                updateVaultMeta();
                if (geminiKeySaveBtn) {
                    geminiKeySaveBtn.classList.add('saved');
                    geminiKeySaveBtn.textContent = next ? 'Saved' : 'Cleared';
                    setTimeout(() => { geminiKeySaveBtn.classList.remove('saved'); geminiKeySaveBtn.textContent = 'Save'; }, 1500);
                }
                toast(next ? 'Gemini key saved locally' : 'Gemini key cleared', 'success');
                renderAssistantComposer();
            });

            geminiKeyToggleBtn?.addEventListener('click', () => {
                geminiKeyInput.type = geminiKeyInput.type === 'password' ? 'text' : 'password';
                syncGeminiKeyToggleButton();
            });

            geminiKeyTestBtn?.addEventListener('click', testGeminiKey);

            geminiModelSelect?.addEventListener('change', () => {
                state.geminiAnalysisModel = geminiModelSelect.value || defaultGeminiAnalysisModel();
                localStorage.setItem('vt_gemini_analysis_model', state.geminiAnalysisModel);
                populateGeminiModelControls();
                renderAssistantComposer();
                toast(`Gemini analysis model set to ${state.geminiAnalysisModel}`, 'success');
            });

            geminiUsageResetBtn?.addEventListener('click', () => {
                resetGeminiUsage();
                toast('Gemini usage meter reset for this model', 'success');
            });

            geminiVaultSaveBtn?.addEventListener('click', () => {
                const lines = (geminiKeyVault?.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
                state.providerKeys.gemini = [...new Set(lines)];
                persistProviderStore();
                if (geminiKeyInput) geminiKeyInput.value = state.providerKeys.gemini?.[0] || '';
                if (geminiKeyVault) geminiKeyVault.value = (state.providerKeys.gemini || []).join('\n');
                updateVaultMeta();
                toast('Gemini key vault saved locally', 'success');
                renderAssistantComposer();
            });

            $('apiVaultSave').addEventListener('click', () => {
                const lines = (apiKeyVault.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
                state.providerKeys[state.apiProvider] = [...new Set(lines)];
                persistProviderStore();
                updateVaultMeta();
                updateTranscribeBtn();
                toast('Key vault saved locally', 'success');
            });

            audioModelInput.addEventListener('input', () => {
                state.audioModel = audioModelInput.value.trim();
                localStorage.setItem('vt_audio_model', state.audioModel);
                scheduleWorkspaceSave();
            });

            chatModelInput.addEventListener('input', () => {
                setChatModel(chatModelInput.value);
            });

            chatModelSelect?.addEventListener('change', () => {
                if (chatModelSelect.value === '__custom__') {
                    chatModelInput.focus();
                    chatModelInput.select();
                    syncChatModelSelectors();
                    return;
                }
                setChatModel(chatModelSelect.value);
            });

            assistantModelSelect?.addEventListener('change', () => {
                setAssistantModel(assistantModelSelect.value);
            });

            memoryInput?.addEventListener('input', () => {
                const draft = normalizeImportedMemory(memoryInput.value || '');
                if (memoryMeta) {
                    memoryMeta.textContent = draft
                        ? `Ready to import ${draft.length.toLocaleString()} characters. Once saved, AI Output and Verba Assistant will start using it.`
                        : 'No imported memory yet. Once saved, it will ground summaries, action items, prompt packs, AI clean, and assistant replies.';
                }
            });

            memoryPackSelect?.addEventListener('change', () => {
                setActiveMemoryPack(memoryPackSelect.value);
            });

            createMemoryPackBtn?.addEventListener('click', () => {
                createMemoryPack(memoryPackNameInput?.value || '');
            });

            deleteMemoryPackBtn?.addEventListener('click', () => {
                deleteActiveMemoryPack();
            });

            copyMemoryPromptBtn?.addEventListener('click', () => {
                copyToClipboard(MEMORY_IMPORT_PROMPT, () => toast('Memory prompt copied', 'success'));
            });

            importMemoryBtn?.addEventListener('click', () => {
                const raw = memoryInput?.value || '';
                const normalized = normalizeImportedMemory(raw);
                if (!normalized) {
                    toast('Paste exported memory before importing', 'warning');
                    return;
                }
                setImportedMemory(normalized);
            });

            clearMemoryBtn?.addEventListener('click', () => {
                if (!state.memoryRaw && !(memoryInput?.value || '').trim()) {
                    toast('No memory to clear', 'info');
                    return;
                }
                if (memoryInput) memoryInput.value = '';
                setImportedMemory('', { announce: true });
            });

            memoryToolsToggle?.addEventListener('click', () => {
                const open = memoryToolsToggle.getAttribute('aria-expanded') === 'true';
                setMemoryToolsOpen(!open);
            });

            outputStyleSelect?.addEventListener('change', () => {
                state.outputStyle = outputStyleSelect.value || 'default';
                localStorage.setItem('vt_output_style', state.outputStyle);
                renderMemoryUi();
                renderAssistantMessages();
                scheduleWorkspaceSave();
                toast(`Output style: ${outputStyleSelect.selectedOptions?.[0]?.textContent || 'Default'}`, 'info');
            });

            askTranscriptInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (state.aiBusy) return;
                    askTranscriptQuestion(askTranscriptInput.value, { button: askTranscriptBtn });
                }
            });

            askTranscriptBtn?.addEventListener('click', () => {
                if (state.aiBusy) return;
                askTranscriptQuestion(askTranscriptInput?.value || '', { button: askTranscriptBtn });
            });

            glossaryInput.addEventListener('input', () => {
                state.glossaryRaw = glossaryInput.value;
                localStorage.setItem('vt_glossary', state.glossaryRaw);
                scheduleWorkspaceSave();
            });

            // â”€â”€â”€ File Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            ['dragover', 'dragenter'].forEach(evt => {
                dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'drop'].forEach(evt => {
                dropZone.addEventListener(evt, () => {
                    dropZone.classList.remove('drag-over');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
            });

            function handleFileSelect(file) {
                // Validate
                if (file.size > 200 * 1024 * 1024) {
                    toast('File too large - max 200MB', 'error');
                    return;
                }

                const audioTypes = ['audio/', 'video/mp4'];
                const isAudio = audioTypes.some(t => file.type.startsWith(t)) || /\.(mp3|wav|m4a|flac|ogg|webm|mp4|aac|wma|opus)$/i.test(file.name);
                if (!isAudio) {
                    toast('Please upload an audio file', 'error');
                    return;
                }

                state.uploadedFile = file;
                state.fileHash = '';
                state.cacheKey = '';

                // Show file info
                fileName.textContent = file.name;
                fileMeta.innerHTML = `<span>${formatFileSize(file.size)}</span>`;

                // Set audio player
                const url = URL.createObjectURL(file);
                fileAudioPlayer.src = url;
                fileAudioPlayer.onloadedmetadata = () => {
                    const dur = fileAudioPlayer.duration;
                    fileMeta.innerHTML += `<span>${fmtTime(dur * 1000)}</span>`;
                };

                dropZone.style.display = 'none';
                fileInfo.classList.add('visible');
                audioAnalysisEl.classList.remove('visible');
                setCacheStatus('Ready for new file');
                updateTranscribeBtn();
                scheduleWorkspaceSave();
            }

            $('fileRemoveBtn').addEventListener('click', () => {
                state.uploadedFile = null;
                state.uploadedAudioBuffer = null;
                state.audioAnalysis = null;
                state.fileHash = '';
                state.cacheKey = '';
                fileInput.value = '';
                fileAudioPlayer.src = '';
                fileInfo.classList.remove('visible');
                audioAnalysisEl.classList.remove('visible');
                dropZone.style.display = '';
                updateTranscribeBtn();
            });

            transcribeBtn.addEventListener('click', processUploadedFile);

            progressCancel.addEventListener('click', () => {
                if (state.abortController) {
                    state.abortController.abort();
                }
            });

            presetSelect.addEventListener('change', () => {
                state.preset = presetSelect.value;
                localStorage.setItem('vt_preset', state.preset);
                const preset = state.preset;
                if (preset === 'dictation') {
                    state.smartPunctEnabled = true;
                    state.autoCopyEnabled = true;
                    state.speakerMode = false;
                } else if (preset === 'meeting') {
                    state.smartPunctEnabled = true;
                    state.autoCopyEnabled = false;
                    state.speakerMode = true;
                } else if (preset === 'subtitle') {
                    state.smartPunctEnabled = true;
                    state.autoCopyEnabled = false;
                    state.speakerMode = false;
                    setMode('file');
                } else if (preset === 'interview') {
                    state.smartPunctEnabled = true;
                    state.autoCopyEnabled = false;
                    state.speakerMode = true;
                } else if (preset === 'voice-notes') {
                    state.smartPunctEnabled = true;
                    state.autoCopyEnabled = true;
                    state.speakerMode = false;
                }
                punctBtn.classList.toggle('on', state.smartPunctEnabled);
                autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
                speakerModeToggle.classList.toggle('on', state.speakerMode);
                rebuildTranscriptFromSegments();
                scheduleWorkspaceSave();
                toast(`Preset applied: ${preset}`, 'success');
                updateDiagnostics({ preset });
            });

            speakerModeToggle.addEventListener('click', () => {
                state.speakerMode = !state.speakerMode;
                localStorage.setItem('vt_speaker_mode', state.speakerMode ? '1' : '0');
                speakerModeToggle.classList.toggle('on', state.speakerMode);
                rebuildTranscriptFromSegments(true);
            });

            autosaveToggle.addEventListener('click', () => {
                state.autosaveEnabled = !state.autosaveEnabled;
                localStorage.setItem('vt_autosave', state.autosaveEnabled ? '1' : '0');
                autosaveToggle.classList.toggle('on', state.autosaveEnabled);
                if (state.autosaveEnabled) writeWorkspaceToStorage();
                toast(state.autosaveEnabled ? 'Workspace autosave enabled' : 'Workspace autosave disabled', 'info');
            });

            rebuildTranscriptBtn.addEventListener('click', () => rebuildTranscriptFromSegments(true));

            $('diagToggleBtn').addEventListener('click', () => {
                diagnosticsPanel.classList.toggle('visible');
            });

            $('applyGlossaryBtn').addEventListener('click', () => {
                state.segments = state.segments.map((seg, idx) => normalizeSegment({ ...seg, text: applyGlossaryToText(seg.text) }, idx));
                transcript.value = cleanTranscriptLocal(transcript.value);
                state.confirmedText = transcript.value;
                renderSegments();
                rebuildTranscriptFromSegments();
                toast('Glossary applied', 'success');
            });

            $('cleanLocalBtn').addEventListener('click', () => {
                transcript.value = cleanTranscriptLocal(transcript.value);
                state.confirmedText = transcript.value;
                updateStats();
                scheduleWorkspaceSave();
                toast('Transcript cleaned locally', 'success');
            });

            $('redactBtn').addEventListener('click', () => {
                transcript.value = redactSensitiveText(transcript.value);
                aiOutput.value = redactSensitiveText(aiOutput.value);
                state.segments = state.segments.map((seg, idx) => normalizeSegment({ ...seg, text: redactSensitiveText(seg.text) }, idx));
                renderSegments();
                rebuildTranscriptFromSegments();
                toast('Sensitive patterns redacted', 'success');
            });

            $('saveWorkspaceBtn').addEventListener('click', () => {
                writeWorkspaceToStorage();
                toast('Workspace saved locally', 'success');
            });

            $('exportWorkspaceBtn').addEventListener('click', () => {
                const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                downloadFile(generateWorkspaceJSON(), `workspace-${ts}.json`, 'application/json;charset=utf-8');
                toast('Workspace exported', 'success');
            });

            $('importWorkspaceBtn').addEventListener('click', () => workspaceFileInput.click());
            workspaceFileInput.addEventListener('change', async () => {
                const file = workspaceFileInput.files[0];
                if (!file) return;
                try {
                    const parsed = safeJsonParse(await file.text(), null);
                    if (!parsed) throw new Error('Invalid workspace JSON');
                    localStorage.setItem('vt_workspace_v2', JSON.stringify(parsed));
                    restoreWorkspaceIfAny();
                    toast('Workspace imported', 'success');
                } catch (err) {
                    toast(err.message, 'error');
                } finally {
                    workspaceFileInput.value = '';
                }
            });

            $('clearCacheBtn').addEventListener('click', () => {
                Object.keys(localStorage).filter(k => k.startsWith('vt_tc::')).forEach(k => localStorage.removeItem(k));
                Object.keys(localStorage).filter(k => k.includes('::partial')).forEach(k => localStorage.removeItem(k));
                setCacheStatus('Transcript cache cleared');
                toast('Transcript cache cleared', 'info');
            });

            function buildPromptPackTask() {
                const preset = state.preset || 'dictation';
                const taskMap = {
                    prompt: {
                        doneMessage: 'Prompt pack ready',
                        system: 'You convert rough spoken notes into a strong prompt for a reasoning model. Optimize for clarity, constraints, deliverables, and production-grade output.',
                        user: 'Convert this transcript into a paste-ready prompt for ChatGPT/Claude. Include: Goal, Context, Constraints, Required Output, Non-negotiables, and the raw notes at the end.'
                    },
                    build: {
                        doneMessage: 'Build spec ready',
                        system: 'You turn spoken engineering notes into a production-grade build specification.',
                        user: 'Convert this transcript into a structured BUILD brief with sections: Goal, Scope, Architecture, Ownership Boundaries, Data Contracts, Scaling Risks, Rate Limit Risks, Minimal Build, Production Build, and Final Implementation Notes.'
                    },
                    debug: {
                        doneMessage: 'Debug report ready',
                        system: 'You turn spoken debugging notes into a root-cause-first engineering report.',
                        user: 'Convert this transcript into a DEBUG report with sections: System Summary, Failure Location, Root Cause, Immediate Fix, Structural Fix, Production-safe Fix, and Validation Steps.'
                    },
                    docs: {
                        doneMessage: 'Docs notes ready',
                        system: 'You convert spoken notes into clean operational documentation.',
                        user: 'Convert this transcript into documentation-ready notes with sections: Objective, Scope, Assumptions, Steps, Validation, Risks, and Handoff Notes.'
                    }
                };
                const fallback = {
                    doneMessage: 'Prompt pack ready',
                    system: 'You convert rough spoken notes into a strong prompt for a reasoning model. Optimize for clarity, constraints, deliverables, and production-grade output.',
                    user: 'Convert this transcript into a paste-ready prompt for ChatGPT/Claude. Include: Goal, Context, Constraints, Required Output, Non-negotiables, and the raw notes at the end.'
                };
                const cfg = taskMap[preset] || fallback;
                return { name: `prompt-pack-${preset}`, ...cfg };
            }

            const aiTasks = {
                clean: {
                    name: 'ai-clean',
                    doneMessage: 'AI clean complete',
                    system: 'You clean transcripts for final use. Preserve meaning, keep technical terms exact, and improve readability.',
                    user: 'Rewrite this transcript into a clean, readable version. Keep it faithful. Preserve domain terms and important details.'
                },
                summary: {
                    name: 'summary',
                    doneMessage: 'Summary ready',
                    system: 'You summarize spoken transcripts into operational notes. Keep it concise and structured.',
                    user: 'Create a crisp summary with sections: Overview, Key Points, Risks, Open Questions.'
                },
                actions: {
                    name: 'action-items',
                    doneMessage: 'Action items ready',
                    system: 'You extract execution-oriented action items from transcripts. Be precise and concrete.',
                    user: 'Extract action items, decisions, next steps, and owners if mentioned. Use bullet points.'
                }
            };

            $('cleanAiBtn').addEventListener('click', () => callChatModel(aiTasks.clean, transcript.value, { button: $('cleanAiBtn') }));
            $('summaryBtn').addEventListener('click', () => callChatModel(aiTasks.summary, transcript.value, { button: $('summaryBtn') }));
            $('actionItemsBtn').addEventListener('click', () => callChatModel(aiTasks.actions, transcript.value, { button: $('actionItemsBtn') }));
            $('promptPackBtn').addEventListener('click', () => callChatModel(buildPromptPackTask(), transcript.value, { button: $('promptPackBtn') }));

            $('copyAiOutputBtn').addEventListener('click', () => {
                const text = aiOutput.value.trim();
                if (!text) { toast('No AI output yet', 'warning'); return; }
                copyToClipboard(text, () => toast('AI output copied', 'success'));
            });

            $('clearAiOutputBtn').addEventListener('click', () => {
                aiOutput.value = '';
                sessionStorage.setItem('vt_ai_output', '');
                scheduleWorkspaceSave();
            });

            aiOutput.addEventListener('input', () => {
                sessionStorage.setItem('vt_ai_output', aiOutput.value);
                scheduleWorkspaceSave();
            });

            captureSourceSelect?.addEventListener('change', () => {
                setCaptureSource(captureSourceSelect.value);
            });

            captureHelpToggle?.addEventListener('click', () => {
                setCaptureHelpOpen(!state.captureHelpOpen);
                renderCaptureUi();
            });

            shortcutsToggle?.addEventListener('click', () => {
                const open = shortcutsToggle.getAttribute('aria-expanded') === 'true';
                setShortcutsOpen(!open);
            });

            aiOutputToggle?.addEventListener('click', () => {
                const open = aiOutputToggle.getAttribute('aria-expanded') === 'true';
                setAiOutputOpen(!open);
            });

            function updateDiagnostics(patch = {}, logLine = '') {
                state.diagnostics = {
                    ...(state.diagnostics || {}),
                    browserFamily: runtimeCapabilities.browserFamily,
                    platformFamily: runtimeCapabilities.platformFamily,
                    captureSource: state.captureSource,
                    captureMode: state.mode,
                    hasDisplayMedia: runtimeCapabilities.hasDisplayMedia,
                    recorderMimeType: state.recorderMimeType || 'auto',
                    liveRecognitionAvailable: runtimeCapabilities.hasSpeechRecognition,
                    qualityCaptureAvailable: runtimeCapabilities.supportsMicQuality,
                    isSecureContext: runtimeCapabilities.isSecureContext,
                    ...(patch || {}),
                    updatedAt: new Date().toISOString()
                };
                sessionStorage.setItem('vt_diag', JSON.stringify(state.diagnostics));
                const entries = [
                    ['Browser', state.diagnostics.browserFamily || runtimeCapabilities.browserFamily],
                    ['Platform', state.diagnostics.platformFamily || runtimeCapabilities.platformFamily],
                    ['Capture source', state.diagnostics.captureSource || state.captureSource || 'mic'],
                    ['Capture mode', state.diagnostics.captureMode || state.mode || 'realtime'],
                    ['Live ready', state.diagnostics.liveRecognitionAvailable ? 'YES' : 'NO'],
                    ['Quality ready', state.diagnostics.qualityCaptureAvailable ? 'YES' : 'NO'],
                    ['Display capture', state.diagnostics.hasDisplayMedia ? 'YES' : 'NO'],
                    ['Recorder mime', state.diagnostics.recorderMimeType || 'auto'],
                    ['Provider', state.diagnostics.provider || state.apiProvider || 'UNKNOWN'],
                    ['Audio model', state.diagnostics.audioModel || getApiModel() || 'UNKNOWN'],
                    ['Audio task', state.diagnostics.audioTask || 'transcribe'],
                    ['Chat model', state.diagnostics.chatModel || getActiveChatModel() || 'UNKNOWN'],
                    ['Preset', state.diagnostics.preset || state.preset || 'UNKNOWN'],
                    ['Detected lang', state.detectedLanguage || state.diagnostics.detectedLanguage || 'UNKNOWN'],
                    ['Segments', String(state.segments?.length || 0)],
                    ['Duration', state.audioDurationSec ? `${state.audioDurationSec.toFixed(1)}s` : 'UNKNOWN'],
                    ['Retries', String(state.diagnostics.retries || 0)],
                    ['Cache', state.diagnostics.cacheHit ? 'HIT' : (state.diagnostics.cacheKey ? 'READY' : 'MISS')],
                    ['File hash', state.fileHash || state.diagnostics.fileHash || 'UNKNOWN']
                ];
                diagGrid.innerHTML = entries.map(([label, value]) => `<div class="diag-card"><div class="diag-label">${escapeHtml(label)}</div><div class="diag-value">${escapeHtml(String(value))}</div></div>`).join('');
                if (logLine) {
                    const ts = new Date().toLocaleTimeString();
                    diagLog.value = `[${ts}] ${logLine}\n` + (diagLog.value || '');
                }
            }

            function setStatus(main, sub) {
                statusMain.textContent = normalizeUiText(main);
                statusSub.textContent = normalizeUiText(sub);
                if (orbStatusMain) orbStatusMain.textContent = normalizeUiText(main);
            }

            function clearNoSpeechTimer() {
                clearTimeout(state.noSpeechTimer);
                if (state.isRecording) {
                    const active = getActiveStatusForCurrentState();
                    statusSub.textContent = active.sub;
                }
            }

            function startQualityRecording() {
                if (!canUseQualityMode()) {
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    toast('This capture source is not available in this browser. Open Capture Help for the fallback path.', 'warning', 4200);
                    return;
                }
                acquireCaptureStream(state.captureSource).then(stream => {
                    state.recordedChunks = [];
                    state.recorderMimeType = pickRecorderMimeType();
                    const options = state.recorderMimeType ? { mimeType: state.recorderMimeType } : {};
                    state.mediaRecorder = new MediaRecorder(stream, options);
                    updateDiagnostics({
                        captureSource: state.captureSource,
                        captureMode: 'quality',
                        recorderMimeType: state.recorderMimeType || 'default'
                    }, `Quality capture ready via ${state.captureSource}`);

                    state.mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) state.recordedChunks.push(e.data);
                    };

                    state.mediaRecorder.onstop = async () => {
                        const outputType = state.mediaRecorder?.mimeType || state.recorderMimeType || 'audio/webm';
                        const blob = new Blob(state.recordedChunks, { type: outputType });
                        stopActiveCaptureTracks();

                        if (!getProviderKeys().length) {
                            toast('API key required for Quality mode transcription', 'warning');
                            interimEl.textContent = 'Interim transcription appears here as you speak...';
                            interimEl.classList.add('idle-hint');
                            const ready = getReadyStatusForCurrentState();
                            setStatus(ready.main, ready.sub);
                            return;
                        }

                        setStatus('Processing recording...', 'Sending captured audio to speech-to-text');
                        interimEl.textContent = 'Transcribing your recording...';
                        interimEl.classList.remove('idle-hint');

                        try {
                            const arrayBuf = await blob.arrayBuffer();
                            const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                            let decoded;
                            try {
                                decoded = await tempCtx.decodeAudioData(arrayBuf);
                            } finally {
                                Promise.resolve(tempCtx.close()).catch(() => { });
                            }
                            const analysis = analyzeAudio(decoded);
                            const processed = await processAudioBuffer(decoded, analysis, true);
                            const resampled = await resampleTo16k(processed);
                            const maxChunkBytes = 24 * 1024 * 1024;
                            const chunks = chunkWavBlob(resampled, maxChunkBytes);
                            const wLang = getWhisperLang();
                            const result = await transcribeChunks(chunks, { language: wLang }, null);
                            displayFileResult(result);
                            if (result.language) {
                                detectedLangBadge.textContent = result.language.toUpperCase();
                                detectedLangBadge.style.display = 'inline-block';
                            }
                            toast(`Transcribed - ${result.text.split(/\s+/).length} words`, 'success');
                            scheduleWorkspaceSave();
                        } catch (err) {
                            const message = /decode|encoding|format/i.test(String(err?.message || ''))
                                ? 'Recorder format could not be decoded here. Try File mode or Chrome or Edge for meeting capture.'
                                : `Transcription error: ${err.message}`;
                            toast(message, 'error', 4200);
                        }

                        interimEl.textContent = 'Interim transcription appears here as you speak...';
                        interimEl.classList.add('idle-hint');
                        orbTrigger?.setAttribute('aria-pressed', 'false');
                        const ready = getReadyStatusForCurrentState();
                        setStatus(ready.main, ready.sub);
                        updateDiagnostics({ captureSource: state.captureSource, captureMode: state.mode }, 'Quality capture finished');
                    };

                    state.mediaRecorder.start(1000);
                    state.isRecording = true;
                    recPanel.classList.add('recording');
                    micOuter?.classList.add('recording');
                    orbTrigger?.setAttribute('aria-pressed', 'true');
                    const active = getActiveStatusForCurrentState('quality', state.captureSource);
                    setStatus(active.main, active.sub);
                    interimEl.textContent = state.captureSource === 'mic'
                        ? 'Recording audio for quality transcription...'
                        : `Recording ${getCaptureSourceLabel(state.captureSource).toLowerCase()} for transcription...`;
                    interimEl.classList.remove('idle-hint');
                    startTimer();
                    startAudioVisualizer(stream);
                }).catch(err => {
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    toast(err.message || 'Recording could not start', 'error', 4200);
                });
            }

            function stopQualityRecording() {
                if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                    state.mediaRecorder.stop();
                }
                state.isRecording = false;
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                stopTimer();
                stopAudio();
            }

            function setMode(mode, options = {}) {
                if (state.isRecording) forceStop();
                let nextMode = mode;
                if (nextMode === 'realtime' && (!canUseLiveMode() || state.captureSource !== 'mic')) {
                    if (!options.silent) {
                        toast(state.captureSource !== 'mic'
                            ? 'Live mode only works with the microphone. Switched to Quality.'
                            : 'Live mode is limited in this browser. Switched to Quality.', 'warning', 3600);
                    }
                    nextMode = canUseQualityMode() ? 'quality' : 'file';
                }
                if (nextMode === 'quality' && state.captureSource !== 'external-help' && !canUseQualityMode()) {
                    if (!options.silent) toast('Quality capture is limited here. Switched to File mode.', 'warning', 3600);
                    nextMode = 'file';
                }
                state.mode = nextMode;

                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === nextMode);
                });

                uploadPanel.classList.toggle('visible', nextMode === 'file');
                recPanel.style.display = nextMode === 'file' ? 'none' : '';
                if (nextMode !== 'file') requestAnimationFrame(() => drawOrbFrame(0, false));

                renderCaptureUi();
                const ready = getReadyStatusForCurrentState(nextMode, state.captureSource);
                if (nextMode === 'file') {
                    setStatus('File mode', 'Upload an audio file to transcribe');
                    waveOverlay.textContent = 'Orb preview pauses in file mode';
                } else {
                    setStatus(ready.main, ready.sub);
                    waveOverlay.textContent = ready.sub;
                }
                updateDiagnostics({ captureMode: state.mode }, `Mode set to ${state.mode}`);
            }

            function startRecording() {
                if (state.mode === 'file') return;
                if (state.captureSource === 'external-help') {
                    state.captureHelpOpen = true;
                    renderCaptureUi();
                    toast('Open Capture Help to choose the right recording setup for this device.', 'info', 3800);
                    return;
                }
                if (state.mode === 'realtime' && state.captureSource !== 'mic') {
                    toast('Live mode only works with the microphone. Switched to Quality.', 'warning', 3600);
                    setMode('quality', { silent: true });
                    startQualityRecording();
                    return;
                }
                if (state.mode === 'quality') {
                    if (!state.apiKey) {
                        toast('API key required for Quality mode', 'warning');
                        apiPanel.classList.add('open');
                        return;
                    }
                    startQualityRecording();
                    return;
                }
                if (!canUseLiveMode()) {
                    toast('Live mode is limited in this browser. Use Quality or File mode instead.', 'warning', 4200);
                    setMode(canUseQualityMode('mic') ? 'quality' : 'file', { silent: true });
                    return;
                }
                if (!recognition) {
                    toast('Speech recognition is not available in this browser', 'error');
                    return;
                }
                if (!ensureSecureContextForCapture()) return;
                const lang = langSelect.value;
                recognition.lang = lang === 'auto' ? 'en-US' : lang;
                recognition.start();
                state.isRecording = true;
                recPanel.classList.add('recording');
                micOuter?.classList.add('recording');
                orbTrigger?.setAttribute('aria-pressed', 'true');
                const active = getActiveStatusForCurrentState('realtime', 'mic');
                setStatus(active.main, active.sub);
                interimEl.classList.remove('idle-hint');
                interimEl.textContent = '';
                startTimer();
                startAudioFromMic();
                setNoSpeechTimer();
                updateStats();
                updateDiagnostics({ captureSource: 'mic', captureMode: 'realtime' }, 'Live microphone recording started');
            }

            function stopRecording() {
                if (state.mode === 'quality') {
                    stopQualityRecording();
                    return;
                }
                commitPendingRealtimeInterim();
                state.isRecording = false;
                state.manualStop = true;
                clearNoSpeechTimer();
                clearAutoCopyCountdown();
                autoCopyBtn.classList.remove('auto-copy-active');
                clearTimeout(state.restartTimeout);
                state.restartTimeout = null;
                try {
                    if (recognition && typeof recognition.stop === 'function') recognition.stop();
                    else if (recognition) recognition.abort();
                } catch (e) {
                    try { if (recognition) recognition.abort(); } catch (e2) { }
                }
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                interimEl.textContent = 'Interim transcription appears here as you speak...';
                interimEl.classList.add('idle-hint');
                const ready = getReadyStatusForCurrentState();
                setStatus(ready.main, ready.sub);
                stopTimer();
                stopAudio();
                scheduleWorkspaceSave();
            }

            function forceStop() {
                state.isRecording = false;
                clearNoSpeechTimer();
                clearAutoCopyCountdown();
                autoCopyBtn.classList.remove('auto-copy-active');
                clearTimeout(state.restartTimeout);
                state.restartTimeout = null;
                try { if (recognition) recognition.abort(); } catch (e) { }
                if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                    try { state.mediaRecorder.stop(); } catch (e) { }
                }
                recPanel.classList.remove('recording');
                micOuter?.classList.remove('recording');
                orbTrigger?.setAttribute('aria-pressed', 'false');
                stopTimer();
                stopAudio();
                stopActiveCaptureTracks();
            }

            function getWorkspacePayload() {
                return {
                    version: 3,
                    savedAt: new Date().toISOString(),
                    mode: state.mode,
                    captureSource: state.captureSource,
                    preset: state.preset,
                    transcript: transcript.value,
                    aiOutput: aiOutput.value,
                    segments: state.segments,
                    detectedLanguage: state.detectedLanguage,
                    speakerMode: state.speakerMode,
                    glossaryRaw: state.glossaryRaw,
                    memoryRaw: state.memoryRaw,
                    memoryImportedAt: state.memoryImportedAt,
                    memoryPacks: state.memoryPacks,
                    activeMemoryPackId: state.activeMemoryPackId,
                    outputStyle: state.outputStyle,
                    diagnostics: state.diagnostics,
                    fileHash: state.fileHash,
                    audioDurationSec: state.audioDurationSec,
                    provider: state.apiProvider,
                    audioModel: state.audioModel,
                    chatModel: state.chatModel
                };
            }

            function restoreWorkspaceIfAny() {
                const payload = safeJsonParse(localStorage.getItem('vt_workspace_v2') || '', null);
                if (!payload) {
                    workspaceStatus.textContent = 'No saved workspace';
                    return;
                }
                state.mode = payload.mode || state.mode;
                state.captureSource = payload.captureSource || state.captureSource;
                state.preset = payload.preset || state.preset;
                presetSelect.value = state.preset;
                state.speakerMode = !!payload.speakerMode;
                speakerModeToggle.classList.toggle('on', state.speakerMode);
                transcript.value = payload.transcript || '';
                state.confirmedText = transcript.value;
                aiOutput.value = payload.aiOutput || '';
                state.aiOutput = aiOutput.value;
                state.segments = Array.isArray(payload.segments) ? payload.segments.map((seg, idx) => normalizeSegment(seg, idx)) : [];
                state.detectedLanguage = payload.detectedLanguage || '';
                state.memoryRaw = normalizeImportedMemory(payload.memoryRaw || state.memoryRaw || '');
                state.memoryImportedAt = payload.memoryImportedAt || state.memoryImportedAt || '';
                state.memoryPacks = normalizeMemoryPacks(payload.memoryPacks || state.memoryPacks || []);
                state.activeMemoryPackId = payload.activeMemoryPackId || state.activeMemoryPackId || state.memoryPacks[0]?.id || '';
                state.outputStyle = payload.outputStyle || state.outputStyle || 'default';
                syncActiveMemoryPackState();
                state.diagnostics = payload.diagnostics || state.diagnostics || {};
                state.fileHash = payload.fileHash || '';
                state.audioDurationSec = Number(payload.audioDurationSec || 0);
                persistMemoryStore();
                renderMemoryUi();
                renderCaptureUi();
                setMode(state.mode || 'realtime', { silent: true });
                if (captureSourceSelect) captureSourceSelect.value = state.captureSource;
                renderSegments();
                if (!state.segments.length) updateStats();
                workspaceStatus.textContent = `Restored ${new Date(payload.savedAt || Date.now()).toLocaleString()}`;
                if (state.fileHash) setCacheStatus(`Workspace restored for ${state.fileHash.slice(0, 12)}...`);
            }

            updateDiagnostics(state.diagnostics || {}, 'Studio initialized');
            restoreWorkspaceIfAny();
            updateDiagnostics({ speechRecognition: !!recognition, autosave: state.autosaveEnabled, provider: state.apiProvider, audioModel: getApiModel(), audioTask: 'transcribe', chatModel: getActiveChatModel() }, 'Runtime self-check complete');

            // â”€â”€â”€ Keyboard Shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement.tagName.toLowerCase();
                const isTyping = tag === 'textarea' || tag === 'input' || tag === 'select';

                // Space: toggle recording
                if (e.code === 'Space' && !isTyping) {
                    e.preventDefault();
                    if (state.mode !== 'file') {
                        state.isRecording ? stopRecording() : startRecording();
                    }
                }

                // Escape: cancel / clear interim
                if (e.code === 'Escape') {
                    if (state.assistant?.isOpen && tag !== 'textarea') {
                        e.preventDefault();
                        setAssistantOpen(false);
                        return;
                    }
                    if (state.isProcessing && state.abortController) {
                        state.abortController.abort();
                    }
                    interimEl.textContent = '';
                    downloadDropdown.classList.remove('open');
                }

                // Ctrl+C: copy (when not in textarea)
                if (e.ctrlKey && e.key === 'c' && !isTyping) {
                    e.preventDefault();
                    $('copyBtn').click();
                }

                // Ctrl+D: download
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    const text = transcript.value.trim();
                    if (text) {
                        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                        downloadFile(text, `transcript-${ts}.txt`, 'text/plain;charset=utf-8');
                        toast('Downloaded as TXT', 'success');
                    }
                }

                // Ctrl+O: open file
                if (e.ctrlKey && e.key === 'o') {
                    e.preventDefault();
                    setMode('file');
                    fileInput.click();
                }

                // Ctrl+U: attach assistant file
                if (e.ctrlKey && e.key.toLowerCase() === 'u' && state.assistant?.isOpen) {
                    e.preventDefault();
                    if (!assistantAttachBtn?.disabled) {
                        assistantFileInput.value = '';
                        assistantFileInput.click();
                    }
                }

                // Ctrl+Enter: transcribe file
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    if (state.mode === 'file' && state.uploadedFile && state.apiKey) {
                        processUploadedFile();
                    }
                }

                // Ctrl+Delete: clear all
                if (e.ctrlKey && e.key === 'Delete') {
                    e.preventDefault();
                    $('clearBtn').click();
                }

                // Ctrl+Z: undo (when not in textarea)
                if (e.ctrlKey && e.key === 'z' && !isTyping) {
                    if (state.undoBuffer) {
                        transcript.value = state.undoBuffer;
                        state.confirmedText = state.undoBuffer;
                        updateStats();
                        toast('Recovered last text', 'success');
                    } else {
                        toast('Nothing to recover', 'info');
                    }
                }

                // Ctrl+Shift+Q: toggle quality mode
                if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
                    e.preventDefault();
                    setMode(state.mode === 'quality' ? 'realtime' : 'quality');
                    toast('Mode: ' + state.mode, 'info');
                }

                // Ctrl+Shift+P: copy AI output
                if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                    if (aiOutput.value.trim()) {
                        e.preventDefault();
                        $('copyAiOutputBtn').click();
                    }
                }
            });

            // â”€â”€â”€ Canvas Resize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            function resizeCanvas() {
                ensureCanvasSize();
                drawOrbFrame(state.visualLevel || 0, state.isRecording);
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // â”€â”€â”€ Init State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            punctBtn.classList.toggle('on', state.smartPunctEnabled);
            autoCopyBtn.classList.toggle('on', state.autoCopyEnabled);
            speakerModeToggle.classList.toggle('on', state.speakerMode);
            autosaveToggle.classList.toggle('on', state.autosaveEnabled);
            setAiOutputOpen(!isTouchPrimary());
            renderMemoryUi();
            updateStats();
            updateTranscribeBtn();
            updateVaultMeta();
            setCaptureSource(state.captureSource, { silent: true });
            setMode(state.mode || 'realtime', { silent: true });
            ensureAssistantThread();
            setAssistantModel(state.assistant.model || defaultAssistantModelId(), { skipRender: true, skipAttachmentCheck: true });
            state.assistant.ui = sanitizeAssistantUiState(state.assistant.ui);
            state.assistant.unread = state.assistant.ui.unread;
            state.assistant.maximized = false;
            state.assistant.showHistory = !!state.assistant.ui.showHistory;
            assistantInput.value = state.assistant.draft || '';
            setAssistantDraft(state.assistant.draft || '');
            renderAssistantMessages();
            setAssistantOpen(!!state.assistant.ui.isOpen);
            updateDiagnostics(state.diagnostics || {}, 'Ready');
        }
