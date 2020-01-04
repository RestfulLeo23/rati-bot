const Base = require('./Base');

/**
 * Guild class with fields Id, Name, UpdatedBy, UpdatedOn, and DiscordId.
 *
 * @class Guild
 * @extends {Base}
 */
class Guild extends Base {

    constructor(guild) {
        super(guild ? guild.UserId ? guild.UserId : guild.UpdatedBy : null);
        this.Id = guild ? guild.Id : null;
        this.Name = guild ? guild.Name : null;
        this.DiscordId = guild ? guild.DiscordId : null;
        this.OwnerId = guild ? guild.Ownerid: null;
    }
}

module.exports = Guild;