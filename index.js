const TelegramBot = require('node-telegram-bot-api');
const querystring = require('querystring');
const express = require('express');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.get('/', (req, res) => {
    res.send('Bot is running...');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

bot.onText(/\/start/, (msg) => {
    const welcomeMessage = 'Hello! Send me an encoded URL to process.';
    bot.sendMessage(msg.chat.id, welcomeMessage);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (!text.startsWith('/') && text.length > 0) {
        try {
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) throw new Error('No valid URL found in the text.');

            let urlText = urlMatch[0];
            const url = new URL(urlText);
            const fragment = url.hash.substring(1);
            const params = querystring.parse(fragment);

            let tgWebAppData;
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

                bot.sendMessage(chatId, `\`${processedString}\``, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, 'Invalid URL format: Missing tgWebAppData, query, or user.');
            }
        } catch (error) {
            bot.sendMessage(chatId, 'Error processing URL: ' + error.message);
        }
    }
});
