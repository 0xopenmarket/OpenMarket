const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ETH/USD price feed ID
const ETH_USD_PRICE_FEED = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
const HERMES_ENDPOINT = "https://hermes.pyth.network/api/latest_price_feeds";

// Game state
let waitingPlayer = null;
let activeGames = new Map();

// Get current price using curl
async function getCurrentPrice() {
  try {
    const curlCommand = `curl -s "${HERMES_ENDPOINT}?ids[]=${ETH_USD_PRICE_FEED}"`;
    const { stdout } = await execAsync(curlCommand);
    const response = JSON.parse(stdout);
    const priceData = response[0].price;
    return Number(priceData.price) * Math.pow(10, priceData.expo);
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error;
  }
}

// Game logic
class Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.guesses = new Map();
    this.startTime = Date.now();
    this.gameLength = 10000; // 10 seconds
    this.started = false;
    this.finished = false;
  }

  async start() {
    this.started = true;
    const initialPrice = await getCurrentPrice();
    
    // Notify players game is starting
    io.to(this.player1).emit('gameStart', { 
      opponent: this.player2,
      initialPrice,
      timeLeft: this.gameLength
    });
    io.to(this.player2).emit('gameStart', {
      opponent: this.player1,
      initialPrice,
      timeLeft: this.gameLength
    });

    // Set game end timer
    setTimeout(async () => {
      await this.endGame();
    }, this.gameLength);
  }

  addGuess(playerId, guess) {
    if (!this.finished && this.started) {
      this.guesses.set(playerId, guess);
    }
  }

  async endGame() {
    if (this.finished) return;
    
    this.finished = true;
    const finalPrice = await getCurrentPrice();

    // Calculate results
    const results = {
      finalPrice,
      player1Guess: this.guesses.get(this.player1) || null,
      player2Guess: this.guesses.get(this.player2) || null
    };

    // Calculate differences from actual price
    const diff1 = results.player1Guess ? Math.abs(finalPrice - results.player1Guess) : Infinity;
    const diff2 = results.player2Guess ? Math.abs(finalPrice - results.player2Guess) : Infinity;

    // Determine winner
    if (diff1 === Infinity && diff2 === Infinity) {
      results.winner = 'none';
      results.message = 'No valid guesses received';
    } else if (diff1 < diff2) {
      results.winner = this.player1;
      results.message = `Player 1 wins! Closer by $${(diff2 - diff1).toFixed(2)}`;
    } else if (diff2 < diff1) {
      results.winner = this.player2;
      results.message = `Player 2 wins! Closer by $${(diff1 - diff2).toFixed(2)}`;
    } else {
      results.winner = 'tie';
      results.message = 'It\'s a tie!';
    }

    // Send results to both players
    io.to(this.player1).emit('gameEnd', results);
    io.to(this.player2).emit('gameEnd', results);

    // Cleanup
    activeGames.delete(this.player1);
    activeGames.delete(this.player2);
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('findGame', async () => {
    if (waitingPlayer && waitingPlayer !== socket.id) {
      // Start new game
      const game = new Game(waitingPlayer, socket.id);
      activeGames.set(waitingPlayer, game);
      activeGames.set(socket.id, game);
      waitingPlayer = null;
      await game.start();
    } else {
      // Wait for opponent
      waitingPlayer = socket.id;
      socket.emit('waiting');
    }
  });

  socket.on('makeGuess', (guess) => {
    const game = activeGames.get(socket.id);
    if (game) {
      game.addGuess(socket.id, Number(guess));
      // Acknowledge the guess
      socket.emit('guessReceived', { guess });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (waitingPlayer === socket.id) {
      waitingPlayer = null;
    }
    const game = activeGames.get(socket.id);
    if (game) {
      game.endGame();
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
