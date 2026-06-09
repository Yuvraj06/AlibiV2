# ALIBI — Detective Game: Complete Build Reference

> Keep this file open in your IDE while building. Everything you need is here.

---

## Table of Contents

1. [What This Game Is](#what-this-game-is)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Game Flow (How Screens Connect)](#game-flow)
6. [The Story JSON Format](#story-json-format)
7. [How the LLM Works](#how-the-llm-works)
8. [Easy Mode Logic](#easy-mode-logic)
9. [Normal Mode Logic](#normal-mode-logic)
10. [Three.js Scene Setup](#threejs-scene-setup)
11. [Swapping in Blender Models](#swapping-in-blender-models)
12. [Diary System](#diary-system)
13. [Conclude / Verdict System](#conclude--verdict-system)
14. [Connecting RunAnywhere LLM](#connecting-runanywhere-llm)
15. [Code Snippets Cheatsheet](#code-snippets-cheatsheet)
16. [What's Built vs What's Left](#whats-built-vs-whats-left)

---

## What This Game Is

A browser-based detective game where players:
- **Interrogate 4 suspects freely** using a local LLM (no predefined questions)
- **Must explain WHY the culprit did it**, not just name them
- Can play in **Easy Mode** (find the lying statement) or **Normal Mode** (full interrogation)
- Review clues in a **Diary** that auto-fills as they interrogate

The key innovation: free-form interrogation via LLM, each suspect has a system prompt that makes them stay in character, guard secrets, and only reveal clues when properly pressured.

---

## Tech Stack

| What | Technology | Why |
|------|-----------|-----|
| Rendering | Three.js r128 | 3D characters, scene, lighting |
| 3D Models | Blender → `.glb` | Your custom suspect models |
| LLM | RunAnywhere (local) | Free-form interrogation |
| UI | Vanilla JS + CSS | No build step needed |
| Fonts | Google Fonts | Playfair Display, Special Elite, Crimson Text |
| Hosting | Any static host / local server | Plain HTML files, no backend |

**No frameworks. No npm. No build step.** Drop the HTML files in a folder and open them.

---

## Folder Structure

```
alibi-game/
│
├── index.html          ← Main menu + level select
├── scene.html          ← Investigation scene (Normal mode)
├── easy.html           ← Easy mode game screen
├── story-editor.html   ← UI tool for writing new cases
├── stories.js          ← All story data (suspects, prompts, statements)
│
├── models/             ← Your Blender .glb exports go here
│   ├── margaret.glb
│   ├── victor.glb
│   ├── eloise.glb
│   └── aldous.glb
│
└── REFERENCE.md        ← This file
```

---

## File-by-File Breakdown

### `index.html` — Main Menu + Level Select
- Shows the game title with rain atmosphere
- Two columns: Easy Mode cases (gold) and Normal Mode cases (red)
- Each card shows: case number, title, atmospheric description, suspect count
- Locked cards for future cases
- On card click → calls `startGame(storyId, mode)` which redirects to the right screen

**Key function:**
```js
function startGame(storyId, mode) {
  if (mode === 'easy') {
    window.location.href = `easy.html?story=${storyId}`;
  } else {
    window.location.href = `scene.html?story=${storyId}&mode=normal`;
  }
}
```

---

### `scene.html` — Investigation Scene
- Three.js room with 4 character placeholders (swap with your .glb models)
- Click a character → dialogue panel slides up from bottom
- Chat input → sends message to LLM → suspect responds in character
- Every exchange auto-saved to Diary
- Top right: Diary button + Conclude button
- Conclude: locked until 2+ suspects talked to. Asks for culprit name + written motive.

**Reads URL params on load:**
```js
const params = new URLSearchParams(window.location.search);
const STORY_ID = params.get('story');   // e.g. "dead-in-december"
const GAME_MODE = params.get('mode');   // "normal"
```

---

### `easy.html` — Easy Mode (BUILT)
- Shows the situation text prominently at top
- 4 horizontal cards, one per suspect
- **Three.js Integration:** Each card has a mini 3D canvas rendering the suspect. They bobble when clicked.
- **Two-Step Play:**
  - 1. Click the card of the suspect who is lying
  - 2. A "Reasoning Modal" pops up asking the player *why* the alibi is impossible
- Submit → Sends the reasoning to the LLM (must be >15 chars)
- LLM evaluates if the reasoning accurately points out the contradiction
- Shows win/lose screen with the LLM's assessment + the true explanation

---

### `story-editor.html` — Case Creation Tool
- A UI utility for writing new `stories.js` entries without dealing with JSON syntax
- Has form fields for the case details, and 4 sets of suspect fields
- Generates the clean JavaScript object to copy-paste into `stories.js`
- Contains a "Live Preview" of the generated code

---

### `stories.js` — Data Layer
- Single source of truth for all stories
- Import in both `scene.html` and `easy.html` via `<script src="stories.js">`
- Structure explained in detail below

---

## Game Flow

```
index.html (Menu)
    │
    ├─── Easy Mode card clicked
    │         └─→ easy.html?story=missing-crimson-chalice
    │                   │
    │                   └─→ Show 4 suspects (with 3D models) & statements
    │                               │
    │                               ├─→ Select lying suspect
    │                               ├─→ Write reasoning in modal
    │                               └─→ LLM assesses reasoning
    │                                       │
    │                                       ├── Correct → WIN screen
    │                                       └── Wrong   → Result shows why they failed
    │
    └─── Normal Mode card clicked
              └─→ scene.html?story=dead-in-december&mode=normal
                        │
                        └─→ Three.js scene loads
                                  │
                                  ├── Click suspect → Dialogue opens → LLM chat
                                  ├── Diary fills up with every exchange
                                  │
                                  └── Click "Conclude"
                                            │
                                            ├── Select culprit name
                                            ├── Write motive (free text)
                                            └── Submit → LLM grades motive
                                                        │
                                                        ├── Correct → WIN
                                                        └── Wrong   → feedback
```

---

## Story JSON Format

This is the structure every story follows. Store all stories in `stories.js`.

```js
// stories.js
const STORIES = [
  {
    // ── IDENTITY ──────────────────────────────
    id: "dead-in-december",           // matches URL param
    title: "Dead in December",
    caseNumber: "001",
    setting: "Ashford Manor, December 1952",
    situation: "Lord Edmund Ashford was found frozen in the east wing at 1am. The fireplace was lit. The doctor says poison.",
    unlocked: true,                   // false = locked on level select

    // ── ANSWER KEY ────────────────────────────
    culprit: "aldous",                // must match a suspect id below
    trueMotive: "Aldous Gray poisoned Lord Ashford's brandy in revenge for 30 years of stolen wages and unpaid pension.",

    // ── SUSPECTS ──────────────────────────────
    suspects: [
      {
        id: "margaret",               // used to track state, diary keys, etc.
        name: "Margaret Holt",
        role: "Housekeeper",
        modelFile: "models/margaret.glb",
        accentColor: "#c9a84c",       // spotlight + UI accent color for this character

        // EASY MODE ───────────────────────────
        easyStatement: "I was polishing silver in the kitchen from 10pm until past midnight. I never left that room.",
        isLying: false,               // true = this is the one to find
        lieExplanation: "She was never outside — she used the darkness to steal the chalice.", // Used in Easy Mode results

        // NORMAL MODE ─────────────────────────
        systemPrompt: `You are Margaret Holt, the housekeeper of Ashford Manor...
[Full character backstory, what they know, what they're hiding, personality notes]`,

        openingLine: "Oh — you startled me. What is it you want to know?"
      },

      {
        id: "victor",
        name: "Victor Crane",
        role: "Business Partner",
        modelFile: "models/victor.glb",
        accentColor: "#c0392b",
        easyStatement: "Edmund and I had no financial disputes. Our partnership was entirely amicable.",
        isLying: true,
        systemPrompt: `You are Victor Crane...`,
        openingLine: "I have nothing to hide, I assure you."
      },

      {
        id: "eloise",
        name: "Eloise Vane",
        role: "Niece",
        modelFile: "models/eloise.glb",
        accentColor: "#4a9aba",
        easyStatement: "I was in my room all night. I cried myself to sleep around ten.",
        isLying: true,
        systemPrompt: `You are Eloise Vane...`,
        openingLine: "I can't believe he's gone. What do you want from me?"
      },

      {
        id: "aldous",
        name: "Aldous Gray",
        role: "Butler",
        modelFile: "models/aldous.glb",
        accentColor: "#4a7a4a",
        easyStatement: "I heard nothing unusual that night. I retired at eleven and slept soundly.",
        isLying: false,               // Aldous is the killer but his easy statement is technically true
        systemPrompt: `You are Aldous Gray, the butler...`,
        openingLine: "Good evening. I am entirely at your disposal."
      }
    ]
  },

  // ── ADD MORE STORIES BELOW ─────────────────
  {
    id: "poison-at-the-gala",
    title: "Poison at the Gala",
    // ... same structure
  }
];
```

**Important rules for story data:**
- Exactly **one** suspect must have `isLying: true` — this is the easy mode answer
- The `culprit` field at story level must match one `suspect.id` — this is the normal mode answer
- The culprit's `isLying` in easy mode can be `false` — they might tell a technically true statement while another suspect lies about something else
- `systemPrompt` is the most important field — it controls everything the LLM does

---

## How the LLM Works

Each suspect gets their own **system prompt** passed with every API call. The LLM plays that character. The conversation history is maintained per suspect so context carries through.

**The flow:**
```
Player types message
    └─→ conversationHistory[suspectId].push({ role: 'user', content: message })
            └─→ API call with:
                    system: suspect.systemPrompt
                    messages: conversationHistory[suspectId]   ← full history
            └─→ API responds
                    └─→ conversationHistory[suspectId].push({ role: 'assistant', content: reply })
                    └─→ diary[suspectId].push({ q: message, a: reply })
                    └─→ render to screen
```

**State stored in memory (JS objects):**
```js
const conversationHistory = {
  margaret: [],   // [{role:'user', content:'...'}, {role:'assistant', content:'...'}]
  victor:   [],
  eloise:   [],
  aldous:   []
};

const diary = {
  margaret: [],   // [{q: 'question text', a: 'answer text'}]
  victor:   [],
  eloise:   [],
  aldous:   []
};
```

---

## Writing Good System Prompts

The system prompt is everything. A bad one makes suspects confess immediately or give wrong info. Here's the template:

```
You are [NAME], [ROLE] at [LOCATION]. You are [AGE], [personality adjectives].

WHAT YOU KNOW:
- [Fact 1 they genuinely know]
- [Fact 2 — a clue about someone else]
- [Fact 3 — their alibi, true or false]

SECRETS TO GUARD:
- [Secret 1] — only reveal if [specific trigger, e.g. player mentions X by name]
- [Secret 2] — never reveal voluntarily, deflect with [specific deflection]

IF THEY ARE THE CULPRIT (add this block only for the killer):
- You committed the crime. Never admit this.
- Redirect suspicion toward [another suspect name].
- If asked directly "did you do it" — act offended and deny.

PERSONALITY:
- Speech patterns: [e.g. formal, short sentences, filler words]
- Emotional state: [e.g. nervous, cold, grieving]
- How they respond under pressure: [e.g. gets clipped, cries, deflects with questions]

Keep responses to 2-4 sentences. Never break character. Never acknowledge you are an AI.
```

---

## Easy Mode Logic

Easy mode is handled by `easy.html`, combining UI interaction with a single LLM validation step.

**How it works:**
1. Load story from `stories.js` using URL param `?story=missing-crimson-chalice`
2. Display the `situation` text at the top
3. Build the suspect grid. Each cell gets its own `WebGLRenderer` and Three.js scene showing the character model.
4. Player reads all 4 statements and clicks the suspect who is logically contradicting the situation. (Character bobbles on click).
5. "Explain Your Reasoning" modal appears. Player must type *why* the statement is false.
6. Submit → Calls the LLM to verify both the selected suspect and the reasoning text.

**LLM Checking Logic:**
```js
async function submitReasoning() {
  const story = getEasyStory(STORY_ID);
  const selectedSuspect = story.suspects.find(s => s.id === selectedId);
  const correctSuspect = story.suspects.find(s => s.isLying);
  const reasoning = document.getElementById('reasoning-input').value;

  const systemPrompt = `You are a strict, logical judge in a detective game.
The player is trying to solve: "\${story.situation}"

The player has accused: \${selectedSuspect.name}.
(The actual guilty party who lied is: \${correctSuspect.name}).
The true explanation for why the statement is a lie is: "\${correctSuspect.lieExplanation}"

The player's reasoning for why they think \${selectedSuspect.name} is lying is:
"\${reasoning}"

EVALUATE:
1. Did the player pick the right person?
2. Does their reasoning correctly identify the logical contradiction?

Reply in JSON: { "correct": true/false, "feedback": "Short explanation of why their reasoning is right/wrong" }`;

  // call LLM with systemPrompt...
}
```

---

## Normal Mode Logic

Normal mode is `scene.html`. The full flow:

1. **Scene loads** → reads `?story=` param → loads story from `STORIES` array
2. **4 characters rendered** in Three.js scene with name tags
3. **Click character** → dialogue panel opens → `openingLine` shown automatically
4. **Player types** → message sent to LLM with that suspect's `systemPrompt` + history
5. **LLM replies** → shown in dialogue, saved to diary
6. **Player switches suspects** by clicking another character
7. **Conclude button** → only activates after talking to 2+ suspects
8. **Verdict screen** → player selects culprit + types motive
9. **Motive evaluated** by LLM against `story.trueMotive`

**Motive evaluation:**
```js
async function evaluateMotive(playerMotive, trueMotive) {
  const response = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      system: `You are judging a detective game verdict.
               True motive: "${trueMotive}"
               Player's answer: "${playerMotive}"
               Was the player substantially correct about the motive? 
               Reply with JSON: { "correct": true/false, "feedback": "one sentence of feedback" }`,
      messages: [{ role: 'user', content: playerMotive }]
    })
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
```

---

## Three.js Scene Setup

The scene in `scene.html` has:

```
Scene
├── Floor (PlaneGeometry, dark wood texture eventually)
├── Back Wall (PlaneGeometry)
├── Grid (GridHelper, subtle)
├── Ceiling Lamp (PointLight + CylinderGeometry mesh)
├── Ambient Light
│
├── Character[0] — position x: -4.2  (Margaret)
├── Character[1] — position x: -1.4  (Victor)
├── Character[2] — position x:  1.4  (Eloise)
└── Character[3] — position x:  4.2  (Aldous)

Camera: position(0, 2.2, 9.5) looking at (0, 1.5, 0)
```

**Character groups contain:**
- Body cylinder
- Head sphere
- Hat brim + top
- Collar accent ring (unique color per character)
- Eyes
- Accent stripe (unique color, slight emissive glow)
- Floor shadow circle
- Personal SpotLight (brightens on hover/when active)

**Animations (per frame):**
- Idle breath: `position.y = sin(time * 0.9 + phase) * 0.03`
- Hover lift: target Y rises to 0.12
- Hover scale: `scale.lerp(1.06, 0.1)`
- Talking wobble: `rotation.y = sin(time * 8) * 0.04` (when LLM is typing)
- Lamp flicker: slight random intensity noise on PointLight

**Click detection:**
```js
// Raycasting on every click
raycaster.setFromCamera(mouse, camera);
const hits = raycaster.intersectObjects(characterMeshes, true);
// Walk up parent chain to find the group with suspectId
```

---

## Swapping in Blender Models

Right now `scene.html` uses procedurally built placeholder meshes. To replace them with your Blender `.glb` models:

**Step 1 — Export from Blender:**
- File → Export → glTF 2.0 (.glb)
- Include: Meshes, Armatures, Animations
- Format: Binary (.glb)
- Save to `models/margaret.glb` etc.

**Step 2 — Add GLTFLoader:**
Add this script tag to `scene.html` (after the Three.js script tag):
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
```

**Step 3 — Replace `makeCharacter()` calls:**
```js
// Replace the SUSPECTS.forEach that calls makeCharacter() with this:
const loader = new THREE.GLTFLoader();

SUSPECTS.forEach((s, i) => {
  loader.load(s.modelFile, (gltf) => {
    const model = gltf.scene;
    model.position.set(positions[i], 0, 0);
    model.scale.set(1, 1, 1);  // adjust scale to match your model

    // Tag for raycasting
    model.userData.suspectId = s.id;
    model.traverse(child => {
      if (child.isMesh) {
        child.userData.suspectId = s.id;
        child.castShadow = true;
      }
    });

    scene.add(model);
    characterMeshes[i] = model;

    // Play idle animation if your model has one
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const idleClip = gltf.animations.find(a => a.name === 'Idle') || gltf.animations[0];
      mixer.clipAction(idleClip).play();
      mixers.push(mixer); // update mixers in animate loop
    }

  }, undefined, (err) => console.error('Model load error:', s.id, err));
});
```

**Step 4 — Update animate loop to tick mixers:**
```js
// Add this at the top of your animate() function
const delta = clock.getDelta();
mixers.forEach(m => m.update(delta));
```

**Naming your animations in Blender:**
- `Idle` — default breathing/standing loop
- `Talk` — mouth/body movement when speaking
- `React` — when player says something surprising

---

## Diary System

The diary auto-logs every exchange. Structure:

```js
// In memory
const diary = {
  margaret: [
    { q: "Where were you at midnight?", a: "I was in the kitchen, I swear it." },
    { q: "Did you see anyone near the east wing?", a: "I… well. I may have seen someone." }
  ],
  victor: [],
  eloise: [],
  aldous: []
};
```

**Rendering the diary panel:**
```js
function renderDiary() {
  const body = document.getElementById('diary-body');
  body.innerHTML = '';

  SUSPECTS.forEach(s => {
    if (!diary[s.id].length) return;

    // Create a section per suspect
    const block = document.createElement('div');
    block.innerHTML = `<h3>${s.name}</h3>`;

    diary[s.id].forEach(entry => {
      block.innerHTML += `
        <p class="diary-q">Q: ${entry.q}</p>
        <p class="diary-a">${entry.a}</p>`;
    });

    body.appendChild(block);
  });
}
```

The diary is **lost on page refresh** (it's in memory). If you want persistence across sessions, save to `localStorage`:
```js
// Save
localStorage.setItem('alibi-diary-' + STORY_ID, JSON.stringify(diary));

// Load on page start
const saved = localStorage.getItem('alibi-diary-' + STORY_ID);
if (saved) Object.assign(diary, JSON.parse(saved));
```

---

## Conclude / Verdict System

**Triggered by:** "Conclude" button (locked until 2+ suspects talked to)

**The modal asks for:**
1. Dropdown: select culprit name
2. Textarea: explain why they did it

**Checking the verdict:**
```js
async function submitVerdict() {
  const culpritSelected = document.getElementById('culprit-select').value;
  const motiveText = document.getElementById('motive-input').value.trim();

  // Step 1: Check culprit name (simple equality)
  const story = getCurrentStory();
  const culpritCorrect = culpritSelected === story.culprit;

  if (!culpritCorrect) {
    showResult(false, "Wrong suspect. Review your notes.");
    return;
  }

  // Step 2: Evaluate motive via LLM
  const result = await evaluateMotive(motiveText, story.trueMotive);

  if (result.correct) {
    showResult(true, "Correct. " + result.feedback);
  } else {
    showResult(false, "The culprit is right, but the motive is off. " + result.feedback);
  }
}
```

---

## Connecting RunAnywhere LLM

In `scene.html`, find the `sendMessage()` function. Replace the fetch URL and body format:

**Current (Anthropic API):**
```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: s.systemPrompt,
    messages: conversationHistory[activeSuspect]
  })
});
const data = await response.json();
const reply = data.content.map(b => b.text || '').join('');
```

**Replace with RunAnywhere (adjust to their exact API format):**
```js
const response = await fetch('http://localhost:PORT/api/chat', {  // ← your RunAnywhere port
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'YOUR_MODEL_NAME',           // ← your model
    system: s.systemPrompt,
    messages: conversationHistory[activeSuspect]
  })
});
const data = await response.json();
const reply = data.message?.content || data.response || data.text; // ← match their response format
```

> Check RunAnywhere docs for: exact endpoint URL, request body format, response field names.

---

## Code Snippets Cheatsheet

**Get current story from URL:**
```js
const STORY_ID = new URLSearchParams(window.location.search).get('story');
const story = STORIES.find(s => s.id === STORY_ID);
```

**Navigate to a screen:**
```js
window.location.href = `scene.html?story=${storyId}&mode=normal`;
window.location.href = `easy.html?story=${storyId}`;
window.location.href = `index.html`;
```

**Show/hide a panel with animation:**
```js
// CSS: panel has transition: transform 0.4s
panel.classList.add('open');    // slides in
panel.classList.remove('open'); // slides out
```

**Add a message bubble to dialogue:**
```js
function appendBubble(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'player' : 'suspect');
  div.innerHTML = `<div class="msg-bubble">${text}</div>`;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
```

**Track which suspects have been talked to:**
```js
const talkedCount = SUSPECTS.filter(s => s.talked).length;
if (talkedCount < 2) { showToast('Talk to more suspects first'); return; }
```

**Raycast click on Three.js objects:**
```js
canvas.addEventListener('click', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj.parent && !obj.userData.suspectId) obj = obj.parent;
    if (obj.userData.suspectId) openDialogue(obj.userData.suspectId);
  }
});
```

---

## What's Built vs What's Left

| Feature | Status | File |
|---|---|---|
| Main menu UI | ✅ Done | `index.html` |
| Level select (Easy + Normal columns) | ✅ Done | `index.html` |
| Three.js scene with 4 placeholder characters | ✅ Done | `scene.html` |
| Raycasting character click | ✅ Done | `scene.html` |
| Floating name tags | ✅ Done | `scene.html` |
| Dialogue panel (slide up) | ✅ Done | `scene.html` |
| LLM interrogation (Ollama API) | ✅ Done | `scene.html` |
| Diary panel | ✅ Done | `scene.html` |
| Conclude / Verdict modal | ✅ Done | `scene.html` |
| Story JSON structure | ✅ Done | `stories.js` |
| Menu → Scene navigation | ✅ Done | `index.html` |
| Story Editor UI | ✅ Done | `story-editor.html` |
| Easy mode screen | ✅ Done | `easy.html` |
| Easy mode 3D models per card | ✅ Done | `easy.html` |
| Easy mode LLM Reasoning validation | ✅ Done | `easy.html` |
| Swap placeholder meshes with Blender .glb | ⬜ TODO | `scene.html` |
| Win / Lose screens for Normal Mode | ⬜ TODO | `scene.html` |
| Lip sync / talking animation | ⬜ TODO | `scene.html` |
| Replace all placeholder cases with real stories | ⬜ TODO | `stories.js` |

---

*Last updated: Session 2 — Story JSON + Easy Mode planning*
