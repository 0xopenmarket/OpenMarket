// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const util = require('util');
const cors = require('cors');
const execAsync = util.promisify(exec);

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
      origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Constants
const ETH_USD_PRICE_FEED = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
const HERMES_ENDPOINT = "https://hermes.pyth.network/api/latest_price_feeds";
const GAME_LENGTH = 30000; // 30 seconds
const MIN_PLAYERS = 2;

// Game state
let waitingPlayers = new Set();
let activeGames = new Map();
let playerStats = new Map();

// Get current ETH price
async function getCurrentPrice() {
  try {
    const curlCommand = `curl -s "${HERMES_ENDPOINT}?ids[]=${ETH_USD_PRICE_FEED}"`;
    const { stdout } = await execAsync(curlCommand);
    const response = JSON.parse(stdout);
    const priceData = response[0].price;
    return Number(priceData.price) * Math.pow(10, priceData.expo);
  } catch (error) {
    console.error('Price fetch error:', error);
    throw error;
  }
}

class Game {
  constructor(players) {
    this.players = players;
    this.guesses = new Map();
    this.startTime = Date.now();
    this.gameLength = GAME_LENGTH;
    this.started = false;
    this.finished = false;
    this.initialPrice = null;
    this.finalPrice = null;
  }

  async start() {
    try {
      this.started = true;
      this.initialPrice = await getCurrentPrice();
      
      // Notify all players
      this.players.forEach(playerId => {
        io.to(playerId).emit('gameStart', {
          initialPrice: this.initialPrice,
          timeLeft: this.gameLength,
          players: Array.from(this.players).filter(id => id !== playerId)
        });
      });

      // Set game end timer
      setTimeout(async () => {
        await this.endGame();
      }, this.gameLength);

    } catch (error) {
      console.error('Game start error:', error);
      this.cleanup();
    }
  }

  addGuess(playerId, guess) {
    if (!this.finished && this.started) {
      this.guesses.set(playerId, guess);
      io.to(playerId).emit('guessConfirmed', { guess });
    }
  }

  async endGame() {
    if (this.finished) return;
    
    try {
      this.finished = true;
      this.finalPrice = await getCurrentPrice();

      const results = {
        finalPrice: this.finalPrice,
        initialPrice: this.initialPrice,
        guesses: Object.fromEntries(this.guesses),
        winners: this.calculateWinners()
      };

      // Notify all players
      this.players.forEach(playerId => {
        io.to(playerId).emit('gameEnd', results);
        this.updatePlayerStats(playerId, results);
      });

      this.cleanup();

    } catch (error) {
      console.error('Game end error:', error);
      this.cleanup();
    }
  }

  calculateWinners() {
    if (this.guesses.size === 0) return [];

    // Calculate absolute differences from final price for each player
    const differences = new Map();
    this.guesses.forEach((guess, playerId) => {
      const difference = Math.abs(this.finalPrice - guess);
      differences.set(playerId, {
        playerId,
        guess,
        difference
      });
    });

    // Find the smallest difference
    let closestDifference = Infinity;
    let closestPlayer = null;

    differences.forEach(({ playerId, guess, difference }) => {
      if (difference < closestDifference) {
        closestDifference = difference;
        closestPlayer = playerId;
      }
    });

    // Return array with the winner
    return closestPlayer ? [closestPlayer] : [];
  }

  async endGame() {
    if (this.finished) return;
    
    try {
      this.finished = true;
      this.finalPrice = await getCurrentPrice();

      const winners = this.calculateWinners();
      const results = {
        finalPrice: this.finalPrice,
        initialPrice: this.initialPrice,
        guesses: Object.fromEntries(this.guesses),
        winners,
        // Add detailed results for UI
        details: Array.from(this.guesses).map(([playerId, guess]) => ({
          playerId,
          guess,
          difference: Math.abs(this.finalPrice - guess),
          isWinner: winners.includes(playerId)
        })).sort((a, b) => a.difference - b.difference)
      };

      // Notify all players
      this.players.forEach(playerId => {
        const playerResults = {
          ...results,
          isWinner: winners.includes(playerId),
          yourGuess: this.guesses.get(playerId),
          message: this.getResultMessage(playerId, results)
        };
        
        io.to(playerId).emit('gameEnd', playerResults);
        this.updatePlayerStats(playerId, results);
      });

      this.cleanup();
    } catch (error) {
      console.error('Game end error:', error);
      this.cleanup();
    }
  }

  getResultMessage(playerId, results) {
    if (results.winners.includes(playerId)) {
      return 'You had the closest prediction!';
    }

    const playerGuess = this.guesses.get(playerId);
    if (!playerGuess) {
      return 'You didn\'t make a prediction in time';
    }

    const difference = Math.abs(this.finalPrice - playerGuess);
    const percentage = ((difference / this.finalPrice) * 100).toFixed(1);
    return `You were off by ${percentage}%`;
  }

  updatePlayerStats(playerId, results) {
    const stats = playerStats.get(playerId) || {
      gamesPlayed: 0,
      wins: 0,
      totalGuesses: [],
      averageAccuracy: 0
    };

    const playerGuess = this.guesses.get(playerId);
    if (playerGuess) {
      const accuracy = 100 - (Math.abs(this.finalPrice - playerGuess) / this.finalPrice * 100);
      
      stats.gamesPlayed++;
      if (results.winners.includes(playerId)) {
        stats.wins++;
      }
      
      stats.totalGuesses.push({
        guess: playerGuess,
        actual: this.finalPrice,
        accuracy,
        timestamp: Date.now()
      });

      // Update average accuracy
      stats.averageAccuracy = stats.totalGuesses.reduce((acc, g) => acc + g.accuracy, 0) / stats.totalGuesses.length;
    }

    playerStats.set(playerId, stats);
  }
  cleanup() {
    this.players.forEach(playerId => {
      activeGames.delete(playerId);
    });
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('findGame', async () => {
    if (waitingPlayers.has(socket.id)) return;

    waitingPlayers.add(socket.id);
    socket.emit('waiting');

    if (waitingPlayers.size >= MIN_PLAYERS) {
      const players = new Set(Array.from(waitingPlayers).slice(0, MIN_PLAYERS));
      players.forEach(id => waitingPlayers.delete(id));

      const game = new Game(players);
      players.forEach(id => activeGames.set(id, game));
      await game.start();
    }
  });

  socket.on('makeGuess', (guess) => {
    const game = activeGames.get(socket.id);
    if (game && !isNaN(guess)) {
      game.addGuess(socket.id, Number(guess));
    }
  });

  socket.on('getStats', () => {
    const stats = playerStats.get(socket.id);
    if (stats) {
      socket.emit('stats', stats);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    waitingPlayers.delete(socket.id);
    const game = activeGames.get(socket.id);
    if (game) {
      game.endGame();
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});
