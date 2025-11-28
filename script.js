const levels = [
    { level: 1, max: 100, attempts: 10, points: 100 },
    { level: 2, max: 200, attempts: 12, points: 200 },
    { level: 3, max: 300, attempts: 14, points: 300 },
    { level: 4, max: 400, attempts: 16, points: 400 },
    { level: 5, max: 500, attempts: 18, points: 500 },
    { level: 6, max: 600, attempts: 20, points: 600 },
    { level: 7, max: 700, attempts: 22, points: 700 },
    { level: 8, max: 800, attempts: 24, points: 800 },
    { level: 9, max: 900, attempts: 26, points: 900 },
    { level: 10, max: 1000, attempts: 28, points: 1000 }
];

let currentLevelIndex = 0;
let targetNumber = 0;
let attemptsLeft = 0;
let score = 0;
let gameActive = false;
let audioContext = null;

// DOM Elements
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const minRangeEl = document.getElementById('min-range');
const maxRangeEl = document.getElementById('max-range');
const attemptsEl = document.getElementById('attempts');
const hintEl = document.getElementById('hint');
const guessInput = document.getElementById('guess-input');
const guessBtn = document.getElementById('guess-btn');
const gameArea = document.getElementById('game-area');
const leaderboardSection = document.getElementById('leaderboard');
const highScoresList = document.getElementById('high-scores-list');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');
const restartBtn = document.getElementById('restart-btn');
const nameInputGroup = document.getElementById('name-input-group');

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playWinSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

function initGame() {
    currentLevelIndex = 0;
    score = 0;
    startLevel();
}

function startLevel() {
    if (currentLevelIndex >= levels.length) {
        endGame(true);
        return;
    }

    const levelConfig = levels[currentLevelIndex];
    targetNumber = Math.floor(Math.random() * levelConfig.max) + 1;
    attemptsLeft = levelConfig.attempts;
    gameActive = true;

    // Update UI
    levelEl.textContent = levelConfig.level;
    scoreEl.textContent = score;
    minRangeEl.textContent = 1;
    maxRangeEl.textContent = levelConfig.max;
    attemptsEl.textContent = attemptsLeft;
    hintEl.textContent = `Adivina el número entre 1 y ${levelConfig.max}`;
    hintEl.style.color = 'var(--text-dim)';
    guessInput.value = '';
    guessInput.focus();

    leaderboardSection.classList.add('hidden');
    gameArea.classList.remove('hidden');
}

function checkGuess() {
    initAudio(); // Ensure audio context is ready on user interaction
    if (!gameActive) return;

    const guess = parseInt(guessInput.value);

    if (isNaN(guess)) {
        showMessage("Por favor ingresa un número válido", "error");
        return;
    }

    attemptsLeft--;
    attemptsEl.textContent = attemptsLeft;

    if (guess === targetNumber) {
        handleWin();
    } else {
        if (attemptsLeft === 0) {
            handleLoss();
        } else {
            const hint = guess < targetNumber ? "¡Más alto! 🔼" : "¡Más bajo! 🔽";
            showMessage(hint, "warning");
            guessInput.classList.add('shake');
            setTimeout(() => guessInput.classList.remove('shake'), 300);
            guessInput.value = '';
            guessInput.focus();
        }
    }
}

function showMessage(msg, type) {
    hintEl.textContent = msg;
    if (type === 'error') hintEl.style.color = '#ff4444';
    else if (type === 'warning') hintEl.style.color = '#ffaa00';
    else hintEl.style.color = 'var(--success)';
}

function handleWin() {
    playWinSound();
    const levelConfig = levels[currentLevelIndex];
    const levelPoints = levelConfig.points + (attemptsLeft * 10);
    score += levelPoints;
    scoreEl.textContent = score;

    showMessage(`¡Correcto! El número era ${targetNumber}. +${levelPoints} pts`, "success");
    gameActive = false;

    setTimeout(() => {
        currentLevelIndex++;
        if (currentLevelIndex < levels.length) {
            startLevel();
        } else {
            endGame(true);
        }
    }, 2000);
}

function handleLoss() {
    gameActive = false;
    showMessage(`¡Perdiste! El número era ${targetNumber}.`, "error");
    setTimeout(() => endGame(false), 2000);
}

function endGame(victory) {
    gameArea.classList.add('hidden');
    leaderboardSection.classList.remove('hidden');
    updateLeaderboardDisplay();

    const title = victory ? "¡Juego Completado!" : "Fin del Juego";
    document.querySelector('#leaderboard h2').textContent = `${title} - Puntuación: ${score}`;

    nameInputGroup.classList.remove('hidden');
    restartBtn.classList.add('hidden');
}

// Leaderboard Logic
const STORAGE_KEY = 'adivina_numero_scores';

function getScores() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveScore() {
    const name = playerNameInput.value.trim() || 'Anónimo';
    const scores = getScores();
    scores.push({ name, score, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(5); // Keep top 5

    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));

    updateLeaderboardDisplay();
    nameInputGroup.classList.add('hidden');
    restartBtn.classList.remove('hidden');
}

function updateLeaderboardDisplay() {
    const scores = getScores();
    highScoresList.innerHTML = scores
        .map((s, i) => `<li><span>${i + 1}. ${s.name}</span> <span>${s.score} pts</span></li>`)
        .join('');
}

// Event Listeners
guessBtn.addEventListener('click', checkGuess);
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkGuess();
});

saveScoreBtn.addEventListener('click', saveScore);
restartBtn.addEventListener('click', initGame);

// Init
initGame();
