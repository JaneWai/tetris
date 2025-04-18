import { TETROMINOES, COLORS } from './tetrominoes.js';

export class Tetris {
  constructor() {
    // Main game canvas
    this.canvas = document.getElementById('tetris');
    this.ctx = this.canvas.getContext('2d');
    
    // Next piece preview canvas
    this.nextCanvas = document.getElementById('next-piece');
    this.nextCtx = this.nextCanvas.getContext('2d');
    
    // Game board size (in blocks)
    this.width = 10;
    this.height = 20;
    
    // Ensure canvas dimensions match the logical game size
    this.canvas.width = 240;  // 10 blocks * 24px per block
    this.canvas.height = 480; // 20 blocks * 24px per block
    
    // Block size in pixels
    this.blockSize = this.canvas.width / this.width;
    
    // Game state
    this.board = this.createEmptyBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = true;
    
    // Current and next piece
    this.currentPiece = this.getRandomPiece();
    this.nextPiece = this.getRandomPiece();
    
    // Game speed (milliseconds per drop)
    this.dropSpeed = 1000;
    this.lastDropTime = 0;
    
    // Score elements
    this.scoreElement = document.getElementById('score');
    this.linesElement = document.getElementById('lines');
    this.levelElement = document.getElementById('level');
    
    // Start the game loop
    this.update = this.update.bind(this);
    requestAnimationFrame(this.update);
    
    // Draw initial state
    this.draw();
    this.drawNextPiece();
  }
  
  createEmptyBoard() {
    return Array.from({ length: this.height }, () => Array(this.width).fill(0));
  }
  
  getRandomPiece() {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    
    return {
      type: randomPiece,
      shape: TETROMINOES[randomPiece],
      color: COLORS[randomPiece],
      x: Math.floor(this.width / 2) - 1,
      y: 0,
      rotation: 0
    };
  }
  
  rotate() {
    if (this.isPaused || this.gameOver) return;
    
    const nextRotation = (this.currentPiece.rotation + 1) % this.currentPiece.shape.length;
    const originalRotation = this.currentPiece.rotation;
    
    this.currentPiece.rotation = nextRotation;
    
    if (this.checkCollision()) {
      // If rotation causes collision, revert back
      this.currentPiece.rotation = originalRotation;
    }
    
    this.draw();
  }
  
  moveLeft() {
    if (this.isPaused || this.gameOver) return;
    
    this.currentPiece.x--;
    if (this.checkCollision()) {
      this.currentPiece.x++;
    }
    this.draw();
  }
  
  moveRight() {
    if (this.isPaused || this.gameOver) return;
    
    this.currentPiece.x++;
    if (this.checkCollision()) {
      this.currentPiece.x--;
    }
    this.draw();
  }
  
  moveDown() {
    if (this.isPaused || this.gameOver) return;
    
    this.currentPiece.y++;
    
    // Check if the piece collides after moving down
    if (this.checkCollision()) {
      // Move it back up
      this.currentPiece.y--;
      // Lock the piece in place
      this.lockPiece();
      // Clear any completed lines
      this.clearLines();
      // Get a new piece
      this.getNewPiece();
    }
    
    this.draw();
  }
  
  hardDrop() {
    if (this.isPaused || this.gameOver) return;
    
    let dropDistance = 0;
    
    // Keep moving down until collision
    while (!this.checkCollision()) {
      this.currentPiece.y++;
      dropDistance++;
    }
    
    // Move back up one step (to the last valid position)
    this.currentPiece.y--;
    
    // Lock the piece, clear lines, and get a new piece
    this.lockPiece();
    this.clearLines();
    this.getNewPiece();
    
    this.draw();
  }
  
  // Check if the current piece collides with the board boundaries or other pieces
  checkCollision() {
    const { shape, rotation, x, y } = this.currentPiece;
    const currentShape = shape[rotation];
    
    for (let row = 0; row < currentShape.length; row++) {
      for (let col = 0; col < currentShape[row].length; col++) {
        // Skip empty cells in the tetromino
        if (currentShape[row][col] === 0) continue;
        
        // Calculate actual position on the board
        const boardX = x + col;
        const boardY = y + row;
        
        // Check if out of bounds (left, right, or bottom)
        if (
          boardX < 0 || 
          boardX >= this.width || 
          boardY >= this.height
        ) {
          return true; // Collision detected
        }
        
        // Check if colliding with another piece on the board
        // Only check if we're within the board (not above the top)
        if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
          return true; // Collision detected
        }
      }
    }
    
