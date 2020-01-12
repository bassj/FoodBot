const Command = require("./Command");

class Melo extends Command {
    useCommand(client, evt, args) {
        evt.react("🍈");
    }

    getCommand() {
        return "mod melo";
    }
}

module.exports = Melo;