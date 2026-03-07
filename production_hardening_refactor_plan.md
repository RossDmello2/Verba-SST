# Production Hardening Refactor Plan

## Goal

Stabilize the `time pass` app so new features can be added without making the codebase fragile, overly coupled, or difficult to debug.

This plan is for structure and maintainability. It does not change user-facing product goals.

## Current Risk

The app is powerful, but the implementation is now concentrated in one large script with overlapping responsibilities:

- recording logic
- file transcription
- AI Output actions
- imported memory
- memory packs
- assistant chat
- workspace persistence
- UI rendering
- keyboard shortcuts
- diagnostics

This works, but it creates these production risks:

- feature additions can break unrelated areas
- duplicate function definitions make behavior harder to reason about
- prompt logic is spread across multiple places
- state is shared implicitly rather than through clear interfaces
- testing individual behavior is difficult

## Refactor Direction

Keep the current product experience, but split the implementation into clear subsystems with stable boundaries.

## Target Architecture

```text
index.html
  -> shell only

style.css
  -> theme + layout + component styling

script.js
  -> bootstraps app only

modules/
  runtime-state.js
  recording.js
  file-transcription.js
  transcript-workspace.js
  memory-store.js
  ai-output.js
  assistant.js
  workspace-persistence.js
  ui-renderers.js
  diagnostics.js
  keyboard-shortcuts.js
```

## Recommended Refactor Order

### 1. Remove duplicate active logic

First identify and remove duplicate function definitions so there is only one live implementation for:

- `setMode`
- `startRecording`
- `restoreWorkspaceIfAny`
- `updateDiagnostics`
- `getWorkspacePayload`

This is the highest-risk issue because later definitions silently override earlier ones.

### 2. Centralize app state

Create one state module that owns:

- runtime mode
- capture source
- transcript
- segments
- AI output
- memory packs
- active memory pack
- output style
- assistant state
- workspace metadata

All features should read and update state through explicit helpers instead of scattered direct mutation.

### 3. Extract shared prompt construction

Create a shared prompt builder for:

- AI Output
- Ask This Transcript
- Verba Assistant

This should standardize:

- transcript context
- memory context
- output style
- runtime state
- task instructions

That prevents prompt drift and inconsistent behavior.

### 4. Isolate memory system

Move imported memory and memory packs into a dedicated module.

Responsibilities:

- load/save memory packs
- switch active pack
- normalize imported memory
- expose shared prompt-safe memory context
- expose UI metadata such as active pack and import time

This keeps memory from being tangled with transcript and assistant code.

### 5. Separate recording/transcription from AI features

Recording and transcription should not depend on AI Output or assistant code.

Split into:

- live recording
- quality recording
- file transcription
- transcript update/render

These should only produce transcript data and diagnostics.

### 6. Separate UI rendering from feature behavior

Right now, rendering and behavior are mixed heavily.

Move UI responsibilities into small render/update helpers:

- render memory UI
- render assistant UI
- render capture UI
- render stats
- render history
- render diagnostics

This makes future UI work safer.

### 7. Normalize persistence rules

Create one persistence layer for:

- local settings
- workspace save/restore
- memory packs
- assistant conversations
- transcript cache

Each store should have a single read/write path and a clear storage key contract.

### 8. Add smoke-test checklist

Before and after any major feature, verify:

- Live recording
- Quality recording
- File transcription
- Memory import
- Memory pack switching
- AI Output actions
- Ask This Transcript
- Assistant chat
- Workspace save/restore
- Download/export

Even if formal automated tests are not added yet, this checklist becomes the release gate.

## Safe Feature Policy After Refactor

After the cleanup, new features should only be added if they fit one of these extension points:

- new AI task
- new assistant prompt tool
- new memory transformation
- new transcript utility
- new UI card/drawer

If a feature requires editing unrelated subsystems directly, the architecture is slipping again.

## Best Next Features After Refactor

These become much safer after cleanup:

- richer memory pack metadata
- reusable output templates
- artifact-style deliverables
- transcript Q&A presets
- current-web-context integration

## Acceptance Criteria

This refactor is successful when:

- no duplicate core functions remain
- memory, assistant, and AI Output use one shared prompt-building layer
- recording/transcription can be edited without touching assistant logic
- memory packs can be edited without touching recording code
- save/restore behavior is predictable
- adding one new AI action does not require editing many unrelated sections

## Practical Recommendation

Do this before adding many more features.

The current app is still workable, but it is near the point where every new addition will cost more than it should. One structural cleanup pass now will make future development much faster and safer.