    return false; // No collision
  }
  
  lockPiece() {
    const { shape, rotation, x, y, color } = this.currentPiece;
    const currentShape = shape[rotation];
    
    for (let row = 0; row < currentShape.length; row++) {
      for (let col = 0; col < currentShape[row].length; col++) {
        // Skip empty cells
        if (currentShape[row][col] === 0) continue;
        
        const boardX = x + col;
        const boardY = y + row;
        
        // Only place on the board if within bounds
        if (
          boardY >= 0 && 
          boardY < this.height && 
          boardX >= 0 && 
          boardX < this.width
        ) {
          this.board[boardY][boardX] = color;
        }
      }
    }
  }
  
  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.height - 1; y >= 0; y--) {
      // Check if the row is completely filled
      if (this.board[y].every(cell => cell !== 0)) {
        // Remove the line
        this.board.splice(y, 1);
        // Add empty line at the top
        this.board.unshift(Array(this.width).fill(0));
        // Since we removed a line, we need to check the same y index again
        y++;
        linesCleared++;
      }
    }
    
    if (linesCleared > 0) {
      // Update score
      this.lines += linesCleared;
      
      // Calculate score based on number of lines cleared
      const points = [0, 40, 100, 300, 1200];
      this.score += points[linesCleared] * this.level;
      
      // Update level
      this.level = Math.floor(this.lines / 10) + 1;
      
      // Update drop speed based on level
      this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
      
      // Update UI
      this.scoreElement.textContent = this.score;
      this.linesElement.textContent = this.lines;
      this.levelElement.textContent = this.level;
    }
  }
  
  getNewPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getRandomPiece();
    
    // Check if game over
    if (this.checkCollision()) {
      this.gameOver = true;
      this.isPaused = true;
      alert(`Game Over! Your score: ${this.score}`);
    }
    
    this.drawNextPiece();
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw the board
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.board[y][x] !== 0) {
          this.drawBlock(this.ctx, x, y, this.board[y][x]);
        }
      }
    }
    
    // Draw current piece
    if (!this.gameOver) {
      const currentShape = this.currentPiece.shape[this.currentPiece.rotation];
      
      for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
          if (currentShape[y][x] !== 0) {
            const boardX = this.currentPiece.x + x;
            const boardY = this.currentPiece.y + y;
            
            // Only draw if the piece is within the visible board area
            if (boardY >= 0) {
              this.drawBlock(this.ctx, boardX, boardY, this.currentPiece.color);
            }
          }
        }
      }
      
      // Draw ghost piece (preview of where the piece will land)
      this.drawGhostPiece();
    }
    
    // Draw grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= this.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.blockSize, 0);
      this.ctx.lineTo(x * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.blockSize);
      this.ctx.lineTo(this.canvas.width, y * this.blockSize);
      this.ctx.stroke();
    }
  }
  
  drawGhostPiece() {
    // Create a copy of the current piece
    const ghostPiece = {
      ...this.currentPiece,
      y: this.currentPiece.y
    };
    
    // Move the ghost piece down until it collides
    while (!this.checkCollisionForGhost(ghostPiece)) {
      ghostPiece.y++;
    }
    
    // Move back up one step (to the last valid position)
    ghostPiece.y--;
    
    // Draw the ghost piece
    const currentShape = ghostPiece.shape[ghostPiece.rotation];
    
    for (let y = 0; y < currentShape.length; y++) {
      for (let x = 0; x < currentShape[y].length; x++) {
        if (currentShape[y][x] !== 0) {
          const boardX = ghostPiece.x + x;
          const boardY = ghostPiece.y + y;
          
          if (boardY >= 0) {
            // Draw ghost block (transparent version of the current piece)
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(
              boardX * this.blockSize, 
              boardY * this.blockSize, 
              this.blockSize, 
              this.blockSize
            );
            
            // Draw border
            this.ctx.strokeStyle = this.currentPiece.color;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
              boardX * this.blockSize, 
              boardY * this.blockSize, 
              this.blockSize, 
              this.blockSize
            );
          }
        }
      }
    }
  }
  
  // Separate collision check for ghost piece to avoid modifying the current piece
  checkCollisionForGhost(ghostPiece) {
    const { shape, rotation, x, y } = ghostPiece;
    const currentShape = shape[rotation];
    
    for (let row = 0; row < currentShape.length; row++) {
      for (let col = 0; col < currentShape[row].length; col++) {
        // Skip empty cells in the tetromino
        if (currentShape[row][col] === 0) continue;
        
        // Calculate actual position on the board
        const boardX = x + col;
        const boardY = y + row;
        
        // Check if out of bounds (left, right, or bottom)
        if (
          boardX < 0 || 
          boardX >= this.width || 
          boardY >= this.height
        ) {
          return true; // Collision detected
        }
        
        // Check if colliding with another piece on the board
        // Only check if we're within the board (not above the top)
        if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
          return true; // Collision detected
        }
      }
    }
    
    return false; // No collision
  }
  
  drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
    
    // Draw highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(
      x * this.blockSize, 
      y * this.blockSize, 
      this.blockSize, 
      this.blockSize / 4
    );
    context.fillRect(
      x * this.blockSize, 
      y * this.blockSize, 
      this.blockSize / 4, 
      this.blockSize
    );
    
    // Draw shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.fillRect(
      x * this.blockSize, 
      y * this.blockSize + this.blockSize - this.blockSize / 4, 
      this.blockSize, 
      this.blockSize / 4
    );
    context.fillRect(
      x * this.blockSize + this.blockSize - this.blockSize / 4, 
      y * this.blockSize, 
      this.blockSize / 4, 
      this.blockSize
    );
    
    // Draw border
    context.strokeStyle = '#000';
    context.lineWidth = 1;
    context.strokeRect(
      x * this.blockSize, 
      y * this.blockSize, 
      this.blockSize, 
      this.blockSize
    );
  }
  
  drawNextPiece() {
    // Clear next piece canvas
    this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    
    const piece = this.nextPiece.shape[0]; // Always show first rotation
    const blockSize = 20;
    
    // Center the piece in the preview canvas
    const offsetX = (this.nextCanvas.width - piece[0].length * blockSize) / 2;
    const offsetY = (this.nextCanvas.height - piece.length * blockSize) / 2;
    
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x] !== 0) {
          this.nextCtx.fillStyle = this.nextPiece.color;
          this.nextCtx.fillRect(
            offsetX + x * blockSize, 
            offsetY + y * blockSize, 
            blockSize, 
            blockSize
          );
          
          // Draw highlight
          this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          this.nextCtx.fillRect(
            offsetX + x * blockSize, 
            offsetY + y * blockSize, 
            blockSize, 
            blockSize / 4
          );
          this.nextCtx.fillRect(
            offsetX + x * blockSize, 
            offsetY + y * blockSize, 
            blockSize / 4, 
            blockSize
          );
          
          // Draw shadow
          this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          this.nextCtx.fillRect(
            offsetX + x * blockSize, 
            offsetY + y * blockSize + blockSize - blockSize / 4, 
            blockSize, 
            blockSize / 4
          );
          this.nextCtx.fillRect(
            offsetX + x * blockSize + blockSize - blockSize / 4, 
            offsetY + y * blockSize, 
            blockSize / 4, 
            blockSize
          );
          
          // Draw border
          this.nextCtx.strokeStyle = '#000';
          this.nextCtx.lineWidth = 1;
          this.nextCtx.strokeRect(
            offsetX + x * blockSize, 
            offsetY + y * blockSize, 
            blockSize, 
            blockSize
          );
        }
      }
    }
  }
  
  update(timestamp) {
    if (!this.lastDropTime) this.lastDropTime = timestamp;
    
    const deltaTime = timestamp - this.lastDropTime;
    
    if (!this.isPaused && !this.gameOver && deltaTime > this.dropSpeed) {
      this.moveDown();
      this.lastDropTime = timestamp;
    }
    
    requestAnimationFrame(this.update);
  }
  
  togglePause() {
    if (this.gameOver) {
      // Reset game if game over
      this.board = this.createEmptyBoard();
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.gameOver = false;
      this.currentPiece = this.getRandomPiece();
      this.nextPiece = this.getRandomPiece();
      this.dropSpeed = 1000;
      
      // Update UI
      this.scoreElement.textContent = this.score;
      this.linesElement.textContent = this.lines;
      this.levelElement.textContent = this.level;
      
      this.draw();
      this.drawNextPiece();
    }
    
    this.isPaused = !this.isPaused;
  }
}
