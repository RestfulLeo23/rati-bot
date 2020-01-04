const BirthdayRat = require('../entities/BirthdayRat');
const User = require('../entities/User');
const BaseService = require('./BaseService');
const UserService = require('./UserService');
const logger = require('../log/logger');

var BIRTHDAY_RAT_NICKNAME = 'Birthday Rat';
const BIRTHDAY_MESSAGE = "⁣🎉🕯🎉🕯🎉🕯🎉\n🎉🕯🎉🕯🎉🕯🎉\n🎉🕯🎉🕯🎉🕯🎉\n🎂🎂🎂⁣🎂🎂🎂🎂\n🎂🎂🎂🎂🎂🎂🎂\n🎂🎂🎂🎂🎂🎂🎂\n"+
"🎂🎂🎂🎂🎂🎂🎂"

/**
* BirthdayRat personality. Can check birthdays, notify of upcomming birthdays, and find the next
* birthday for the user's guild.
*
* @class BirthdayRatService
* @extends {BaseService}
*/
class BirthdayRatService extends BaseService {
    

    constructor(_db, _client) {
        super(_db);
        this.db = _db
        this.client = _client;
        this.client.on('ready', () => {
            this.checkBirthdays();
            this.notifyNextBirthdays();
        });
    }
    
    /**
    * Posts the next birthday message to the guild the user requested from.
    *
    * @param {*} message
    * @returns {null}
    * @memberof BirthdayRatService
    */
    postNextBirthdayMessage(message) {
        logger.Debug(`birthdayrat postNextBirthdayMessage`);
        const birthdayMessage = [];
        const birthdayMessageLog = [];
        this.getNextBirthday(message.guild.id)
        .then(birthdayRats => {
            birthdayRats.forEach(birthdayRat => {
                birthdayMessage.push(`${birthdayRat.Name != "null" ? birthdayRat.Name : birthdayRat.NickName} on ${birthdayRat.Birthday}`);
                birthdayMessageLog.push(`${birthdayRat.Name != "null" ? birthdayRat.Name : birthdayRat.NickName} on ${birthdayRat.Birthday} in ${this.client.guilds.get(birthdayRat.GuildId).name}`);
            });
            logger.Info(`Next birthday is ${birthdayMessageLog.join(' and, ')}`);
            message.channel.send(`Next birthday is ${birthdayMessage.join(' and, ')}`);
        });
    }
    
    /**
    * Check in the morning at 6am CDT if there are any birthday's for the day.
    *
    * @returns {null}
    * @memberof BirthdayRatService
    */
    checkBirthdays(){
        logger.Debug(`birthdayrat checkNextBirthdays`);
        let morningNow = new Date();
        let morningMillisTill = new Date(morningNow.getFullYear(), morningNow.getMonth(), morningNow.getDate(), 5, 0, 0, 0) - morningNow;
        if (morningMillisTill < 0) {
            morningMillisTill += 86400000;
        }
        
        var self = this;
        setTimeout(function() { self.setBirthdayRatNickName(); }, morningMillisTill);
    }
    
    /**
    * Send out notifications in the afternoon at 12pm CDT for birthdays.
    *
    * @returns {null}
    * @memberof BirthdayRatService
    */
    notifyNextBirthdays(){
        logger.Debug(`birthdayrat notifyNextBirthdays`);
        // Send Notifications for Birthdays @ 12pm.
        let afternoonNow = new Date();
        let afternoonMillisTill = new Date(afternoonNow.getFullYear(), afternoonNow.getMonth(), afternoonNow.getDate(), 17, 0, 0, 0) - afternoonNow;
        if (afternoonMillisTill < 0) {
            afternoonMillisTill += 86400000;
        }
        
        var self = this;
        setTimeout(function() { self.notifyBirthdays(); }, afternoonMillisTill);
    }
    
    /**
    * Notify everyone who is not a birthday rat in each guild.
    *
    * @returns {null}
    * @memberof BirthdayRatService
    */
    notifyBirthdays(){
        logger.Debug(`birthdayrat notifyBirthdays`);
        const guilds = [ ...this.client.guilds];
        guilds.forEach(guild => {
            logger.Info("Notifying non-birthdaybois.");
            super.joinAllById([BirthdayRat, User], "UserId", "Id", guild[0], "GuildId")
            .then(birthdayRatUsers => {
                this.notifyBirthdayWeek(birthdayRatUsers, guild);
                this.notifyBirthdayHalfWeek(birthdayRatUsers, guild);
                this.notifyBirthdayDay(birthdayRatUsers, guild);
            });
        });
        this.notifyNextBirthdays();
    }
    
