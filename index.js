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

// Modern Welcome Message
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = `
✨ **Welcome to Your Stylish Assistant Bot!** 🤖  
I’m here to help you process encoded URLs, manage data, and provide easy interaction options.

🔹 **What can I do for you?**  
1. Process **encoded URLs** into a readable format.  
2. Provide quick **copy options** for processed results.  
3. Share detailed **info about this bot**.  

📌 _Use the buttons below to get started!_

⚙️ **Pro Tip:** Send any URL directly to process it.
`;

    const startOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔗 Learn More', callback_data: 'learn_more' }],
                [{ text: '⚙️ Send Info', callback_data: 'send_info' }],
            ],
        },
        parse_mode: 'Markdown',
    };

    bot.sendMessage(msg.chat.id, welcomeMessage, startOptions);
});

// Handle Callback Queries (Inline Button Actions)
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'learn_more') {
        const learnMoreMessage = `
🛠️ **How this Bot Works**:  
1. Send any **encoded URL** (e.g., a link with tgWebAppData).  
2. The bot will process it into readable data.  
3. Use the **Copy Button** or reprocess as needed.

🔗 Created by: [Your Name](https://t.me/yourusername)  
📦 Updated Weekly.
`;

        bot.sendMessage(chatId, learnMoreMessage, { parse_mode: 'Markdown' });
    } else if (callbackQuery.data === 'send_info') {
        const infoMessage = `
💡 **Bot Info**:  
- **Creator**: [@yourusername](https://t.me/yourusername)  
- **Features**: Advanced URL processing, stylish design, easy interaction.  
- **Contact**: [Contact Me](https://t.me/yourusername)

📅 **Maintenance**: Fridays (Unavailable).
`;

        bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
    }
});

// URL Processing with Custom Copy Option
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (!text.startsWith('/') && text.length > 0) {
        try {
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) throw new Error('No valid URL found in the text.');

            const urlText = urlMatch[0];
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

                // Stylish Copy and Resend Buttons
                const copyResendOptions = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📋 Copy Result', callback_data: 'copy_result' }],
                            [{ text: '🔄 Resend URL', callback_data: 'resend_url' }],
                        ],
                    },
                    parse_mode: 'Markdown',
                };

                bot.sendMessage(chatId, `🔧 **Processed Data**: \`${processedString}\`\n\nChoose an option below:`, copyResendOptions);
            } else {
                bot.sendMessage(chatId, '❌ Invalid URL format: Missing tgWebAppData, query, or user.');
            }
        } catch (error) {
            bot.sendMessage(chatId, '⚠️ Error processing URL: ' + error.message);
        }
    }
});

// Handle Inline Button Actions for Copy and Resend
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'copy_result') {
        bot.sendMessage(chatId, '📋 **Copied to Clipboard**! (Simulated)', { parse_mode: 'Markdown' });
    } else if (callbackQuery.data === 'resend_url') {
        bot.sendMessage(chatId, '🔄 Resend the URL by typing or pasting it here!');
    }
});
