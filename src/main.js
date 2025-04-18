import '../style.css';
import { Tetris } from './tetris.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  const tetris = new Tetris();
  
  // Start/Pause button
  const startButton = document.getElementById('start-button');
  startButton.addEventListener('click', () => {
    tetris.togglePause();
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (event) => {
    if (tetris.gameOver) return;
    
    switch(event.key) {
      case 'ArrowLeft':
        tetris.moveLeft();
        break;
      case 'ArrowRight':
        tetris.moveRight();
        break;
      case 'ArrowUp':
        tetris.rotate();
        break;
      case 'ArrowDown':
        tetris.moveDown();
        break;
      case ' ':
        tetris.hardDrop();
        break;
      case 'p':
        tetris.togglePause();
        break;
    }
  });
});