    /**
    * Notifies everyone who does not have a birthday a week from today
    * that someone's birthday is coming up 1 week from now in their guild.
    *
    * @param {[BirthdayRat]} birthdayRatUsers
    * @param {string} guildId
    * @returns {null}
    * @memberof BirthdayRatService
    */
    notifyBirthdayWeek(birthdayRatUsers, guild){
        logger.Debug(`birthdayrat notifyBirthdayWeek`);
        var oneWeek = new Date();
        oneWeek.setDate(oneWeek.getDate() + 7);
        let monthDay = `${oneWeek.getMonth()+1}/${oneWeek.getDate()}`
        let weekOutBirthdays = birthdayRatUsers.filter(x => x.Birthday === monthDay)
        let nonBirthdays = birthdayRatUsers.filter(x => x.Birthday != monthDay);
        let nonBirthdayGuildMembers = guild[1].members.filter(x => nonBirthdays.find(y => y.DiscordId == x.user["id"]) && weekOutBirthdays.length)
        this.sendBirthdayNotificationMessage(weekOutBirthdays, nonBirthdays, nonBirthdayGuildMembers, "1 week from today", guild);
    }
    
    /**
    * Notifies everyone who does not have a birthday 3 days from today
    * that someone's birthday is coming up 3 days from now.
    *
    * @param {[BirthdayRat]} birthdayRatUsers
    * @param {string} guildId
    * @returns {null}
    * @memberof BirthdayRatService
    */
    notifyBirthdayHalfWeek(birthdayRatUsers, guild){
        logger.Debug(`birthdayrat notifyBirthdayHalfWeek`);
        var halfWeek = new Date();
        halfWeek.setDate(halfWeek.getDate() + 3);
        let monthDay = `${halfWeek.getMonth()+1}/${halfWeek.getDate()}`
        let halfWeekOutBirthdays = birthdayRatUsers.filter(x => x.Birthday === monthDay)
        let nonBirthdays = birthdayRatUsers.filter(x => x.Birthday != monthDay);
        let nonBirthdayGuildMembers = guild[1].members.filter(x => nonBirthdays.find(y => y.DiscordId == x.user["id"]) && halfWeekOutBirthdays.length)
        this.sendBirthdayNotificationMessage(halfWeekOutBirthdays, nonBirthdays, nonBirthdayGuildMembers, "3 days from today", guild);
    }
    
    /**
    * Notifies everyone who does not have a birthday today
    * that someone's birthday is today.
    *
    * @param {[BirthdayRat]} birthdayRatUsers
    * @param {string} guildId
    * @returns {null}
    * @memberof BirthdayRatService
    */
    notifyBirthdayDay(birthdayRatUsers, guild){
        logger.Debug(`birthdayrat notifyBirthdayDay`);
        var d = new Date();
        let currentDay = `${d.getMonth()+1}/${d.getDate()}`;
        let birthdays = birthdayRatUsers.filter(x => x.Birthday === currentDay)
        let nonBirthdays = birthdayRatUsers.filter(x => x.Birthday != currentDay);
        let nonBirthdayGuildMembers = guild[1].members.filter(x => nonBirthdays.find(y => y.DiscordId == x.user["id"]) && birthdays.length)
        this.sendBirthdayNotificationMessage(birthdays, nonBirthdays, nonBirthdayGuildMembers, "today", guild);
    }
    
    /**
    * Send the birthday discord reminder message.
    *
    * @param {[BirthdayRat]} birthdayRatUsers
    * @param {[BirthdayRat]} nonBirthdayRatUsers
    * @param {*} guildMembers
    * @param {Date} day
    * @param {*} guild
    * @returns {null}
    * @memberof BirthdayRatService
    */
    sendBirthdayNotificationMessage(birthdayRatUsers, nonBirthdayRatUsers, guildMembers, day, guild){
        logger.Info(`Notified: ${birthdayRatUsers.length ? nonBirthdayRatUsers.map(user => user.Name != "null" ? user.Name : user.UserName).join(', ') : 'no one'} that it's ${birthdayRatUsers.join(', ') ? birthdayRatUsers.map(user => user.Name != "null" ? user.Name : user.UserName).join() : "no one's"} birthday ${day} in ${guild[1].name}.`);
        guildMembers.forEach(users => {
            users.send(`Hey, it's ${birthdayRatUsers.map(user => user.Name != "null" ? user.Name : user.UserName).join(" and ")}'s birthday ${day} in ${guild[1].name}. Be sure to wish them a happy birthday!`)
        })
    }
    
