const Base = require('./Base');

/**
 * CuddleRat class with fields Id, Description, UpdatedBy, and UpdatedOn.
 *
 * @class CuddleRat
 * @extends {Base}
 */
class CuddleRat extends Base {

    constructor(cuddleRat) {
        super(cuddleRat ? cuddleRat.UserId : null)
        this.Id = cuddleRat ? cuddleRat.Id : null;
        this.Description = cuddleRat ? cuddleRat.Description : null;
    }
}

module.exports = CuddleRat;