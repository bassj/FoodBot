const Command = require("./Command");
const Discord = require("discord.js");
const DateUtil = require("../utils/DateUtil");
const ModProcessor = require("../processors/ModProcessor");
const moment = require('moment-timezone');

class Mod extends Command {
    useCommand(client, evt, args) {
        if (args) {
            let cmdArgs;
            const channel = evt.channel;
            const sender = evt.member;
            switch(args[0].toLowerCase()) {
                case "mute":
                    cmdArgs = this.parseArgsTime(evt, args);
                    this.muteUser(channel, sender, cmdArgs);
                    break;
                case "unmute":
                    cmdArgs = this.parseArgsTime(evt, args);
                    this.unmuteUser(channel, sender, cmdArgs);
                    break;
                case "ban":
                    cmdArgs = this.parseArgsTime(evt, args);
                    this.banUser(channel, sender, cmdArgs);
                    break;
                case "warn":
                    cmdArgs = this.parseArgs(evt, args);
                    this.warnUser(channel, sender, cmdArgs);
                    break;
                case "kick":
                    cmdArgs = this.parseArgs(evt, args);
                    this.kickUser(channel, sender, cmdArgs);
                    break;
            }
        }
    }

    getCommand() {
        return "mod";
    }

    getRequiredPermission() {
        return Discord.Permissions.FLAGS.KICK_MEMBERS
    }

    parseArgsTime(evt, args) {
        let cmdArgs = {
            target: null,
            time: null,
            reason: null
        };

        if (args.length >= 2) {
            cmdArgs.target = evt.mentions.members.first();
        }

        if (args.length >= 3) {
            const remainder = args.slice(2).join(" ").split("|");
            cmdArgs.time = DateUtil.parseModDateString(remainder[0]);
            cmdArgs.reason = remainder.length > 1 && remainder[1].trim();
        }

        return cmdArgs;
    }

    parseArgs(evt, args) {
        let cmdArgs = {
            target: null,
            reason: null
        };

        if (args.length >= 2) {
            cmdArgs.target = evt.mentions.members.first();
        }

        if (args.length >= 3) {
            const remainder = args.slice(2).join(" ");
            cmdArgs.reason = remainder;
        }

        return cmdArgs;
    }

    muteUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            ModProcessor.muteUser(cmdArgs.target, sender, cmdArgs.reason, cmdArgs.time);

            const expirationDate = moment(Date.now() + cmdArgs.time);
            const expirationDateString = moment.tz(expirationDate, "EST").format("MMMM Do YYYY, h:mm:ss a");

            channel.send(`${cmdArgs.target} has been muted for ${cmdArgs.reason} until ${expirationDateString}`);
            cmdArgs.target.send("You have been muted for _" + cmdArgs.reason + "_ until " + expirationDateString + " EST by " + sender.nickname);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod mute [user ping] [time] | [reason]`);
        }
    }

    unmuteUser(channel, sender, cmdArgs) {
        if (cmdArgs.target) {
            ModProcessor.unmuteUser(cmdArgs.target);

            channel.send(`${cmdArgs.target} has been unmuted.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod unmute [user ping]`);
        }
    }

    kickUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.reason) {
            ModProcessor.kickUser(cmdArgs.target, sender, cmdArgs.reason);

            channel.send(`${cmdArgs.target} has been kicked.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod kick [user ping] [reason]`);
        }
    }

    banUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.time && cmdArgs.reason) {
            const expirationDate = moment(Date.now() + cmdArgs.time);
            const expirationDateString = moment.tz(expirationDate, "EST").format("MMMM Do YYYY, h:mm:ss a");

            ModProcessor.banUser(cmdArgs.target, sender, cmdArgs.reason, cmdArgs.time);
            channel.send(`${cmdArgs.target} has been banned for _${cmdArgs.reason}_ until ${expirationDateString}.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod ban [user ping] [time] | [reason]`);
        }
    }

    warnUser(channel, sender, cmdArgs) {
        if (cmdArgs.target && cmdArgs.reason) {
            ModProcessor.warnUser(cmdArgs.target, sender, cmdArgs.reason);
            channel.send(`${cmdArgs.target} has been warned for _${cmdArgs.reason}_.`);
        } else {
            channel.send(`${sender} - You need to use the command in the correct format: -mod warn [user ping] [reason]`);
        }
    }
}

module.exports = Mod;