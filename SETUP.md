# QUICK MAXXX Website & Bot Setup Guide

## Integrated Discord Bot & Website Setup

This project now contains both the Discord bot and the website in a single, unified structure.

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here

# Discord OAuth2 Configuration (for website login)
DISCORD_CLIENT_ID=1371511225992609822
DISCORD_CLIENT_SECRET=kafKQ4bztLNkqWlejZfXP0vYcF9Swyfw
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (generate a random string for production)
SESSION_SECRET=your_session_secret_here
```

### 3. Discord Bot Token Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select your existing QUICK MAXXX bot
3. Go to the "Bot" section
4. Copy your bot token and paste it in the `.env` file as `BOT_TOKEN`
5. Copy your client ID and paste it in the `.env` file as `CLIENT_ID`
6. Make sure your bot has the following permissions:
   - Read Messages/View Channels
   - Send Messages
   - Manage Messages
   - Manage Roles
   - Kick Members
   - Ban Members
   - Manage Server

### 4. Bot Intents Setup
In your Discord Developer Portal, enable these intents for your bot:
- Server Members Intent
- Message Content Intent
- Presence Intent (optional)

### 5. Deploy Bot Commands
Before running the application, deploy your slash commands:
```bash
npm run deploy-commands
```

### 6. Running the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 7. Project Structure
```
├── src/                    # Bot source code
│   ├── commands/          # Bot commands (moderation, utility, community)
│   ├── events/            # Bot event handlers
│   ├── features/          # Bot features (anti-raid, anti-spam)
│   ├── utils/             # Bot utilities
│   ├── config.js          # Bot configuration
│   └── index.js           # Bot main file
├── public/                # Website static files
├── views/                 # Website templates
├── server.js              # Main server (website + bot integration)
├── deploy-commands.js     # Command deployment script
└── package.json           # Dependencies
```

### 8. Features Available

#### Discord Bot Features
- **Moderation Commands**: ban, kick, mute, warn, clear, etc.
- **Utility Commands**: ping, serverinfo, userinfo, weather, etc.
- **Community Commands**: giveaway, reaction roles, auto-join roles
- **Anti-Raid & Anti-Spam**: Automated protection systems
- **Event Handling**: Welcome messages, member tracking

#### Website Features
- **Real-time Bot Statistics**: Live server count, user count, uptime
- **Command Management**: View and manage bot commands
- **Server Dashboard**: Manage bot settings per server
- **User Authentication**: Discord OAuth2 login
- **API Endpoints**: RESTful API for bot data

#### API Endpoints
- `/api/stats` - Get bot statistics
- `/api/commands` - Get list of bot commands
- `/api/status` - Get bot status and ping
- `/api/servers` - Get list of servers
- `/api/server/:guildId` - Get specific server statistics
- `/api/ws` - Real-time stats updates (Server-Sent Events)

### 9. Troubleshooting

#### Bot Not Connecting
- Check if your `BOT_TOKEN` is correct
- Ensure the bot has proper permissions
- Verify intents are enabled in Discord Developer Portal

#### Commands Not Working
- Run `npm run deploy-commands` to deploy slash commands
- Check if commands are properly loaded in console
- Verify command structure in `src/commands/`

#### Website Not Loading Stats
- Check browser console for errors
- Verify the API endpoints are responding
- Ensure the bot is running and connected

### 10. Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use a strong session secret
3. Set up proper SSL certificates
4. Configure your domain in Discord OAuth2 settings
5. Use environment variables for all sensitive data
6. Deploy commands to production: `npm run deploy-commands`

### 11. Security Notes
- Never commit your `.env` file to version control
- Keep your bot token secure
- Use strong session secrets
- Enable rate limiting for production
- Set up proper CORS policies

## Support
If you encounter any issues, check the console logs for detailed error messages. The integration provides fallback data if the bot is not available, so your website will still function even if there are connection issues. 