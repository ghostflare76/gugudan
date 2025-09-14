# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**구구단 마스터** (Multiplication Master) is a Korean educational web game for elementary students to practice multiplication tables (2-9). It's a client-side single-page application built with vanilla HTML/CSS/JavaScript.

## Development Commands

### Running the Application
```bash
# Option 1: Simple HTTP server
python -m http.server 8000

# Option 2: Using serve (if available)
npx serve .

# Access at http://localhost:8000
```

### No Build System
- Pure HTML/CSS/JS - no compilation required
- Direct browser execution
- No package.json or dependencies

## Architecture Overview

### Core Structure
- **Monolithic Design**: Single `MultiplicationGame` class (788 lines) handles all game logic
- **Three Screen Flow**: Start → Game → Results
- **State Management**: Class properties store all game state
- **No External Dependencies**: Pure vanilla JavaScript

### File Organization
```
├── index.html          # Complete UI structure (all game screens)
├── script.js           # All game logic in MultiplicationGame class
├── style.css           # Complete styling system with animations
├── wav/*.mp3           # Sound effects (3 audio files)
└── docs/               # Requirements and architecture docs
```

## Key Technical Details

### Game State Management (script.js)
The `MultiplicationGame` class manages all state:
```javascript
// Core game properties
playerName, currentScore, currentQuestion, totalQuestions: 10
correctAnswers, consecutiveCorrect, maxStreak
timeLeft: 5, questions[], currentQuestionIndex

// UI elements referenced in initializeElements()
startScreen, gameScreen, resultScreen, dropZone, etc.
```

### Question Generation Logic
- Generates 2-9 multiplication problems (excludes 1×N)
- Creates 4 multiple choice options (1 correct + 3 wrong)
- Each question structure: `{num1, num2, correctAnswer, options[]}`

### Mobile Touch Support
Complex touch event handling (lines 236-355):
- `handleTouchStart/Move/End()` for drag-and-drop
- Click fallback for simple touch interaction
- Cross-platform compatibility

### Audio System
- **Primary**: Web Audio API for generated sounds
- **Fallback**: HTML5 Audio elements for MP3 files
- **Mobile**: Requires user interaction to unlock audio

## Current Limitations & Extension Points

### Known Technical Debt
1. **Monolithic Structure**: All logic in single 788-line class
2. **No Data Persistence**: Game state resets on refresh
3. **Hardcoded Settings**: `totalQuestions = 10`, `timeLeft = 5`
4. **Single Game Mode**: Only standard mode exists

### For Adding New Features
**To add game modes:**
- Extend `MultiplicationGame` class or create mode-specific classes
- Add mode selection UI to `index.html`
- Modify question generation logic in `generateQuestions()`

**To add leaderboard/persistence:**
- Implement localStorage wrapper in new `storage.js`
- Add score saving logic to `endGame()`
- Create leaderboard UI components

**To modify scoring:**
- Update `handleCorrectAnswer()` and `updateScore()` methods
- Scoring: +10 base, +2×streak bonus, -5 wrong, -10 timeout

## UI Screen States

### Screen Management
Three main screens controlled by CSS classes:
- `.start-screen` → `.game-screen` → `.result-screen`
- Toggle with `.hidden` class and `.fade-in` animations

### Key UI Elements
- **Progress Bar**: Shows question N/10 progress
- **Timer**: 5-second countdown with visual bar animation
- **Drop Zone**: Drag-and-drop target with visual feedback
- **Star Rating**: 3-star system based on accuracy
- **Effects**: Perfect/streak/wrong visual feedback overlays

## Development Patterns

### Event Handling
- Global functions `startGame()`, `resetGame()` called from HTML
- Game instance created on `window.load` event
- Keyboard support: Enter key triggers actions

### Error Handling
- Try-catch blocks around audio operations
- Graceful fallbacks for Web Audio API failures
- Console logging for debugging

### Mobile Compatibility
- Responsive design with media queries
- Touch events with preventDefault() calls
- Visual feedback during drag operations

## Testing Approach

### Manual Testing
- Open in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices for touch functionality
- Use browser dev tools for debugging
- Check localStorage in Application tab

### Common Issues
- **Mobile audio**: Requires user interaction first
- **Touch events**: May need `touch-action: none` CSS
- **Game initialization**: Ensure window.game exists before calling

## Sound System Details

### Audio Files
- `mixkit-video-game-treasure-2066.mp3` - Correct answer applause
- `mixkit-player-losing-or-failing-2042.mp3` - Wrong answer
- `mixkit-completion-of-a-level-2063.mp3` - Game completion

### Audio Implementation
- Volume levels preset: applause(0.7), wrong(0.5), completion(0.8)
- Mobile unlock pattern in `unlockAudio()` method
- Web Audio API used for streak effects (programmatically generated)

## Extension Recommendations

### Code Organization
For major new features, consider splitting into modules:
- `gameMode.js` - Game mode management
- `leaderboard.js` - Score tracking and display
- `storage.js` - localStorage operations
- `soundManager.js` - Audio system

### Backwards Compatibility
When extending, preserve:
- Current drag-and-drop system
- Sound effect timings and volumes
- Mobile touch support
- Existing animation system
- Three-screen navigation flow