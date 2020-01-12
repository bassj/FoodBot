const Melo = require("./Melo");
const Food = require("./Food");
const FoodSpecials = require("./FoodSpecials");
const Mod = require("./Mod");
const EmojiRole = require("./EmojiRole");
const Courses = require("./Courses");
const Bus = require("./Bus");
const PREFIX = "-";

class CommandRegistry {
    constructor(init = true) {
        this._registry = [];
        if (init) {
            this._registry.push(new Melo());
            this._registry.push(new Food());
            this._registry.push(new FoodSpecials());
            this._registry.push(new Mod());
            this._registry.push(new EmojiRole());
            this._registry.push(new Courses());
            this._registry.push(new Bus());
        }
    }

    runCommands(client, messageEvent) {
        this._registry.forEach((command) => {
            if(messageEvent.content.toLowerCase().startsWith(`${PREFIX}${command.getCommand()}`)) {
                if(
                    (command.getRequiredPermission()
                        && (messageEvent.member && messageEvent.member.permissions.has(command.getRequiredPermission()))
                    ) || !command.getRequiredPermission()
                ) {
                    const args = messageEvent.content.split(" ").slice(1);
                    command.useCommand(client, messageEvent, args);
                }
            }
        });
    }
}

module.exports = CommandRegistry;