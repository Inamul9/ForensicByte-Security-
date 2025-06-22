# QUICK MAXXX Discord Bot & Website

A modern, responsive website with integrated Discord bot functionality. This project combines a powerful Discord bot with a beautiful website in a single, unified application.

## 🌟 Features

### Discord Bot Features
- **Moderation Commands**: ban, kick, mute, warn, clear, lock/unlock, slowmode
- **Utility Commands**: ping, serverinfo, userinfo, weather, roleinfo, emojicopy
- **Community Commands**: giveaway system, reaction roles, auto-join roles
- **Anti-Raid & Anti-Spam**: Automated protection systems
- **Event Handling**: Welcome messages, member tracking, automod
- **Prefix & Slash Commands**: Support for both command types

### Website Features
- **Modern Design**: Glass morphism, floating orbs, and subtle glow effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Real-time Stats**: Live bot statistics from your Discord bot
- **Dynamic Commands**: Commands page loads data from your actual bot
- **Server Dashboard**: Manage bot settings for your Discord servers
- **Discord OAuth2**: Secure login with Discord accounts
- **Interactive Elements**: Hover effects, animations, and smooth transitions

### Integration Features
- **Real-time Statistics**: Server count, user count, command count, uptime
- **Server Management**: View and manage bot settings for each server
- **Command System**: Dynamic command loading from your bot
- **API Endpoints**: RESTful API for bot data
- **WebSocket Support**: Real-time updates (optional)
- **Fallback System**: Graceful degradation if bot is offline

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=1371511225992609822
DISCORD_CLIENT_SECRET=kafKQ4bztLNkqWlejZfXP0vYcF9Swyfw
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (generate a random string)
SESSION_SECRET=your_session_secret_here
```

### 3. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select your existing QUICK MAXXX bot
3. Go to the "Bot" section and copy your token
4. Copy your client ID from the "General Information" section
5. Enable these intents:
   - Server Members Intent
   - Message Content Intent
   - Presence Intent (optional)
6. Add the token and client ID to your `.env` file

### 4. Deploy Bot Commands
```bash
npm run deploy-commands
```

### 5. Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Bot Statistics
- `GET /api/stats` - Get bot statistics (servers, users, commands, uptime)
- `GET /api/status` - Get bot status and ping
- `GET /api/commands` - Get list of bot commands
- `GET /api/servers` - Get list of servers
- `GET /api/server/:guildId` - Get specific server statistics

### Real-time Updates
- `GET /api/ws` - Server-Sent Events for real-time stats

### Authentication
- `GET /auth/discord` - Discord OAuth2 login
- `GET /auth/discord/callback` - OAuth2 callback
- `GET /auth/logout` - Logout

## 🎨 Pages

### Home Page (`/`)
- Hero section with animated elements
- Feature showcase
- Real-time bot statistics
- Call-to-action buttons

### Commands Page (`/commands`)
- Dynamic command loading from bot
- Category filtering (moderation, utility, community)
- Search functionality
- Copy-to-clipboard examples

### Dashboard (`/dashboard`)
- Server selection and management
- Real server statistics
- Bot configuration options
- Interactive charts and toggles

## 🔧 Configuration

### Bot Permissions
Your bot needs these permissions:
- Read Messages/View Channels
- Send Messages
- Manage Messages
- Manage Roles
- Kick Members
- Ban Members
- Manage Server

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Your Discord bot token | Yes |
| `CLIENT_ID` | Your Discord client ID | Yes |
| `DISCORD_CLIENT_ID` | Discord OAuth2 client ID | Yes |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret | Yes |
| `DISCORD_CALLBACK_URL` | OAuth2 callback URL | Yes |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `SESSION_SECRET` | Session encryption secret | Yes |

## 🛠️ Development

### Project Structure
```
├── src/                    # Bot source code
│   ├── commands/          # Bot commands
│   │   ├── moderation/    # Moderation commands
│   │   ├── utility/       # Utility commands
│   │   └── community/     # Community commands
│   ├── events/            # Bot event handlers
│   ├── features/          # Bot features (anti-raid, anti-spam)
│   ├── utils/             # Bot utilities
│   ├── config.js          # Bot configuration
│   └── index.js           # Bot main file
├── public/                # Website static files
│   ├── index.html         # Home page
│   ├── commands.html      # Commands page
│   ├── login.html         # Login page
│   ├── styles.css         # Main stylesheet
│   └── script.js          # Frontend JavaScript
├── views/
│   └── dashboard.ejs      # Dashboard template
├── server.js              # Main server (website + bot integration)
├── deploy-commands.js     # Command deployment script
├── package.json           # Dependencies
└── SETUP.md              # Detailed setup guide
```

### Adding New Features
1. **New Bot Commands**: Add files to `src/commands/`
2. **New API Endpoints**: Add routes in `server.js`
3. **New Pages**: Create HTML files in `public/` or EJS templates in `views/`
4. **Styling**: Add CSS to `public/styles.css`
5. **Frontend Logic**: Add JavaScript to `public/script.js`

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a strong session secret
3. Set up SSL certificates
4. Configure your domain in Discord OAuth2 settings
5. Use environment variables for all sensitive data
6. Deploy commands: `npm run deploy-commands`

### Recommended Hosting
- **Vercel**: Easy deployment with automatic HTTPS
- **Heroku**: Simple deployment with add-ons
- **DigitalOcean**: Full control with droplets
- **Railway**: Modern deployment platform

## 🔒 Security

### Best Practices
- Never commit `.env` files to version control
- Keep your bot token secure
- Use strong session secrets
- Enable rate limiting for production
- Set up proper CORS policies
- Use HTTPS in production

### Environment Security
```bash
# Generate a strong session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐛 Troubleshooting

### Common Issues

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

## 📝 License

This project is licensed under the MIT License.

## 🤝 Support

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify your environment variables are set correctly
3. Ensure your bot has the required permissions
4. Check the SETUP.md file for detailed instructions

The integration provides fallback data if the bot is not available, so your website will still function even if there are connection issues.

## 🆘 Support

- **Documentation**: Check the SETUP.md file
- **Issues**: Create an issue on GitHub
- **Discord**: Join our support server
- **Email**: Contact us directly

## 🙏 Acknowledgments

- Discord.js team for the excellent library
- Font Awesome for icons
- Google Fonts for typography
- Chart.js for data visualization

---

**Made with ❤️ by the QUICK MAXXX Team** 
