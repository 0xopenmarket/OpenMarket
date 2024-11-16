const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_DURATION = 15000; // 15 seconds to cover the full game cycle

// Create two test players
function createTestPlayer(playerName) {
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
        console.log(`${playerName} connected with ID: ${socket.id}`);
    });

    socket.on('waiting', () => {
        console.log(`${playerName} is waiting for opponent...`);
    });

    socket.on('gameStart', (data) => {
        console.log(`\n${playerName} - Game Started!`);
        console.log(`Initial Price: $${data.initialPrice.toFixed(2)}`);
        console.log(`Time Limit: ${data.timeLeft/1000} seconds`);
        console.log(`Opponent ID: ${data.opponent}`);

        // Simulate making a guess
        const randomOffset = Math.random() * 100 - 50; // Random guess ±$50 from initial price
        const guess = data.initialPrice + randomOffset;
        
        // Add small delay to make guesses more realistic
        setTimeout(() => {
            socket.emit('makeGuess', guess);
            console.log(`${playerName} made guess: $${guess.toFixed(2)}`);
        }, Math.random() * 2000); // Random delay up to 2 seconds
    });

    socket.on('guessReceived', (data) => {
        console.log(`${playerName}'s guess was received: $${data.guess.toFixed(2)}`);
    });

    socket.on('gameEnd', (results) => {
        console.log(`\n${playerName} - Game Ended!`);
        console.log('Final Results:', {
            finalPrice: `$${results.finalPrice.toFixed(2)}`,
            player1Guess: results.player1Guess ? `$${results.player1Guess.toFixed(2)}` : 'No guess',
            player2Guess: results.player2Guess ? `$${results.player2Guess.toFixed(2)}` : 'No guess',
            winner: results.winner,
            message: results.message
        });
    });

    socket.on('disconnect', () => {
        console.log(`${playerName} disconnected`);
    });

    socket.on('error', (error) => {
        console.error(`${playerName} encountered error:`, error);
    });

    return socket;
}

// Run the test
console.log('Starting price guessing game test...');
console.log('Connecting to server at:', SERVER_URL);

const player1 = createTestPlayer('Player 1');
const player2 = createTestPlayer('Player 2');

// Start the game for both players
setTimeout(() => {
    console.log('\nPlayer 1 searching for game...');
    player1.emit('findGame');
}, 1000);

setTimeout(() => {
    console.log('Player 2 searching for game...');
    player2.emit('findGame');
}, 2000);

// Cleanup after test
setTimeout(() => {
    console.log('\nTest completed, disconnecting players...');
    player1.disconnect();
    player2.disconnect();
    process.exit(0);
}, TEST_DURATION);

// Error handling for connection failures
process.on('unhandledRejection', (error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
