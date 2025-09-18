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

// Verification handshake (Strava calls this when you first subscribe)
app.get("/strava/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN;

  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log("Strava webhook verified!");
    res.json({ "hub.challenge": req.query['hub.challenge'] });
  } else {
    console.error("Strava webhook verification failed.");
    res.status(403).send("Verification failed");
  }
});

// Express Webhook Endpoint
app.post("/strava/webhook", async (req, res) => {
  console.log("Webhook event:", req.body);

  // Send discord message when new activity is created
  if(req.body.object_type === "activity" && req.body.aspect_type === "create") {
    try {
      const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
      channel.send("New Strava activity received");
    } catch (err) {
      console.error("Failed to send discord message:", err);
    }
  }

  res.sendStatus(200);
});

// Start Express server
app.listen(3000, () => {
  console.log("Express server listening on http://localhost:3000");
});