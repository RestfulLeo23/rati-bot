const CuddleRat = require('../entities/CuddleRat');
const BaseService = require('./BaseService');
const logger = require('../log/logger');

/**
 * CuddleRat Personality. Can return a random cuddle response.
 *
 * @class CuddleRatService
 * @extends {BaseService}
 */
class CuddleRatService extends BaseService {
    
    constructor(db, _client) {

        super(db);
        this.client = _client;
    }
    
    /**
     * Sends cuddle message to user text channel.
     *
     * @param {*} message
     * @returns {null}
     * @memberof CuddleRatService
     */
    postCuddleMessage(message) {
        logger.Debug(`cuddleRat postCuddleMessage`);
        this.getResponse().then(response => message.channel.send(response));
    }

    /**
    * Get a Cuddle Rat response.
    *
    * @returns {Promise}
    * @memberof CuddleRatService
    */
    getResponse(){
        logger.Debug(`cuddleRat getResponse`);
        return super.getAll(CuddleRat)
        .then(responses => {
            const response = responses[this.getRandomInt(responses.length)].Description;
            response.replace("\*", "\\*")
            return response;
        })
    }
    
    /**
    * Get a random integer upto the max number given. 
    * EX: max = 10, will yield a random number from 0 - 10.
    *
    * @param {Number} max
    * @returns {Number}
    */
    getRandomInt(max) {
        logger.Debug(`cuddleRat getRandomInt`);
        return Math.floor(Math.random() * Math.floor(max));
    }

    /**
     * Maps user input to cuddlerat commands.
     *
     * @readonly
     * @memberof CuddleRatService
     */
    get commands() {
        return {
            [`owo`] : (message) => this.postCuddleMessage(message), 
            [`uwu`] : (message) => this.postCuddleMessage(message),
        }
    }
}

module.exports = CuddleRatService;