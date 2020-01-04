const Base = require('./Base');

/**
 * Holiday class with fields: Id, Description, HolidayDate, UpdatedBy, and UpdatedOn.
 *
 * @class Holiday
 * @extends {Base}
 */
class Holiday extends Base {

    constructor(holiday) {
        super(holiday ? holiday.UserId : null)
        this.Id = holiday ? holiday.Id : null;
        this.HolidayDate = holiday ? holiday.HolidayDate : null;
        this.Description = holiday ? holiday.Description : null;
        this.Name = holiday ? holiday.Name : null;
    }
}

module.exports = Holiday;