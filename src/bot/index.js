require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDatabase } = require('../database/connection');
const { logActivity } = require('../utils/logger');
const startInternalApi = require('./internal-api');

class ModerationBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildModeration
            ]
        });

        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();
        this.client.config = {
            prefix: process.env.BOT_PREFIX || '!',
            ownerId: process.env.BOT_OWNER_ID
        };

        // Settings cache
        this.client.settingsCache = {};
        this.client.refreshGuildSettings = async (guildId) => {
            const GuildModel = require('../database/models/Guild');
            const guild = await GuildModel.findOne({ guildId });
            if (guild) {
                this.client.settingsCache[guildId] = guild.settings;
            }
        };
        this.client.refreshAllGuildSettings = async () => {
            const GuildModel = require('../database/models/Guild');
            const allGuilds = await GuildModel.find();
            for (const guild of allGuilds) {
                this.client.settingsCache[guild.guildId] = guild.settings;
            }
        };

        // Internal API
        startInternalApi(this.client);
    }

    async start() {
        try {
            await connectDatabase();
            console.log('✅ Connected to database');

            await this.client.refreshAllGuildSettings();
            console.log('✅ Loaded all guild settings into cache');

            await this.loadCommands();
            console.log('✅ Loaded commands');

            await this.loadEvents();
            console.log('✅ Loaded events');

            await this.client.login(process.env.DISCORD_TOKEN);
            console.log('✅ Bot logged in successfully');

            await logActivity('BOT_STARTUP', 'Bot started successfully', null, null);
        } catch (error) {
            console.error('❌ Error starting bot:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');

        // 🔁 Load subfolders (category/command.js)
        if (fs.existsSync(commandsPath)) {
            const folders = fs.readdirSync(commandsPath);

            for (const folder of folders) {
                const folderPath = path.join(commandsPath, folder);
                if (fs.statSync(folderPath).isDirectory()) {
                    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
                    for (const file of files) {
                        const filePath = path.join(folderPath, file);
                        const command = require(filePath);
                        if ('data' in command && 'execute' in command) {
                            this.client.commands.set(command.data.name, command);
                            console.log(`📝 Loaded command (nested): ${command.data.name}`);
                        }
                    }
                }
            }

            // ➕ Load flat commands (commands/ping.js)
            const rootFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
            for (const file of rootFiles) {
                const command = require(path.join(commandsPath, file));
                if ('data' in command && 'execute' in command) {
                    this.client.commands.set(command.data.name, command);
                    console.log(`📝 Loaded command (flat): ${command.data.name}`);
                }
            }
        } else {
            console.warn('⚠️ No "commands" directory found');
        }
    }

async loadEvents() {
  const baseEventPath = path.join(__dirname);
  const possiblePaths = [
    path.join(baseEventPath, 'events'),
    path.join(baseEventPath, 'bot', 'events'),
    path.join(baseEventPath, '..', 'events'),
    path.join(baseEventPath, '..', 'bot', 'events')
  ];

  let eventsPath = null;

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      eventsPath = possiblePath;
      break;
    }
  }

  if (!eventsPath) {
    console.warn('⚠️ No events folder found in expected paths.');
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      this.client.once(event.name, (...args) => event.execute(...args, this.client));
    } else {
      this.client.on(event.name, (...args) => event.execute(...args, this.client));
    }

    console.log(`📅 Loaded event: ${event.name}`);
  }
}
}

// Start the bot
const bot = new ModerationBot();
bot.start();

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    await logActivity('BOT_SHUTDOWN', 'Bot shutting down', null, null);
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
