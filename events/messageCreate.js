const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { admin } = require('../settings.json');

// Create better console logs
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Initiate the database
if (!fs.existsSync('./database')) { fs.mkdirSync('./database'); };
const db = require('better-sqlite3');
const cnt = new db('./database/counter.sqlite');
const data = new db('./database/data.sqlite');
const trig = new db('./database/triggers.sqlite');

module.exports = async (client, message) => {

    if (message.author.bot) return;
    if (message.channel.type === 'DM') return;

    // Get the current count
    let count = cnt.prepare("SELECT * FROM counter WHERE id = ?;").get(message.author.id);
    if (!count) {
        count = {
            id: message.author.id,
            tag : message.author.tag,
            number: 0
        }
        cnt.prepare("INSERT INTO counter VALUES (@id, @tag, @number);").run(count);
    }

    let getTriggers = trig.prepare("SELECT trigger FROM triggers;").all();
    let getGifs = data.prepare("SELECT quoi FROM data;").all();

    let triggers = getTriggers.map(x => x.trigger);
    let gifs = getGifs.map(x => x.quoi);

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

        switch (args[0]) {
            case undefined:
            case null:
                message.reply({
                    content: `Tu as dis ${count.number} fois le mot "quoi" depuis que je suis là !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "reset":
                if (message.author.id !== admin) return;

                count.number = 0;
                cnt.prepare("UPDATE counter SET number = @number WHERE id = @id;").run(count);

                message.reply({
                    content: `Le compteur a été réinitialisé !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "help":
                message.reply({
                    content: `Voici les commandes disponibles : \n - <@${client.user.id}> : Affiche le nombre de fois que tu as le mot "quoi" ! \n - <@${client.user.id}> count : Affiche le compteur global !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "count":
                let countEveryQuoi = cnt.prepare("SELECT number FROM counter;").all();
                let getCountAll = 0;
                for (let i = 0; i < countEveryQuoi.length; i++) {
                    getCountAll += countEveryQuoi[i].number;
                }
                message.reply({
                    content: `Le mot "quoi" a été dis ${getCountAll} fois depuis que je suis là !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "top":
                let top = cnt.prepare("SELECT * FROM counter ORDER BY number DESC LIMIT 10;").all();

                let topEmbed = new EmbedBuilder()
                    .setTitle("Top 10 des personnes qui disent le plus le mot \"quoi\"")
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .addFields()
                    .setFooter({ text :`Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    .setTimestamp();

                let iterator = 1;
                for (const t of top) {
                    topEmbed.addFields({
                        name: `${iterator}. ${t.tag}`,
                        value: `Nombre de fois : ${t.number}`,
                    })
                    iterator++;
                }

                message.reply({
                    embeds: [topEmbed],
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "invite":
                message.reply({
                    content: `Voici le lien d'invitation du bot : \nhttps://discord.com/api/oauth2/authorize?client_id=1072888923438727240&permissions=76800&scope=bot`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "addquoi":
                if (message.author.id !== admin) return;

                if (args.length < 2) return;

                if (args[1].match(/https?:\/\/(www\.)?tenor\.com\/view\/.+/g) === null) return message.reply({
                    content: `Le lien n'est pas valide !`,
                    allowedMentions: { repliedUser: false }
                });

                data.prepare(`INSERT INTO data (quoi) VALUES ('${args[1]}');`).run();
                message.reply({
                    content: `Le gif "${args[1]}" a été ajouté !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "removequoi":
            case "delquoi":
                if (message.author.id !== admin) return;

                if (args.length < 2) return;

                if (args[1].match(/https?:\/\/(www\.)?tenor\.com\/view\/.+/g) === null || !args[1].match(/([0-9]*)/)) return message.reply({
                    content: `Le lien ou l'id n'est pas valide !`,
                    allowedMentions: { repliedUser: false }
                });

                data.prepare(`DELETE FROM data WHERE quoi = '${args[1]}' OR id = '${args[1]}';`).run();
                message.reply({
                    content: `Le gif "${args[1]}" a été supprimé !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "listquoi":
                let listQuoi = data.prepare("SELECT * FROM data;").all();

                let listEmbed = new EmbedBuilder()
                    .setTitle("Liste des gifs")
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .addFields()
                    .setFooter({ text :`Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    .setTimestamp();

                for (const quoi of listQuoi) {
                    listEmbed.addFields({
                        name: `ID : ${quoi.id}`,
                        value: quoi.quoi
                    })
                }

                message.reply({
                    embeds: [listEmbed],
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "addtrigger":
            case "addtrig":
                if (message.author.id !== admin) return;

                if (args.length < 2) return;

                trig.prepare(`INSERT INTO triggers (trigger) VALUES ('${args[1]}');`).run();

                message.reply({
                    content: `Le trigger "${args[1]}" a été ajouté !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "removetrigger":
            case "deltrigger":
            case "removetrig":
            case "deltrig":
                if (message.author.id !== admin) return;

                if (args.length < 2) return;

                trig.prepare(`DELETE FROM triggers WHERE trigger = '${args[1]}';`).run();

                message.reply({
                    content: `Le trigger "${args[1]}" a été supprimé !`,
                    allowedMentions: { repliedUser: false }
                })
                break;

            case "listtrigger":
            case "listtrig":
                let listTrig = trig.prepare("SELECT * FROM triggers;").all();

                let listTrigEmbed = new EmbedBuilder()
                    .setTitle("Liste des triggers")
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .addFields()
                    .setFooter({ text :`Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    .setTimestamp();

                for (const trig of listTrig) {
                    listTrigEmbed.addFields({
                        name: `ID : ${trig.id}`,
                        value: trig.trigger
                    })
                }

                message.reply({
                    embeds: [listTrigEmbed],
                    allowedMentions: { repliedUser: false }
                })
                break;

            default:
                message.reply({
                    content: `Tu as dis ${count.number} fois le mot "quoi" depuis que je suis là !`,
                    allowedMentions: { repliedUser: false }
                })
                break;
        }
    }

    log(`${message.author.tag} : ${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : '"' + message.content + '"'} on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

};