    /**
    * Sets birthday rats for today.
    *
    * @returns {null}
    * @memberof BirthdayRatService
    */
    setBirthdayRatNickName(){
        logger.Debug(`birthdayrat setBirthdayRatNickName`);
        this.clearBirthdayRatNicknames();
        var d = new Date();
        let monthDay = `${d.getMonth()+1}/${d.getDate()}`;
        super.joinAllById([BirthdayRat, User], "UserId", "Id", monthDay, "Birthday")
        .then(birthdayRatUsers => {
            logger.Info(`Birthday rats: ${birthdayRatUsers.map(x => x.NickName).join(', ')}\n`);
            birthdayRatUsers.forEach(birthdayRatUser => {
                const userService = new UserService(this.db, this.client);
                const birthdayRatNickNames = `${BIRTHDAY_RAT_NICKNAME} (${birthdayRatUser.NickName})`;
                userService.setNickName(birthdayRatUser.DiscordId, birthdayRatNickNames, birthdayRatUser.GuildId);
            })  
            this.checkBirthdays();
        });
    }

    /**
     * Clears any users with birthday rat as their nickname.
     *
     * @returns {null}
     * @memberof BirthdayRatService
     */
    clearBirthdayRatNicknames(){
        logger.Debug(`birthdayrat clearBirthdayRatNicknames`);
        const guilds = [ ...this.client.guilds];
        guilds.forEach(guild => {
            const oldBirthdayRats = guild[1].members.filter(guildMember => guildMember.nickname && guildMember.nickname.includes(BIRTHDAY_RAT_NICKNAME));
            if (oldBirthdayRats) {
                const userService = new UserService(this.db, this.client);
                oldBirthdayRats.forEach(oldBirthdayRat => {
                    userService.setNickName(oldBirthdayRat.id, null, oldBirthdayRat.guild.id);
                });
            }
        });
    }
    
    /**
    * Returns the next birthday for the user's guild.
    *
    * @param {string} guildId
    * @returns {Promise}
    * @memberof BirthdayRatService
    */
    getNextBirthday(guildId){
        logger.Debug(`birthdayrat getNextBirthday`);
        
        return super.joinAllById([BirthdayRat, User], "UserId", "Id", guildId, "GuildId")
        .then(birthdayRatUsers => {
            const currentDay = new Date();
            let upcommingBirthdayRatUsers = [];
            let nextYearBirthdayRatUsers = [];
            let nextBirthdayRats = [];

            // Sort descending
            birthdayRatUsers.sort(function(a, b){
                const firstUserBirthday = a.Birthday.split("/");
                const firstBirthday = new Date(currentDay.getFullYear(), firstUserBirthday[0] - 1, firstUserBirthday[1]);
                const secondUserBirthday = b.Birthday.split("/");
                const secondBirthday = new Date(currentDay.getFullYear(), secondUserBirthday[0] - 1, secondUserBirthday[1]);
                return firstBirthday < secondBirthday;
            });

            // Sort into current year birthdays and next year birthdays
            birthdayRatUsers.forEach(birthdayRatUser => {
                let userBirthday = birthdayRatUser.Birthday.split("/");
                let currentMonth = currentDay.getMonth();
                let birthday = new Date(`${currentMonth > userBirthday[0] - 1 ? currentDay.getFullYear() + 1 : currentDay.getFullYear()}`, userBirthday[0] - 1, userBirthday[1]);
                let birthdayRatUserTimeToNextBirthday = birthday - currentDay;
                if(birthdayRatUserTimeToNextBirthday > 0 && birthday.getFullYear() === currentDay.getFullYear()) {upcommingBirthdayRatUsers.unshift(birthdayRatUser)}
                else { nextYearBirthdayRatUsers.unshift(birthdayRatUser)}
            })

            // Get Next birthday rats
            upcommingBirthdayRatUsers = upcommingBirthdayRatUsers.concat(nextYearBirthdayRatUsers);
            const nextBirthdayRat = upcommingBirthdayRatUsers[0];
            nextBirthdayRats = upcommingBirthdayRatUsers.filter(x => x.Birthday === nextBirthdayRat.Birthday);
            return nextBirthdayRats;
        });
    }

    /**
     * Adds a users birthday to birthday rat.
     *
     * @param {*} message
     * @param {*} guildUser
     * @returns {Promise}
     * @memberof BirthdayRatService
     */
    addBirthday(message, guildUser) {
        logger.Debug(`birthdayrat addBirthday`);
        let birthdayMessageContents = message.content.split('>').join(',').split(':').join(',').split('=').join(',').split(','); 
        birthdayMessageContents = birthdayMessageContents.map(x => x.trim());
        if(!birthdayMessageContents[2]) return message.channel.send(`Please enter a birthday`);

        const birthday = birthdayMessageContents[2];
        const discordId = guildUser.user["id"];
        const guildId = guildUser.guild["id"];        
        const isValidBirthday = this.isValidDate(birthday);
        if(isValidBirthday) return message.channel.send(isValidBirthday);

        return super.getById(User, [[discordId], [guildId]], ["DiscordId","GuildId"])
        .then(user => {
            if(user.length > 0){
                return super.getById(BirthdayRat, [[user[0].Id]], ["UserId"])
                .then(birthdayRat => {
                    if(birthdayRat.length > 0){
                        return message.channel.send(`You already have a birthday, please update your birthday (UpdateMyBirthday, updated birthday).`);
                    }
                    else {
                        const birthdayRat = new BirthdayRat({'Birthday': birthday, 'UserId': user[0].Id});
                        return super.add(birthdayRat, user[0].Id)
                        .then(result => {
                            return message.channel.send(`Your birthday has been added!`);
                        })
                    }
                })
            }
            else{
                return message.channel.send(`You aren't a user, please add yourself (AddMe).`)
            }
        })
    }

