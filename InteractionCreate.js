const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

exports.onLoad = function(client, interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName == 'ping') {
        interaction.reply('Pong!');
    }

    log(`${interaction.member?.user.tag ?? interaction.user.tag} : ${interaction} on [${interaction.guild === null ? "DM" : "#"+interaction.channel.name + " : " + interaction.guild.name}]`);
}