const User = require('../entities/User');
const Guild = require('../entities/Guild');
const BaseService = require('./BaseService');
const logger = require('../log/logger');

var BIRTHDAY_RAT_NICKNAME = 'Birthday Rat';

/**
* User Personality. Can add a user, update a user, and set the nickname of a discord user.
*
* @class UserService
* @extends {BaseService}
*/
class UserService extends BaseService {
    
    constructor(db, _client) {
        super(db);
        this.client = _client;
        
        this.client.on('guildMemberUpdate', (oldMember, newMember) => {
            logger.Trace(`user received guildMemeberUpdate`);
            logger.Info(`guildMemberUpdate: ${newMember.user["username"]}`);
            this.updateUser(newMember, newMember);
        });
        this.client.on('guildMemberRemove', (guildMember) => {
            logger.Trace(`user received guildMemberRemove`);
            logger.Info(`guildMemberRemove: ${guildMember.user["username"]}`);
            this.removeUser(guildMember);
        });
    }
    
    /**
    * Set the nickname given to a user in the guild ignoring birthday nicknames.
    *
    * @param {String} userDiscordId
    * @param {String} nickname
    * @param {String} guildId
    * @returns {Promise}
    * @memberof UserService
    */
    setNickName(userDiscordId, nickname, guildId) {
        logger.Debug(`user setNickName`);
        const guild = this.client.guilds.get(guildId);
        return super.getById(User, [[userDiscordId], [guildId]], ["DiscordId","GuildId"])
        .then(users => {
            const userNickname = nickname != null ? nickname : users[0].NickName;
            logger.Info(`Setting nickname for ${users.map(x => x.UserName)} to ${userNickname}`);
            let userIds = users.map(user => user.DiscordId);
            let guildMembers = guild.members.filter(x => userIds.find(y => y === x.id));
            guildMembers.forEach(guildMember => {
                guildMember.id === guild.owner.id ?  guildMember.send(`Hey, change your name to ${userNickname}`) :  guildMember.setNickname(userNickname);
            });
            return users;
        })
    }
    
    /**
    * Update a user.
    *
    * @param {*} guildUser
    * @param {*} updatedByDiscordUser
    * @returns {Promise}
    * @memberof UserService
    */
    updateUser(guildUser, updatedByDiscordUser){
        logger.Debug(`user updateUser`);
        const user = new User();
        const updatedByDiscordUserId = updatedByDiscordUser.user["id"];
        const updatedByDiscordUserGuildId = updatedByDiscordUser.guild["id"];
        user.DiscordId = guildUser.user["id"];
        user.GuildId = guildUser.guild["id"];
        user.NickName = guildUser.nickname && !guildUser.nickname.includes(BIRTHDAY_RAT_NICKNAME) ? guildUser.nickname : null;
        user.UserName = guildUser.user["username"];
        return super.getById(User, [[updatedByDiscordUserId], [updatedByDiscordUserGuildId]], ["DiscordId","GuildId"])
        .then(discordUser => {
            return super.updateById(user, User, [[user.DiscordId], [user.GuildId]], ["DiscordId","GuildId"], discordUser[0].Id);
        });
    }
    
    /**
    * Add a user.
    *
    * @param {*} guildUser
    * @returns {Promise}
    * @memberof UserService
    */
    addUser(guildUser) {
        logger.Debug(`user addUser`);
        const user = new User();
        user.DiscordId = guildUser.user["id"];
        user.GuildId = guildUser.guild["id"];
        user.NickName = guildUser.nickname ? guildUser.nickname : guildUser.user["username"];
        user.UserName = guildUser.user["username"];
        return super.getById(User, [[user.DiscordId], [user.GuildId]], ["DiscordId","GuildId"])
        .then(disordUser => {
            if(disordUser.length != 0){
                logger.Info(`Didn't add ${guildUser.user["username"]}`)
                return null;
            }
            logger.Info(`Added ${guildUser.user["username"]}`)
            return super.add(user, null);
        })
    }

    /**
    * Removes a User from Raty
    *
    * @param {*} guildUser
    * @returns {Promise}
    * @memberof UserService
    */
    removeUser(guildUser) { 
        logger.Debug(`user removeUser`);
        const user = new User();
        user.DiscordId = guildUser.user["id"];
        user.GuildId = guildUser.guild["id"];
        user.NickName = guildUser.nickname ? guildUser.nickname : guildUser.user["username"];
        user.UserName = guildUser.user["username"];
        return super.getById(User, [[user.DiscordId], [user.GuildId]], ["DiscordId","GuildId"])
        .then(disordUser => {
            if(disordUser.length === 0){
                logger.Info(`Didn't remove ${guildUser.user["username"]}`)
                return null;
            }
            logger.Info(`Removed ${guildUser.user["username"]} from guild ${guildUser.guild.name}`)
            return super.delete(disordUser[0].Id, User)
        })
    }

    addGuildOwner(guildUser) {
        logger.Debug(`user addGuildOwner`);
        const user = new User();
        user.DiscordId = guildUser.user["id"];
        user.GuildId = guildUser.guild["id"];
        user.NickName = guildUser.nickname ? guildUser.nickname : guildUser.user["username"];
        user.UserName = guildUser.user["username"];
        const guild = new Guild({
            Name = guildUser.guild.Name,
        });

        return super.getById(User, [[user.DiscordId], [user.GuildId]], ["DiscordId","GuildId"])
        .then(disordUser => {
            if(disordUser.length != 0){
                return super.add(user, null)
                .then(userResult => {
                    guild.OwnerId = userResult.Id;
                    return super.updateById(guild, Guild, [[guildUser.guild.Id]], ["DiscordId"], userResult.Id);
                })
            }
            logger.Info(`Added user ${guildUser.user["username"]} as owner to guild ${guild.Name}`);
            guild.OwnerId = disordUser.Id;
            return super.updateById(guild, Guild, [[guildUser.guild.Id]], ["DiscordId"], discordUser.Id);
        })
    }

    /**
     * Maps user input to user commands.
     *
     * @readonly
     * @memberof UserService
     */
    get commands() {
        return {
            [`resetnickname`]: (message) => { this.setNickName(message.author.id, null, message.guild.id)
                .then(user => {
                    message.channel.send(`Ok, nickname has been set back to ${user[0].NickName}`)
                });
            }, 
            [`addme`] : (message) => { this.addUser(message.member)
                .then(result => {
                    result ? message.channel.send(`You've been added!`) : message.channel.send(`You've already been added.`)
                });
            },
            [`removeme`] : (message) => { this.removeUser(message.member)
                .then(result => {
                    result ? message.channel.send(`You've been removed!`) : message.channel.send(`You're currently not a user.`)
                });
            },
        }
    }
}

module.exports = UserService;