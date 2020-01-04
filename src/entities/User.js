const Base = require('./Base');

/**
 * User class with DiscordId, GuildId, Id, Name, NickName, Name, UpdatedBy, and UpdatedOn.
 *
 * @class User
 * @extends {Base}
 */
class User extends Base {

    constructor(user) {
        super(user ? user.Id : null)
        this.DiscordId = user ? user.DiscordId : null;
        this.GuildId = user ? user.GuildId : null;
        this.Id = user ? user.Id : null;
        this.Name = user ? user.Name : null;
        this.NickName = user ? (user.NickName ? user.NickName : user.UserName) : null;
        this.UserName = user ? user.UserName : null;    
    }
}

module.exports = User;