"use strict";

const Discord = require("discord.js");
const CommandRegistryImpl = require("./commands/CommandRegistry");
const CommandRegistry = new CommandRegistryImpl();
const ModProcessor = require("./processors/ModProcessor");
const EmojiRoleProcessor = require("./processors/EmojiRoleProcessor");
const BusProcessor = require("./processors/BusProcessor");
const Env = require("./utils/Env");
const client = new Discord.Client(
    {
        partials: ["MESSAGE", "CHANNEL", "REACTION"]
    }
);
const database = require("./Database");

const serverUrlRegexes = [/(discord\.gg\/.+)/i, /(https:\/\/discordapp\.com\/.+)/i];
const serversToBlock = ["632758585310314506"];

database.createTables();

client.on("message", message => {
    if (!message.partial) {
        let deleted = false;
        serverUrlRegexes.forEach(serverUrlRegex => {
            const matches = message.content.match(serverUrlRegex);
            matches && matches.forEach(match => {
                client.fetchInvite(match).then(invite => {
                    if (serversToBlock.includes(invite.guild.id) && !deleted) {
                        message.delete(1000).then(() => {
                            console.log("Deleted link to " + invite.guild.name);
                        });
                        deleted = true;
                    }
                }).catch(error => {
                    console.log("Error resolving invite: " + match);
                });
            });
        });

        CommandRegistry.runCommands(client, message);
    }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (oldMember.roles.get(ModProcessor.MUTED_ID) && !newMember.roles.get(ModProcessor.MUTED_ID)) {
        ModProcessor.unmuteUser(newMember);
    }
});

client.on("guildMemberAdd", (member) => {
    if (ModProcessor.isUserMuted(member)) {
        ModProcessor.reassignUserMutedRole(member)
    }
});

client.on("guildBanRemove", (guild, member) => {
    ModProcessor.unbanUser(guild, member.id);
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();
    if (/*reaction.message.author.id !== user.id*/!user.bot && true) {
        const emoji = reaction.emoji;
        const channel = reaction.message.channel;
        reaction.message.channel.guild.members.fetch(user).then((member) => {
            EmojiRoleProcessor.checkReactionToDB(emoji, member, channel, reaction);
        });
    }
});

/*process.on("exit", database.close);
process.on("SIGINT", database.close);
process.on("SIGUSR1", database.close);
process.on("SIGUSR2", database.close);*/
Env.readInEnv();
database.createTables();
ModProcessor.loadPunishmentsFromDB();
setInterval(() => ModProcessor.tickPunishments(client), 1000);

client.login(Env.getEnvVariable("discord_token")).then(() => {
});

BusProcessor.refreshInformation();

setInterval(() => BusProcessor.refreshInformation(), 1000*60*30); // 30 minutes
