const db = require("../Database");
const moment = require('moment-timezone');

const MUTED_ID = "537412526116306954";

let mutes = [], bans = [];

const muteUser = (memberToMute, muter, reason, expiration, loading = false) => {
    if (memberToMute && !memberToMute.roles.get(MUTED_ID) && !loading) {
        memberToMute.roles.add(MUTED_ID);
    }

    const expirationDateTime = Date.now() + expiration;

    mutes.push({
        memberId: memberToMute.id,
        muterId: muter.id,
        reason,
        expiration: expirationDateTime
    });

    if (!loading) {
        insertPunishmentToDB(memberToMute, muter, "mute", reason, expirationDateTime);
    }

    return true;
};

const banUser = (memberToBan, banner, reason, expiration, loading = false) => {
    const expirationDateTime = Date.now() + expiration;

    bans.push({
        memberId: memberToBan.id,
        bannerId: banner.id,
        reason,
        expiration: expirationDateTime
    });

    const expirationDateString = moment.tz(expirationDateTime, "EST").format("MMMM Do YYYY, h:mm:ss a");

    if (!loading) {
        memberToBan.send("You have been banned from the RIT discord for _" + reason.trim() + "_ by " + banner.nickname + " until " + expirationDateString).then(() => {
            memberToBan.ban({reason: reason});
            insertPunishmentToDB(memberToBan, banner, "ban", reason, expirationDateTime);
        }).catch((err) => {
            banner.send("An error occurred when trying to kick that user.");
            insertPunishmentToDB(memberToBan, banner, "ban", reason, expirationDateTime);
            memberToBan.ban({reason: reason});
        });
    }

    return true;
};

const unbanUser = (guild, memberToUnbanId, automatic = false) => {
    let userBanned = false;
    bans = bans.filter((ban) => {
        if (ban.memberId === memberToUnbanId) {
            userBanned = true;
            return false;
        }

        return true;
    });

    if (userBanned) {
        if (automatic) {
            guild.unban(memberToUnbanId);
        }
        cancelPunishmentInDB(memberToUnbanId, "ban");
        return true;
    } else {
        return false;
    }
};

const unmuteUser = (memberToUnmute) => {
    let userMuted = false;
    mutes = mutes.filter((mute) => {
        if (mute.memberId === memberToUnmute.id) {
            userMuted = true;
            return false;
        }

        return true;
    });

    if (userMuted) {
        memberToUnmute.roles.remove(MUTED_ID);
        cancelPunishmentInDB(memberToUnmute.id, "mute");
        return true;
    } else {
        return false;
    }
};

const kickUser = (memberToKick, kicker, reason) => {
    // Note: This messaging has to be handled here because it can't be sent after the user is kicked
    memberToKick.send("You have been kicked from the RIT discord for _" + reason.trim() + "_ by " + kicker.nickname).then(() => {
        insertPunishmentToDB(memberToKick, kicker, "kick", reason, 0, 0);
        memberToKick.kick(reason.trim());
    }).catch((err) => {
        kicker.send("An error occurred when trying to kick that user.");
        insertPunishmentToDB(memberToKick, kicker, "kick", reason, 0, 0);
        memberToKick.kick(reason.trim());
    });
};

const warnUser = (memberToWarn, warner, reason) => {
    memberToWarn.send("You have been warned by " + warner.nickname + " in the RIT discord for _" + reason.trim() + "_.").then(() => {
        insertPunishmentToDB(memberToWarn, warner, "warn", reason, 0, 0);
    }).catch((err) => {
        warner.send("An error occurred when trying to warn that user.");
        insertPunishmentToDB(memberToWarn, warner, "warn", reason, 0, 0);
    });
};

const isUserMuted = (member) => {
    return mutes.some((mute) => mute.memberId === member.id);
};

const reassignUserMutedRole = (member) => {
    member.addRole(MUTED_ID);
};

const insertPunishmentToDB = (target, punisher, type, reason, expiration, active = 1) => {
    db.database.serialize(() => {
        const stmt = db.database.prepare("INSERT INTO `punishments` (userId, userName, punisherId, punisherName, type, reason, expiration, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(
            target.id,
            target.toString(),
            punisher.id,
            punisher.toString(),
            type,
            reason,
            expiration,
            active
        );
    });
};

const cancelPunishmentInDB = (targetId, type) => {
    db.database.serialize(() => {
        const stmt = db.database.prepare("UPDATE `punishments` SET `active` = 0 WHERE `userId` = ? AND `type` = ?");
        stmt.run(
            targetId,
            type
        );
    });
};

const loadPunishmentsFromDB = () => {
    db.database.serialize(() => {
        db.database.get("SELECT * FROM `punishments` WHERE `active` = 1", [], (err, row) => {
            if (row) {
                switch (row.type) {
                    case "mute":
                        mutes.push({
                            memberId: row.userId,
                            muterId: row.punisherId,
                            reason: row.reason,
                            expiration: row.expiration
                        });
                        break;
                    case "ban":
                        bans.push({
                            memberId: row.userId,
                            bannerId: row.punisherId,
                            reason: row.reason,
                            expiration: row.expiration
                        });
                        break;
                    default:
                        break;
                }
            }
        });
    });
};

const tickPunishments = (client) => {
    mutes.filter((mute) => Date.now() > mute.expiration).forEach((filteredMute) => {
        client.guilds.get("401908664018927626").members.fetch(filteredMute.memberId).then((member) => {
            unmuteUser(member);
        }).catch((err) => {
            console.log(err);
            mutes = mutes.filter((mute) => filteredMute.memberId !== mute.memberId);
            cancelPunishmentInDB(filteredMute.memberId, "mute");
        });
    });

    bans.filter((ban) => Date.now() > ban.expiration).forEach((ban) => {
        unbanUser(client.guilds.get("401908664018927626"), ban.memberId);
    });
};

module.exports = {
    muteUser,
    unmuteUser,
    MUTED_ID,
    isUserMuted,
    reassignUserMutedRole,
    loadPunishmentsFromDB,
    tickPunishments,
    kickUser,
    banUser,
    unbanUser,
    warnUser
};