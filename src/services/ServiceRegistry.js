const CuddleRatService = require('./CuddleRatService'); 
const BirthdayRatService = require('./BirthdayRatService');
const UserService = require('./UserService');
const NewYearService = require('./NewYearService');
const DJRatService = require('./DJRatService');
const GuildService = require('./GuildService');

/**
 * Register all the personalities for Raty.
 *
 * @class personalities
 */
class personalities {
    constructor(client, db) {
        this.serviceRegistry = [
            new CuddleRatService(db, client), 
            new BirthdayRatService(db, client), 
            new UserService(db, client), 
            new NewYearService(db, client),
            new DJRatService(db, client),
            new GuildService(db, client),
        ];
    }
}

module.exports = personalities;