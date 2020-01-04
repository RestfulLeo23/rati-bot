/**
 * Base class with fields UpdatedOn and UpdatedBy.
 *
 * @class Base
 */
class Base {

    constructor(_id) {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth()+1;
        this.UpdatedOn = `${date.getFullYear()}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
        this.UpdatedBy = _id ? _id : null;
    }
}

module.exports = Base;