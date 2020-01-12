const Command = require("./Command");
const FoodProcessor = require("../processors/FoodProcessor");
const Discord = require("discord.js");

const PROHIBITED_CHANNELS = ["401908664018927628"];

class FoodSpecials extends Command {
    useCommand(client, evt, args) {
        FoodProcessor.getSpecials().then((places) => {
            if (!PROHIBITED_CHANNELS.includes(evt.channel.id)) {
                places.forEach((place) => {
                    if (place.breakfast || place.lunch || place.dinner) {
                        evt.channel.send(this.getEmbed(place));
                    }
                });
            } else {
                evt.channel.sendMessage("The use of this command is prohibited in this channel.");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    getCommand() {
        return "rit specials";
    }

    getEmbed(place) {
        let embed = new Discord.MessageEmbed().setTitle(place.name);
        embed = this.addSections(place, embed);
        return embed;
    }

    addSections(place, embed) {
        if (place.breakfast) {
            embed = embed.addField("Breakfast", this.constructDescriptionForCategory(place.breakfast));
        }

        if (place.lunch) {
            embed = embed.addField("Lunch", this.constructDescriptionForCategory(place.lunch));
        }

        if (place.dinner) {
            embed = embed.addField("Dinner", this.constructDescriptionForCategory(place.dinner));
        }

        return embed;
    }

    constructFieldDescriptionForPlace(place) {
        let description = "";
        if (place.breakfast) {
            description += `**Breakfast**\n`;
            description += this.constructDescriptionForCategory(place.breakfast) + "\n";
        }

        if (place.lunch) {
            description += `**Lunch**\n`;
            description += this.constructDescriptionForCategory(place.lunch) + "\n";
        }

        if (place.dinner) {
            description += `**Dinner**\n`;
            description += this.constructDescriptionForCategory(place.dinner) + "\n";
        }

        return description;
    }
    
    constructDescriptionForCategory(category) {
        var description = "";
        category.forEach((categoryItem) => {
            description += `__${categoryItem.category}__\n`;
            categoryItem.items.forEach((item, index) => {
                if (index !== 0) {
                    description += ",";
                }

                description += `_${item.replace("&amp;", "&")}_`;
            });
            description += "\n\n";
        });

        return description;
    }
}

module.exports = FoodSpecials;