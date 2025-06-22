const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config(); // Loads the .env file variables

// Grab the variables from process.env
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

// Check if the required environment variables are set
if (!token || !clientId) {
    console.error('Error: Make sure BOT_TOKEN and CLIENT_ID are set in your .env file.');
    process.exit(1); // Exit the script with an error code
}

const commands = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, 'src', 'bot', 'commands');

// Ensure the directory exists
if (!fs.existsSync(commandsPath)) {
    console.error(`Error: Commands directory not found at ${commandsPath}`);
    process.exit(1);
}

// Recursively load all command files from subdirectories
function loadCommandsRecursively(directory) {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
            loadCommandsRecursively(fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                // Check if the command has both 'data' and 'execute' properties
                if ('data' in command && 'execute' in command) {
                    // Further check if command.data is an object and has a toJSON method
                    if (typeof command.data === 'object' && typeof command.data.toJSON === 'function') {
                        commands.push(command.data.toJSON());
                        console.log(`[SUCCESS] Loaded command: ${command.data.name}`);
                    } else {
                        console.log(`[WARNING] The 'data' property of the command at ${fullPath} is not a valid SlashCommandBuilder instance (missing toJSON method or not an object).`);
                    }
                } else {
                    console.log(`[WARNING] The command at ${fullPath} is missing a required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to load command from ${fullPath}:`, error);
            }
        }
    }
}

loadCommandsRecursively(commandsPath);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands globally!
(async () => {
	try {
        if (commands.length === 0) {
            console.log('No commands found to deploy.');
            return;
        }
		console.log(`Started refreshing ${commands.length} application (/) commands globally.`);

		// The put method is used to fully refresh all commands with the current set
		// We use Routes.applicationCommands(clientId) for global commands.
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error('Error deploying commands:', error);
	}
})();