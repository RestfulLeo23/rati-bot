const Base = require('./Base');

/**
 * BirthdayRat class with fields Id, Birthday, UserId, UpdatedBy, and UpdatedOn.
 *
 * @class BirthdayRat
 * @extends {Base}
 */
class BirthdayRat extends Base {

    constructor(birthdayRat) {
        super(birthdayRat ? birthdayRat.UserId : null)
        this.Id = birthdayRat ? birthdayRat.Id : null;
        this.Birthday = birthdayRat ? birthdayRat.Birthday : null;
        this.UserId = birthdayRat ? birthdayRat.UserId : null;
    }
}

module.exports = BirthdayRat;