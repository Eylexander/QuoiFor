const { token } = require('./settings.json');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
	partials: ["CHANNEL"],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Create better console logs
console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`));

// Reading all Event Files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	let eventName = file.split(".")[0];
	client.on(eventName, event.bind(null, client));
}

client.login(token);