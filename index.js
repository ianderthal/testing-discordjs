const dotenv = require('dotenv');
// Decide which env file to load
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

// Built-in modules
const fs = require('node:fs');
const path = require('node:path');

// Third party modules
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const express = require('express');

// Express app
const app = express();
app.use(express.json());

const token = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.cooldowns = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);


// Express Webhook Endpoint
app.post("/strava/webhook", async (req, res) => {
  console.log("Webhook event:", req.body);

  // Send discord message when new activity is created
  if(req.body.object_type === "activity" && req.body.aspect_type === "create") {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    channel.send("New Strava activity received");
  }

  res.sendStatus(200);
});

// Start Express server
app.listen(3000, () => {
  console.log("Express server listening on http://localhost:3000");
});