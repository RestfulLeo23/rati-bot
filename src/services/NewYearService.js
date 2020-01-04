const Holiday = require('../entities/Holiday');
const BaseService = require('./BaseService');
const logger = require('../log/logger');

/**
* NewYears Personality. Sets Raty to new years personality.
*
* @class NewYearService
* @extends {BaseService}
*/
class NewYearService extends BaseService {
    constructor(db, _client) {
        super(db);
        this.client = _client;
        this.client.on('ready', () => {
            logger.Trace(`newyear received ready`);
            this.checkNewYearsTime();
        });
    }
    
    /**
    * Check in the morning at 1am CDT if it is NewYears.
    *
    * @returns {null}
    * @memberof NewYearService
    */
    checkNewYearsTime(){
        logger.Debug(`newyear checkNewYearsTime`);
        let morningNow = new Date();
        let morningMillisTill = new Date(morningNow.getFullYear(), morningNow.getMonth(), morningNow.getDate(), 5, 0, 0, 0) - morningNow;
        if (morningMillisTill < 0) {
            morningMillisTill += 86400000;
        }
        
        var self = this;
        setTimeout(function() { self.checkNewYears(morningNow); }, morningMillisTill);
    }

    /**
     * Checks if the day is New Years
     *
     * @param {Date} morningNow
     * @returns {null}
     * @memberof NewYearService
     */
    checkNewYears(morningNow) {
        logger.Debug(`newyear checkNewYears`);
        super.getById(Holiday, [[morningNow]], ["HolidayDate"])
        .then(holiday => {
            this.client.user.setAvatar('./test.png')
            .then(user => console.log(`New avatar set!`))
            .catch(this.logger.WriteMessage(error));
        })
    }

    /**
     * Maps user input to newyear commands.
     *
     * @readonly
     * @memberof NewYearService
     */
    get commands() {
        return null;
    }
}

module.exports = NewYearService;
