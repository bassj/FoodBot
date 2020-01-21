const Food = require("./Food");
const FoodSpecials = require("./FoodSpecials");
const PREFIX = "-";

class CommandRegistry {
    constructor(init = true) {
        this._registry = [];
        if (init) {
            this._registry.push(new Food());
            this._registry.push(new FoodSpecials());
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