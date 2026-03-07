# Mobile-First Recording Architecture

## Intent

This document proposes a responsive architecture for the `time pass` voice transcriber so the most important actions stay easy to reach on phone, tablet, and laptop.

This is a design and architecture note only. No code is changed by this document.

## Core Product Priorities

The UI should always prioritize these actions in this order:

1. Recording
2. Copy transcript
3. Assistant
4. Secondary tools like API setup, AI output, history, diagnostics, and file upload

## Current Problem

The current app works best in a taller desktop-style layout. On smaller screens or reduced window heights:

- the user lands too high in the page
- the main recording orb can sit too far below the fold
- copy and assistant are not grouped as the most reachable actions
- support and setup sections consume vertical space before the main action

That creates friction on phones, tablets, and minimized laptop windows where recording should be immediately accessible.

## Design Direction

The app should shift from a desktop-first reading flow to a task-first responsive flow:

- first screen should expose recording immediately
- setup sections should collapse into dropdown drawers
- copy and assistant should remain fixed in a compact action dock
- transcript should stay close to recording, not far below it
- AI output and advanced tools should move lower in the flow on smaller screens

## Recommended Architecture

### Desktop

Keep the wider workspace, but make the center column visibly dominant.

```text
+--------------------------------------------------------------------------------------------------+
| HEADER                                                                                           |
| Brand | status | shortcuts                                                                       |
+--------------------------------------------------------------------------------------------------+
| API CONFIG (collapsible, open if needed)                                                         |
+--------------------------------------------------------------------------------------------------+
| TOP CONTROL BAND                                                                                 |
| Mode | Language | Punctuation | Auto-copy | Preset | Speaker labels | Autosave | Quick tools    |
+--------------------------------------------------------------------------------------------------+
| LEFT SUPPORT RAIL        | MAIN RECORDING WORKSPACE                    | RIGHT UTILITY RAIL      |
|--------------------------|---------------------------------------------|-------------------------|
| Capture setup dropdown   | Recording hero / orb                        | Session summary         |
| Keyboard dropdown        | Live interim text                           | View toggle             |
| File tools dropdown      | Transcript panel                            | History                 |
| AI output panel          | Transcript Studio                           | Download / clear        |
|                          | Diagnostics                                 |                         |
+--------------------------------------------------------------------------------------------------+
| FIXED BOTTOM-RIGHT DOCK: [ Copy ] [ Assistant ]                                                 |
+--------------------------------------------------------------------------------------------------+
```

### Tablet

Tablet should stop behaving like a narrow desktop and instead become a stacked task layout.

```text
+-----------------------------------------------------------------------------------+
| HEADER                                                                            |
+-----------------------------------------------------------------------------------+
| PRIMARY CONTROL BAND                                                              |
| Mode | Language | Punct | Auto-copy                                               |
+-----------------------------------------------------------------------------------+
| RECORDING HERO                                                                    |
| Orb | timer | live status                                                         |
+-----------------------------------------------------------------------------------+
| TRANSCRIPT ACTION DOCK                                                            |
| [ Copy ] [ Assistant ]                                                            |
+-----------------------------------------------------------------------------------+
| TRANSCRIPT PANEL                                                                  |
+-----------------------------------------------------------------------------------+
| TRANSCRIPT STUDIO                                                                 |
+-----------------------------------------------------------------------------------+
| DROPDOWN DRAWERS                                                                  |
| [ API config ] [ Capture guide ] [ Keyboard ] [ AI output ] [ History ]           |
+-----------------------------------------------------------------------------------+
```

### Phone

Phone should become a single-column priority stack where recording is above everything else.

```text
+------------------------------------------------------+
| COMPACT HEADER                                       |
| Brand | status                                       |
+------------------------------------------------------+
| PRIMARY MINI BAR                                     |
| Live/Quality/File | Lang                             |
+------------------------------------------------------+
| RECORDING CARD                                       |
|                                                      |
|                 RECORD ORB                           |
|            status + timer + waveform                 |
|                                                      |
+------------------------------------------------------+
| FIXED ACTION DOCK                                    |
| [ Copy ] [ Assistant ]                               |
+------------------------------------------------------+
| TRANSCRIPT CARD                                      |
+------------------------------------------------------+
| TRANSCRIPT STUDIO CARD                               |
+------------------------------------------------------+
| COLLAPSIBLE DRAWERS                                  |
| [ API config ]                                       |
| [ Capture setup ]                                    |
| [ Keyboard shortcuts ]                               |
| [ AI output ]                                        |
| [ History / download / clear ]                       |
| [ Diagnostics ]                                      |
+------------------------------------------------------+
```

