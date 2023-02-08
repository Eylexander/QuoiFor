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
const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment');

// Initiate the database
if (!fs.existsSync('./database')) { fs.mkdirSync('./database'); };
const db = require('better-sqlite3');
const cnt = new db('./database/counter.sqlite');

// Create better console logs
console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Define the counter.sqlite database for the system
const counter = cnt.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'counter';").get();
if (!counter['count(*)']) {
    cnt.prepare("CREATE TABLE counter (id TEXT PRIMARY KEY, number NUMBER);").run();
    // Ensure that the "id" row is always unique and indexed.
    cnt.prepare("CREATE UNIQUE INDEX idx_counter_id ON counter (id);").run();
    cnt.pragma("asynchronous = 1");
    cnt.pragma("journal_mode = wal");
}

// Define the triggers words
let triggers = [
    "quoi",
    "qwa",
    "koï",
    "kwa",
    "koi",
    "qoi",
    "koa"
]

// Define the respond gifs
let gifs = [
    "https://tenor.com/view/feur-th%C3%A9obabac-not-funny-gif-22130648",
    "https://tenor.com/view/feur-theobabac-quoi-gif-24294658",
    "https://tenor.com/view/feur-meme-gif-24407942",
    "https://tenor.com/view/feur-quoi-gif-25202359",
    "https://tenor.com/view/feur-quoi-clip-gif-21195505",
    "https://tenor.com/view/feur-heart-locket-vred-quoi-quoi-feur-gif-22321210",
    "https://tenor.com/view/feur-gif-24566779",
    "https://tenor.com/view/feur-phoenix-wright-take-that-objection-gif-21362776"
]

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;
    if (message.channel.type === 'DM') return;

    // Get the current count
    let count = cnt.prepare("SELECT * FROM counter WHERE id = ?;").get(message.author.id);
    if (!count) {
        count = { id: message.author.id, number: 0 }
        cnt.prepare("INSERT INTO counter VALUES (@id, @number);").run(count);
    }

    if (triggers.includes(message.content.toLowerCase())) {
        count.number++;
        cnt.prepare("UPDATE counter SET number = @number WHERE id = @id;").run(count);
        return message.reply({
            content: gifs[Math.floor(Math.random() * gifs.length)],
            allowedMentions: { repliedUser: false }
        })
    }

    if (message.content.startsWith("<@" + client.user.id + ">")) {

        const args = message.content.slice(client.user.id.length+3).trim().split(/ +/);

        if (!args[0]) {
            return message.reply({
                content: `Tu as dis ${count.number} fois le mot "quoi" depuis que je suis là !`,
                allowedMentions: { repliedUser: false }
            })
        } else if (args[0] === "reset") {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
            count.number = 0;
            cnt.prepare("UPDATE counter SET number = @number WHERE id = @id;").run(count);
            return message.reply({
                content: `Le compteur a été réinitialisé !`,
                allowedMentions: { repliedUser: false }
            })
        } else if (args[0] === "help") {
            return message.reply({
                content: `Voici les commandes disponibles : \n - <@${client.user.id}> : Affiche le nombre de fois que tu as le mot "quoi" ! \n - <@${client.user.id}> count : Affiche le compteur global !`,
                allowedMentions: { repliedUser: false }
            })
        } else if (args[0] === 'count') {
            let countEveryQuoi = cnt.prepare("SELECT number FROM counter;").all();
            let getCountAll = 0;
            for (let i = 0; i < countEveryQuoi.length; i++) {
                getCountAll += countEveryQuoi[i].number;
            }
            return message.reply({
                content: `Le mot "quoi" a été dit ${getCountAll} fois depuis que je suis là !`,
                allowedMentions: { repliedUser: false }
            })
        } else if (args[0] === 'top') {
            let getTopCount = cnt.prepare("SELECT * FROM counter ORDER BY number DESC LIMIT 10;").all();
            let topCount = "";
            for (let i = 0; i < getTopCount.length; i++) {
                topCount += `${i+1}. <@${getTopCount[i].id}> : ${getTopCount[i].number} fois\n`;
            }
            return message.reply({
                content: `Voici le top 10 des personnes qui ont le plus dit le mot "quoi" : \n${topCount}`,
                allowedMentions: { repliedUser: false }
            })
        } else if (args[0] === 'invite') {
            return message.reply({
                content: `Voici le lien d'invitation du bot : \nhttps://discord.com/api/oauth2/authorize?client_id=1072888923438727240&permissions=76800&scope=bot`,
                allowedMentions: { repliedUser: false }
            })
        }
    
    }

    log(`${message.author.tag} : ${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : '"' + message.content + '"'} on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

});

client.on("ready", async () => {
    log(chalk.green(`Logged in as ${client.user.tag}!`));

    setInterval(async () => {
        await client.user.setActivity("Quoi ?");
        await client.user.setStatus('online');
    }, 1000);
});

client.login(token);