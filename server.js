const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Discord Bot Client
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot configuration
bot.commands = new Collection();
bot.prefixCommands = new Collection();
bot.cooldowns = new Collection();

// Load commands from the actual bot directory
function loadBotCommands() {
const commandsPath = path.join(__dirname, 'src', 'bot', 'commands');
    let uniquePrefixCount = 0;
    let uniqueSlashCount = 0;

    function loadCommandsRecursively(directory) {
        if (!fs.existsSync(directory)) {
            console.log('⚠️  Bot commands directory not found, using demo commands');
            return;
        }

        const files = fs.readdirSync(directory, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            if (file.isDirectory()) {
                loadCommandsRecursively(fullPath);
            } else if (file.name.endsWith('.js')) {
                try {
                    const command = require(fullPath);

                    // Slash command (has toJSON)
                    if ('data' in command && 'execute' in command && command.data.toJSON) {
                        if (!bot.commands.has(command.data.name)) {
                            bot.commands.set(command.data.name, command);
                            uniqueSlashCount++;
                            console.log(`📚 Loaded slash command: ${command.data.name}`);
                        }
                    }
                    // Prefix command (main name only)
                    else if ('data' in command && 'execute' in command && !command.data.toJSON) {
                        if (!bot.prefixCommands.has(command.data.name)) {
                            bot.prefixCommands.set(command.data.name, command);
                            uniquePrefixCount++;
                            console.log(`📚 Loaded prefix command: ${command.data.name}`);
                        }
                        // Add aliases for invocation, but don't count/log them
                        if (command.data.aliases && Array.isArray(command.data.aliases)) {
                            command.data.aliases.forEach(alias => {
                                if (!bot.prefixCommands.has(alias)) {
                                    bot.prefixCommands.set(alias, command);
                                }
                            });
                        }
                    }
                    // Legacy format
                    else if ('name' in command && 'execute' in command) {
                        if (!bot.prefixCommands.has(command.name)) {
                            bot.prefixCommands.set(command.name, command);
                            uniquePrefixCount++;
                            console.log(`📚 Loaded prefix command: ${command.name}`);
                        }
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => {
                                if (!bot.prefixCommands.has(alias)) {
                                    bot.prefixCommands.set(alias, command);
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to load command at ${fullPath}:`, error);
                }
            }
        }
    }

    loadCommandsRecursively(commandsPath);
    console.log(`📚 Loaded ${uniqueSlashCount} slash commands and ${uniquePrefixCount} prefix commands`);
}

// Bot ready event
bot.once('ready', () => {
    console.log(`🤖 ${bot.user.tag} is online and connected to the website!`);
    console.log(`📊 Serving ${bot.guilds.cache.size} servers with ${bot.users.cache.size} users`);
    loadBotCommands();
    loadBotEvents();
});

// Bot stats tracking
let botStats = {
    servers: 0,
    users: 0,
    commands: 0,
    uptime: '0s',
    lastUpdated: new Date()
};

// Update bot stats
function updateBotStats() {
    botStats = {
        servers: bot.guilds.cache.size,
        users: bot.users.cache.size,
        commands: bot.commands.size + bot.prefixCommands.size,
        uptime: formatUptime(bot.uptime),
        lastUpdated: new Date()
    };
    console.log('📈 Bot stats updated:', botStats);
}

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Update stats every 30 seconds
setInterval(updateBotStats, 30000);

// Demo commands for when bot is not connected
const demoCommands = [
    {
        name: 'ping',
        description: 'Provides a detailed system and latency report for the bot.',
        category: 'Utility',
        usage: '/ping',
        aliases: ['latency', 'status']
    },
    {
        name: 'help',
        description: 'Show available commands and their usage.',
        category: 'Utility',
        usage: '/help [command]',
        aliases: ['h', 'commands']
    },
    {
        name: 'ban',
        description: 'Ban a user from the server.',
        category: 'Moderation',
        usage: '!ban @user [reason]',
        aliases: ['b']
    },
    {
        name: 'kick',
        description: 'Kick a user from the server.',
        category: 'Moderation',
        usage: '!kick @user [reason]',
        aliases: ['k']
    },
    {
        name: 'clear',
        description: 'Clear messages from a channel.',
        category: 'Moderation',
        usage: '!clear [amount]',
        aliases: ['purge', 'delete']
    },
    {
        name: 'mute',
        description: 'Mute a user temporarily.',
        category: 'Moderation',
        usage: '!mute @user [duration] [reason]',
        aliases: ['timeout']
    },
    {
        name: 'warn',
        description: 'Warn a user for breaking rules.',
        category: 'Moderation',
        usage: '!warn @user [reason]',
        aliases: ['warning']
    },
    {
        name: 'serverinfo',
        description: 'Display detailed information about the server.',
        category: 'Utility',
        usage: '/serverinfo',
        aliases: ['server', 'si']
    },
    {
        name: 'userinfo',
        description: 'Display information about a user or yourself.',
        category: 'Utility',
        usage: '/userinfo [@user]',
        aliases: ['user', 'ui']
    },
    {
        name: 'autojoinrole',
        description: 'Manage the role automatically given to new members.',
        category: 'Community',
        usage: '!autorole [set @role | remove | setchannel #channel | removechannel]',
        aliases: ['autorole']
    },
    {
        name: 'reactionrole',
        description: 'Create reaction role messages.',
        category: 'Community',
        usage: '!reactionrole [create | delete]',
        aliases: ['rr']
    },
    {
        name: 'giveaway',
        description: 'Start a giveaway in the server.',
        category: 'Community',
        usage: '!giveaway [duration] [winners] [prize]',
        aliases: ['gw']
    }
];

// Function to categorize commands based on their name
function getCommandCategory(commandName) {
    const moderationCommands = ['ban', 'kick', 'mute', 'unmute', 'warn', 'clear', 'lock', 'unlock', 'slowmode', 'antiraid', 'antispam'];
    const utilityCommands = ['ping', 'help', 'serverinfo', 'userinfo', 'roleinfo', 'weather', 'meme', 'emojicopy', 'serverstats'];
    const communityCommands = ['giveaway', 'reroll', 'reactionrole', 'autojoinrole'];
    
    if (moderationCommands.includes(commandName)) {
        return 'Moderation';
    } else if (utilityCommands.includes(commandName)) {
        return 'Utility';
    } else if (communityCommands.includes(commandName)) {
        return 'Community';
    } else {
        return 'General';
    }
}

// Set view engine
app.set('view engine', 'ejs');

// Discord strategy setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID || '1371694773374812271',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || 'llsVgNeYm0UZJpNnlnDqWDlLN2RijJbu',
    callbackURL: process.env.DISCORD_CALLBACK_URL || `http://localhost:${PORT}/auth/discord/callback`,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    // In a real app, you'd find or create a user in your database here
    console.log('🔐 Discord OAuth2 Profile received:', {
        id: profile.id,
        username: profile.username,
        guildsCount: profile.guilds ? profile.guilds.length : 0
    });
    
    if (profile.guilds) {
        console.log('📋 User guilds:', profile.guilds.map(g => ({
            id: g.id,
            name: g.name,
            permissions: g.permissions,
            hasManageGuild: (g.permissions & 0x20) === 0x20
        })));
    }
    
    process.nextTick(() => {
        return done(null, profile);
    });
}));

// Session setup
app.use(session({
    secret: 'a-very-secret-key-that-should-be-in-env', // Replace with a real secret
    resave: false,
    saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to check authentication
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Serve static files
app.use(express.static('public'));

// Auth routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/dashboard'); // Successful auth
});

app.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/commands', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'commands.html'));
});

app.get('/dashboard', checkAuth, (req, res) => {
    console.log('🏠 Dashboard accessed by user:', req.user.username);
    console.log('📊 User guilds count:', req.user.guilds ? req.user.guilds.length : 0);
    
    // Get bot guilds (servers where bot is present)
    const botGuilds = bot.user ? bot.guilds.cache.map(g => g.id) : [];
    console.log('🤖 Bot guilds:', botGuilds);
    
    if (!req.user.guilds || req.user.guilds.length === 0) {
        console.log('❌ No user guilds found in profile - user may need to re-authenticate');
        res.render('dashboard', {
            user: req.user,
            guilds: []
        });
        return;
    }
    
    // Filter user guilds where:
    // 1. User has MANAGE_GUILD permissions
    // 2. Bot is present in the server
    const manageableGuilds = req.user.guilds.filter(g => {
        const hasManageGuild = (g.permissions & 0x20) === 0x20;
        const botIsPresent = botGuilds.includes(g.id);
        console.log(`🔍 Guild ${g.name} (${g.id}): hasManageGuild=${hasManageGuild}, botIsPresent=${botIsPresent}`);
        return hasManageGuild && botIsPresent;
    });
    
    console.log('✅ Manageable guilds found:', manageableGuilds.length);
    
    // If no manageable guilds found, show all user guilds where bot is present
    const availableGuilds = manageableGuilds.length > 0 ? manageableGuilds : 
        req.user.guilds.filter(g => botGuilds.includes(g.id));
    
    console.log('🎯 Final available guilds:', availableGuilds.length);
    availableGuilds.forEach(g => {
        console.log(`  - ${g.name} (${g.id})`);
    });
    
    // If still no guilds found, show a message about re-authentication
    if (availableGuilds.length === 0) {
        console.log('⚠️ No available guilds found - suggesting re-authentication');
    }
    
    res.render('dashboard', {
        user: req.user,
        guilds: availableGuilds
    });
});

// API endpoint for bot statistics
app.get('/api/stats', (req, res) => {
    // Check if bot is connected
    if (!bot.user) {
        return res.json({
            servers: 1250,
            users: 45000,
            commands: 25,
            uptime: 'Demo Mode',
            lastUpdated: new Date(),
            status: 'demo',
            message: 'Please add BOT_TOKEN to enable server statistics',
            botStatus: 'offline'
        });
    }

    res.json({
        ...botStats,
        status: 'online',
        botStatus: 'online'
    });
});

// API endpoint for server-specific stats
app.get('/api/server/:guildId', async (req, res) => {
    try {
        // Check if bot is connected
        if (!bot.user) {
            return res.status(503).json({ 
                error: 'Bot not connected', 
                message: 'Please add BOT_TOKEN to enable server statistics',
                status: 'demo'
            });
        }

        const guildId = req.params.guildId;
        const guild = bot.guilds.cache.get(guildId);
        
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const stats = {
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
            roleCount: guild.roles.cache.size,
            channelCount: guild.channels.cache.size,
            onlineMembers: guild.members.cache.filter(member => member.presence?.status !== 'offline').size,
            createdAt: guild.createdAt,
            owner: guild.ownerId
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching server stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for commands
app.get('/api/commands', (req, res) => {
    // Check if bot is connected
    if (!bot.user) {
        return res.json({
            commands: demoCommands,
            status: 'demo',
            message: 'Bot not connected. Add BOT_TOKEN to enable full integration.'
        });
    }

    const allCommands = [];
    
    // Add slash commands
    bot.commands.forEach(command => {
        allCommands.push({
            name: command.data.name,
            description: command.data.description,
            type: 'slash',
            category: getCommandCategory(command.data.name)
        });
    });
    
    // Add prefix commands
    bot.prefixCommands.forEach(command => {
        allCommands.push({
            name: command.name,
            description: command.description || 'No description available',
            type: 'prefix',
            category: getCommandCategory(command.name)
        });
    });

    res.json({
        commands: allCommands,
        status: 'online'
    });
});

// API endpoint for bot status
app.get('/api/status', (req, res) => {
    // Check if bot is connected
    if (!bot.user) {
        res.json({
            status: 'demo',
            ping: 0,
            uptime: 'Demo Mode',
            lastHeartbeat: null,
            shardCount: 0,
            message: 'Bot not connected. Add BOT_TOKEN to enable full integration.'
        });
        return;
    }

    res.json({
        status: bot.ws.status === 0 ? 'online' : 'offline',
        ping: bot.ws.ping,
        uptime: botStats.uptime,
        lastHeartbeat: bot.ws.lastHeartbeat,
        shardCount: bot.ws.shards.size
    });
});

// API endpoint for user's manageable servers
app.get('/api/servers', (req, res) => {
    console.log('🔍 /api/servers endpoint called');
    
    // Check if bot is connected
    if (!bot.user) {
        console.log('❌ Bot not connected, returning demo servers');
        // Return demo servers
        const demoServers = [
            { id: 'demo1', name: 'Demo Server 1', icon: null },
            { id: 'demo2', name: 'Demo Server 2', icon: null },
            { id: 'demo3', name: 'Demo Server 3', icon: null }
        ];
        res.json(demoServers);
        return;
    }

    // Return actual servers the bot is in
    const servers = bot.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL()
    }));
    
    console.log('🤖 Bot servers found:', servers.length);
    servers.forEach(server => {
        console.log(`  - ${server.name} (${server.id})`);
    });
    
    res.json(servers);
});

// Debug endpoint to check bot guilds
app.get('/api/debug/bot-guilds', (req, res) => {
    if (!bot.user) {
        res.json({ error: 'Bot not connected' });
        return;
    }
    
    const guilds = bot.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        joinedAt: guild.joinedAt
    }));
    
    res.json({
        totalGuilds: guilds.length,
        guilds: guilds
    });
});

// API endpoint for server configuration
app.get('/api/server/:guildId/config', async (req, res) => {
    try {
        // Check if bot is connected
        if (!bot.user) {
            return res.status(503).json({ 
                error: 'Bot not connected', 
                message: 'Please add BOT_TOKEN to enable server configuration',
                status: 'demo'
            });
        }

        const guildId = req.params.guildId;
        const guild = bot.guilds.cache.get(guildId);
        
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        // Get server configuration (this would normally come from a database)
        const config = {
            welcomeMessages: true,
            autoRoles: false,
            moderationLogs: true,
            musicModule: true,
            antiSpam: true,
            antiRaid: true,
            welcomeChannel: null,
            logChannel: null,
            autoRole: null
        };

        res.json(config);
    } catch (error) {
        console.error('Error fetching server config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to update server configuration
app.post('/api/server/:guildId/config', express.json(), async (req, res) => {
    try {
        // Check if bot is connected
        if (!bot.user) {
            return res.status(503).json({ 
                error: 'Bot not connected', 
                message: 'Please add BOT_TOKEN to enable server configuration',
                status: 'demo'
            });
        }

        const guildId = req.params.guildId;
        const guild = bot.guilds.cache.get(guildId);
        
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const config = req.body;
        
        // Here you would normally save the configuration to a database
        console.log(`Updating config for guild ${guildId}:`, config);
        
        res.json({ 
            success: true, 
            message: 'Configuration updated successfully',
            config: config
        });
    } catch (error) {
        console.error('Error updating server config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// WebSocket endpoint for real-time updates (optional)
app.get('/api/ws', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = () => {
        res.write(`data: ${JSON.stringify(botStats)}\n\n`);
    };

    const interval = setInterval(sendUpdate, 5000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

// Handle prefix commands
bot.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Get prefix from config
    const prefix = '!'; // You can make this configurable
    
    // Check if message starts with prefix
    if (!message.content.startsWith(prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Get command from collection
    const command = bot.prefixCommands.get(commandName);
    
    if (!command) return;
    
    try {
        await command.execute(message, args, bot);
    } catch (error) {
        console.error(`[ERROR] Error executing prefix command ${commandName}:`, error);
        await message.reply('There was an error while executing this command!').catch(console.error);
    }
});

// Handle slash commands
bot.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = bot.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Load events from the bot's events directory
function loadBotEvents() {
    const eventsPath = path.join(__dirname, 'src', 'events');
    
    if (!fs.existsSync(eventsPath)) {
        console.log('⚠️  Bot events directory not found');
        return;
    }
    
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            if (event.once) {
                bot.once(event.name, (...args) => event.execute(...args, bot));
            } else {
                bot.on(event.name, (...args) => event.execute(...args, bot));
            }
            console.log(`📅 Loaded event: ${event.name}`);
        } catch (error) {
            console.error(`Failed to load event ${file}:`, error);
        }
    }
}

// Start the server and bot
async function startServer() {
    try {
        // Check if bot token is provided
        if (!process.env.BOT_TOKEN) {
            console.log('⚠️  No Discord bot token provided. Running in demo mode.');
            console.log('📝 Add BOT_TOKEN to your .env file to enable full bot integration.');
            
            // Start the web server without bot
            app.listen(PORT, () => {
                console.log(`🌐 QUICK MAXXX website server running at http://localhost:${PORT}`);
                console.log(`🤖 Bot integration: DISABLED (demo mode)`);
                
                // Set demo stats
                botStats = {
                    servers: 1250,
                    users: 45000,
                    commands: 25,
                    uptime: 'Demo Mode',
                    lastUpdated: new Date()
                };
            });
            return;
        }

        // Login the bot
        await bot.login(process.env.BOT_TOKEN);
        
        // Start the web server
        app.listen(PORT, () => {
            console.log(`🌐 QUICK MAXXX website server running at http://localhost:${PORT}`);
            console.log(`🤖 Bot connected successfully!`);
            
            // Initial stats update
            updateBotStats();
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        
        if (error.code === 'TokenInvalid') {
            console.log('💡 Please check your BOT_TOKEN in the .env file');
            console.log('📝 You can get your bot token from: https://discord.com/developers/applications');
        }
        
        // Start server in demo mode even if bot fails
        console.log('🔄 Starting server in demo mode...');
        app.listen(PORT, () => {
            console.log(`🌐 QUICK MAXXX website server running at http://localhost:${PORT}`);
            console.log(`🤖 Bot integration: DISABLED (demo mode)`);
            
            // Set demo stats
            botStats = {
                servers: 1250,
                users: 45000,
                commands: 25,
                uptime: 'Demo Mode',
                lastUpdated: new Date()
            };
        });
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    bot.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    bot.destroy();
    process.exit(0);
});

// Start everything
startServer(); 