const express = require('express');
const app = express();
app.use(express.json());

module.exports = (client) => {
    // Refresh settings for a specific guild
    app.post('/internal/refresh-settings/:guildId', async (req, res) => {
        const { guildId } = req.params;
        try {
            if (client.refreshGuildSettings) {
                await client.refreshGuildSettings(guildId);
                return res.json({ success: true, message: `Settings refreshed for guild ${guildId}` });
            } else {
                return res.status(500).json({ success: false, message: 'refreshGuildSettings not available' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // Refresh all guild settings
    app.post('/internal/refresh-settings', async (req, res) => {
        try {
            if (client.refreshAllGuildSettings) {
                await client.refreshAllGuildSettings();
                return res.json({ success: true, message: 'All settings refreshed' });
            } else {
                return res.status(500).json({ success: false, message: 'refreshAllGuildSettings not available' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    const port = process.env.BOT_INTERNAL_API_PORT || 5050;
    app.listen(port, () => {
        console.log(`🔒 Internal bot API listening on port ${port}`);
    });
}; 