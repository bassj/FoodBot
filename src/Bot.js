"use strict";

const Discord = require("discord.js");
const CommandRegistryImpl = require("./commands/CommandRegistry");
const CommandRegistry = new CommandRegistryImpl();
const FoodProcessor = require("./processors/FoodProcessor");
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

/*process.on("exit", database.close);
process.on("SIGINT", database.close);
process.on("SIGUSR1", database.close);
process.on("SIGUSR2", database.close);*/
Env.readInEnv();
database.createTables();

client.login(Env.getEnvVariable("discord_token")).then(() => {});

client.on("ready", () => {
    FoodProcessor.checkFoodDaily(client);
    setInterval(() => FoodProcessor.checkFoodDaily(client), 60*1000);
});
