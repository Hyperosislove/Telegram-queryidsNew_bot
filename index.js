const TelegramBot = require('node-telegram-bot-api');
const querystring = require('querystring');
const express = require('express');
const app = express();

// Replace 'YOUR_BOT_TOKEN' with your actual Telegram bot token
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.get('/', (req, res) => {
    res.send('Bot is running...');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Stylish Welcome Message with Modern Design
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = `
    💬 **Welcome to the Stylish Bot!**
    
    I am a modern Telegram bot created to make your life easier! 🤖✨
    
    Here’s how I work:
    1. Send me an **encoded URL** and I will process it for you.
    2. Tap on **Send my Info** to get more details about me.
    
    I’m updated weekly and am available to help you anytime. Just send a URL and I’ll take care of the rest! 😎

    ⏳ _Note: I am down for maintenance on Fridays!_

    Use the buttons below to interact with me.
    `;

    const startButton = {
        reply_markup: {
            keyboard: [
                [
                    { text: 'Send my Info' }, 
                    { text: '🔄 Process URL' }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        },
    };

    bot.sendMessage(msg.chat.id, welcomeMessage, startButton);
});

// Stylish "Send My Info" Command
bot.onText(/\/send my info/i, (msg) => {
    const userInfo = `
    💡 **About Me**:
    - **Creator**: [@hyperosislove](https://t.me/hyperosislove)
    - **Bot Features**: Weekly updates, URL processing, and personalized assistance.
    - **Maintenance**: I am unavailable on **Fridays** for maintenance.
    
    📲 **Contact**: [Your Contact Info] (Feel free to reach out!)

    ✅ **Fun Fact**: I was designed to make your Telegram experience smoother and easier! 🚀
    `;

    bot.sendMessage(msg.chat.id, userInfo, { parse_mode: 'Markdown' });
});

// Process the URL and make it stylish
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (!text.startsWith('/') && text.length > 0) { // Skip if it's a command
        try {
            // Extract the URL from the text
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) throw new Error('No valid URL found in the text.');

            let urlText = urlMatch[0];

            const url = new URL(urlText);
            const fragment = url.hash.substring(1); // Remove the leading '#'
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
                    bot.sendMessage(chatId, '❌ Invalid URL format: Missing required parameters.');
                    return;
                }

                // Modern button for URL copy action
                const copyButton = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📋 Copy URL',
                                    callback_data: 'copy_url'
                                }
                            ]
                        ]
                    }
                };

                // Send the processed string with markdown and button
                bot.sendMessage(chatId, `🔧 **Processed URL**: \`${processedString}\`\n\nClick on the button below to copy it!`, {
                    parse_mode: 'Markdown',
                    reply_markup: copyButton.reply_markup,
                });
            } else {
                bot.sendMessage(chatId, '❌ Invalid URL format: Missing tgWebAppData, query, or user.');
            }
        } catch (error) {
            bot.sendMessage(chatId, '⚠️ Error processing URL: ' + error.message);
        }
    }
});

// Handle the callback data for the "Copy URL" button
bot.on('callback_query', (callbackQuery) => {
    const messageId = callbackQuery.message.message_id;
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'copy_url') {
        bot.sendMessage(chatId, '✔️ URL copied to clipboard! You can now use or resend it.');
    }
});