## Best Practical Layout Rules

### 1. Recording must stay above the fold

On phone and short-height laptop windows, the app should open with the recording section visible immediately.

That means:

- header becomes shorter
- API configuration collapses by default
- support sections move below the recording area
- recording card appears before transcript and before utilities

### 2. Copy and Assistant become a paired action dock

These are the two most important follow-up actions after recording starts.

Placement rule:

- desktop: fixed bottom-right
- tablet: fixed bottom-right or bottom-center
- phone: fixed bottom dock above safe area inset

The pair should always stay visible and should not require scrolling.

### 3. Advanced sections move into dropdown drawers

These sections should not consume first-screen space on smaller devices:

- API Configuration
- Capture setup guide
- Keyboard quick access
- AI Output
- History
- Diagnostics

Each drawer should open only when needed and close cleanly without affecting core recording access.

### 4. Transcript stays near recording

The transcript should appear directly below the recording card on phone and tablet. The user should not record at the top and then hunt much further down to see the text.

### 5. Transcript Studio expands, AI Output becomes secondary

Transcript Studio is part of the main workflow. AI Output is useful, but secondary.

So on constrained screens:

- Transcript Studio stays higher
- AI Output moves lower into a collapsible drawer

## Proposed Information Hierarchy

### Always visible

- mode toggle
- language selector
- recording orb
- timer / status
- copy
- assistant

### Usually visible after a short scroll

- transcript
- transcript studio

### Hidden behind dropdowns by default

- API config
- capture guide
- keyboard shortcuts
- AI output
- history
- diagnostics

## Interaction Model

### Desktop behavior

- keep broad layout
- keep utility rails
- keep assistant/copy dock fixed
- keep transcript studio in main workspace

### Tablet behavior

- collapse side rails into drawers
- move recording hero to top priority
- keep transcript immediately below recording
- reduce decorative spacing

### Phone behavior

- single-column layout only
- compact header
- compact controls
- no nonessential card should appear before recording
- assistant/copy dock fixed at bottom
- drawers below transcript/studio

## Non-Overlap Rules

This layout must protect existing functionality.

- fixed action dock must not cover transcript typing area
- dropdown drawers must open upward or in-flow depending on available space
- assistant panel must not hide recording controls
- copy button must keep its current behavior, only with better placement
- recording orb must remain the visual focal point
- transcript studio and AI tools must not compete for the same small-screen slot

## Production-Safe Recommendation

The safest production approach is:

1. Keep desktop close to the current structure.
2. Redesign tablet and phone around recording-first access.
3. Treat setup and support blocks as collapsible drawers.
4. Keep `Copy + Assistant` permanently reachable.
5. Put transcript directly under recording.
6. Move AI Output below the main working area on smaller screens.

## Recommended Final Architecture

This is the best overall version for production.

```text
DESKTOP

Top: header + setup + control band
Body: left support | main recording/transcript/studio | right utilities
Fixed: copy + assistant dock

TABLET

Top: compact controls
Then: recording hero
Then: fixed copy + assistant
Then: transcript
Then: transcript studio
Then: collapsible support drawers

PHONE

Top: compact header
Then: mode + language
Then: recording hero
Fixed bottom: copy + assistant
Then: transcript
Then: transcript studio
Then: dropdown drawers for everything else
```

## Why This Solves Your Issue

This architecture directly fixes the main inconvenience:

- recording is reachable immediately
- minimized or short screens do not force long scrolling before recording
- copy stays instantly available
- assistant stays instantly available
- secondary tools remain accessible without crowding the first screen
- the app becomes much more natural on mobile without breaking desktop use

## Implementation Guidance For Later

When you decide to implement this in code, the order of work should be:

1. reduce header height on smaller screens
2. move recording block above transcript on mobile/tablet
3. create fixed `Copy + Assistant` dock
4. convert support sections into collapsible drawers
5. move AI Output below Transcript Studio on smaller layouts
6. verify no overlap with transcript, dropdowns, and assistant panel

## Final Decision

The best architecture is a responsive recording-first layout where:

- the app opens directly into recording access
- `Copy` and `Assistant` are always reachable
- Transcript Studio remains a primary work area
- AI Output and setup tools become secondary collapsible sections

That is the cleanest path to a production-ready experience across phone, tablet, and laptop.
