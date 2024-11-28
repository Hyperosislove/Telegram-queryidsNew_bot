const TelegramBot = require('node-telegram-bot-api');
const querystring = require('querystring');

// Environment variable for the Telegram Bot Token
const BOT_TOKEN = process.env.BOT_TOKEN; // Get token from environment variable

// Create a new Telegram Bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Welcome message when user starts the bot
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = 'Hello! Send me an encoded URL to process.';

    bot.sendMessage(msg.chat.id, welcomeMessage);
});

// Handling incoming messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Process the URL if message is not a command
    if (!text.startsWith('/') && text.length > 0) {
        try {
            // Extract URL from the message
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) throw new Error('No valid URL found in the text.');

            let urlText = urlMatch[0];

            // Parsing URL and extracting the fragment
            const url = new URL(urlText);
            const fragment = url.hash.substring(1); // Removing '#' from hash
            const params = querystring.parse(fragment);

            let tgWebAppData;

            // Check for tgWebAppData, query, or user parameters
            if (params.tgWebAppData) {
                tgWebAppData = params.tgWebAppData;
            } else if (params.query) {
                tgWebAppData = params.query;
            } else if (params.user) {
                tgWebAppData = `user=${params.user}`;
            }

            if (tgWebAppData) {
                const decodedParams = querystring.parse(decodeURIComponent(tgWebAppData));

                let processedString;
                if (decodedParams.query_id) {
                    processedString = `query_id=${decodedParams.query_id}&user=${encodeURIComponent(decodedParams.user)}&auth_date=${decodedParams.auth_date}&hash=${decodedParams.hash}`;
                } else if (decodedParams.user && decodedParams.auth_date && decodedParams.hash) {
                    processedString = `user=${encodeURIComponent(decodedParams.user)}&auth_date=${decodedParams.auth_date}&hash=${decodedParams.hash}`;
                } else {
                    bot.sendMessage(chatId, 'Invalid URL format: Missing required parameters.');
                    return;
                }

                // Send processed string back to the user
                bot.sendMessage(chatId, `\`${processedString}\``, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, 'Invalid URL format: Missing tgWebAppData, query, or user.');
            }
        } catch (error) {
            bot.sendMessage(chatId, 'Error processing URL: ' + error.message);
        }
    }
});