if (e.key === 'Enter') checkGuess();
});

saveScoreBtn.addEventListener('click', saveScore);
restartBtn.addEventListener('click', initGame);

// Init
initGame();
