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

// Set Persistent Commands (Menu)
bot.setMyCommands([
    { command: '/start', description: 'Start the bot' },
    { command: '/help', description: 'Show help information' },
]);

// Start Command with Inline Buttons
bot.onText(/\/start/, (msg) => {
    const welcomeMessage = `
✨ **Welcome to Your Stylish Assistant Bot!** 🤖  
I’m here to assist you with URL processing and provide quick information at your fingertips.

⚙️ **Features**:  
1. URL processing for tgWebAppData and other encoded queries.  
2. Simplified and elegant design.  

📌 Use the buttons below to explore more options or get started!  
🔗 **Contact Information** available as well.
    `;

    const startOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💡 About Me', callback_data: 'about_me' }],
                [{ text: '📩 Contact Creator', callback_data: 'contact_creator' }],
                [{ text: 'ℹ️ Bot Features', callback_data: 'bot_features' }],
                [{ text: '❓ Help & FAQ', callback_data: 'help_faq' }],
            ],
        },
        parse_mode: 'Markdown',
    };

    bot.sendMessage(msg.chat.id, welcomeMessage, startOptions);
});

// Handle Inline Button Actions
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'about_me') {
        bot.sendMessage(
            chatId,
            `
👤 **About the Creator**:  
- **Name**: Hyperosis Love  
- **Username**: [@hyperosislove](https://t.me/hyperosislove)  
- **Specialty**: Creating advanced Telegram bots and automation tools.  

🔗 Feel free to reach out for collaboration!
            `,
            { parse_mode: 'Markdown' }
        );
    } else if (callbackQuery.data === 'contact_creator') {
        bot.sendMessage(
            chatId,
            `
📩 **Contact Information**:  
- **Telegram**: [@hyperosislove](https://t.me/hyperosislove)  
- **Email**: hyperosis@example.com  
- **Availability**: Monday to Friday, 10 AM - 6 PM.
            `,
            { parse_mode: 'Markdown' }
        );
    } else if (callbackQuery.data === 'bot_features') {
        bot.sendMessage(
            chatId,
            `
✨ **Bot Features**:  
1. Process tgWebAppData from URLs.  
2. Minimalist design for ease of use.  
3. Fast and efficient URL parsing.  
4. Fully customizable for your needs.  

💻 Updated regularly with modern features.
            `,
            { parse_mode: 'Markdown' }
        );
    } else if (callbackQuery.data === 'help_faq') {
        bot.sendMessage(
            chatId,
            `
❓ **Help & FAQ**:  
- **How to use this bot?**  
  Send any encoded URL, and I’ll process it for you.  

- **What formats are supported?**  
  tgWebAppData, queries, and more.  

- **Need more help?**  
  Contact my creator [@hyperosislove](https://t.me/hyperosislove).
            `,
            { parse_mode: 'Markdown' }
        );
    }
});

// URL Processing without Inline Buttons
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

                // Send processed data in monospace format
                bot.sendMessage(chatId, `\`\`\`\n${processedString}\n\`\`\``, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, '❌ Invalid URL format: Missing tgWebAppData, query, or user.');
            }
        } catch (error) {
            bot.sendMessage(chatId, '⚠️ Error processing URL: ' + error.message);
        }
    }
});