    /**
     * Updates a users birthday.
     *
     * @param {*} message
     * @param {*} guildUser
     * @returns {Promise}
     * @memberof BirthdayRatService
     */
    updateBirthday(message, guildUser) {
        logger.Debug(`birthdayrat updateBirthday`);
        let birthdayMessageContents = message.content.split('>').join(',').split(':').join(',').split('=').join(',').split(','); 
        birthdayMessageContents = birthdayMessageContents.map(x => x.trim());
        if(!birthdayMessageContents[2]) return message.channel.send(`Please enter a birthday`);

        const birthday = birthdayMessageContents[2];
        const discordId = guildUser.user["id"];
        const guildId = guildUser.guild["id"];
        const isValidBirthday = this.isValidDate(birthday);
        if(isValidBirthday) return message.channel.send(isValidBirthday);

        return super.getById(User, [[discordId], [guildId]], ["DiscordId","GuildId"])
        .then(user => {
            if(user.length > 0){
                return super.getById(BirthdayRat, [[user[0].Id]], ["UserId"])
                .then(birthdayRat => {
                    if(birthdayRat.length > 0){
                        const updatedBirthdayRat = new BirthdayRat({'Birthday': birthday, 'UserId': user[0].Id});
                        return super.updateById(updatedBirthdayRat, BirthdayRat, [[updatedBirthdayRat.UserId]], ["UserId"], user[0].Id)
                        .then(result => {
                            return message.channel.send(`Your birthday has been updated!`);
                        })
                    }
                    else {
                        return message.channel.send(`You don't have a birthday yet, please add your birthday (AddMyBirthday, new birthday).`);
                    }
                })
            }
            else{
                return message.channel.send(`You aren't a user, please add yourself (AddMe).`);
            }
        })
    }

    /**
     * Validates if a date is a valid month and date.
     *
     * @param {String} birthday
     * @returns {String}
     * @memberof BirthdayRatService
     */
    isValidDate(birthday) {
        logger.Debug(`birthdayrat isValidBirthday`);
        const currentDay = new Date();
        const longMonths = ['1','3','5','7','8','10','12'];
        const shortMonths = ['2'];
        const mediumMonths = ['4','6','9','11'];
        const birthdayElements = birthday.split('/');
        const birthdayMonth = birthdayElements[0];
        const birthdayDay = birthdayElements[1];
        const isLeapYear = currentDay.getFullYear % 4 === 0;

        if(isNaN(birthdayMonth) || isNaN(birthdayDay)) return `Not a valid birthday.`;

        if(birthdayMonth > 12 || birthdayMonth <= 0) return `Not a valid month.`;
        if(longMonths.includes(birthdayMonth) && (birthdayDay > 31 || birthday <= 0)) return `Not a valid day, please enter a day between 1 - 31.`;
        if(shortMonths.includes(birthdayMonth) && ((isLeapYear ? (birthdayDay > 29) : (birthdayDay > 28)) || birthday <= 0)) return `Not a valid day, please enter a day between ${isLeapYear ? '1 - 29' : '1 - 28'} .`;
        if(mediumMonths.includes(birthdayMonth) && (birthdayDay > 30 || birthday <= 0)) return `Not a valid day, please enter a day between 1 - 30.`;
        return null;
    }

    /**
     * Maps user input to birthdayrat commands.
     *
     * @readonly
     * @memberof BirthdayRatService
     */
    get commands() {
        return {
            [`nextbirthday`]: (message) => this.postNextBirthdayMessage(message), 
            [`addmybirthday`] : (message) => { this.addBirthday(message, message.member)
                .then(response => {
                    if(response === null) message.channel.send(`There was an error adding your birthday.`)
                });
            },
            [`updatemybirthday`] : (message) => { this.updateBirthday(message, message.member)
                .then(response => {
                    if(response === null) message.channel.send(`There was an error updating your birthday.`)
                })
            },
        }
    }
}

module.exports = BirthdayRatService;
