const logger = require('../log/logger');

/**
* Base personality service.
*
* @class BaseService
*/
class BaseService {
    constructor(_db){
        this.db = _db;
    }
    
    /**
    * Returns all records for a given entity.
    *
    * @param {*} entity
    * @returns {Promise}
    * @memberof BaseService
    */
    getAll(entity) {
        logger.Debug(`base getAll`);
        const responses = [];
        return this.db.getAll(entity)
        .then(result => {
            result.forEach(x => {
                responses.push(new entity(x));
            })
            return responses;
        })
    }
    
    /**
    * Returns an entity by a given idField.
    *
    * @param {*} entity
    * @param {[[string]]} ids
    * @param {[string]} idFields
    * @returns {Promise}
    * @memberof BaseService
    */
    getById(entity, ids, idFields){
        logger.Debug(`base getById`);
        const responses = [];
        return this.db.getById(entity, ids, idFields)
        .then(result => {
            result.forEach(x => {
                responses.push(new entity(x))
            })
            return responses;
        })
    }
    
    /**
    * Returns combined entities by their foreign key to primary key relationship.
    *
    * @param {*} entities
    * @param {string} foreignId
    * @param {string} primaryId
    * @returns {Promise}
    * @memberof BaseService
    */
    joinAll(entities, foreignId, primaryId){
        logger.Debug(`base joinAll`);
        return this.db.joinAll(entities, foreignId, primaryId);
    }
    
    /**
    * Returns combined entities by their foreign key to primary key relationship and filters the result by 
    * a field of the entities.
    * EX: 
    * BirthdayRat.UserId Foriegn key of BirthdayRat
    * User.Id Primary key of User.
    * joinAllById will return the combined entities (non-duplicates) between BirthdayRat and User and join them on their
    * primary-foreign key relationship.
    *
    * @param {*} entities
    * @param {string} foreignId
    * @param {string} primaryId
    * @param {string} id
    * @param {string} idField
    * @returns {Promise}
    * @memberof BaseService
    */
    joinAllById(entities, foreignId, primaryId, id, idField){
        logger.Debug(`base joinAllById`);
        return this.db.joinAllById(entities, foreignId, primaryId, id, idField);
    }
    
    /**
    * Update an entity by an Id.
    *
    * @param {*} entity
    * @param {*} table
    * @param {[[string]]} ids
    * @param {[string]} idFields
    * @param {string} updatedByUserId
    * @returns {Promise}
    * @memberof BaseService
    */
    updateById(entity, table, ids, idFields, updatedByUserId){
        logger.Debug(`base updateById`);
        return this.db.updateById(entity, table, ids, idFields, updatedByUserId);
    }

    /**
     * Update an entity field by ids.
     *
     * @param {*} table
     * @param {[[string]]} ids
     * @param {[string]} idFields
     * @param {string} columnValue
     * @param {string} column
     * @returns {Promise}
     * @memberof BaseService
     */
    updateFieldById(table, ids, idFields, columnValue, column) {
        logger.Debug(`base updateFieldById`);
        return this.db.updateFieldById(table, ids, idFields, columnValue, column);
    }
    
    /**
     * Add an entity.
     *
     * @param {*} entity
     * @param {string} updatedByUserId
     * @returns {Promise}
     * @memberof BaseService
     */
    add(entity, updatedByUserId) {
        logger.Debug(`base add`);
        return this.db.add(entity, updatedByUserId);
    }

    /**
     * Queue an entity.
     *
     * @param {*} entity
     * @param {string} updatedByUserId
     * @returns {Promise}
     * @memberof BaseService
     */
    queue(entity, updatedByUserId) {
        logger.Debug(`base queue`);
        return this.db.queue(entity, updatedByUserId);
    }

    /**
     * Returns the last queued id by given ids.
     *
     * @param {*} entity
     * @param {[[string]]} ids
     * @param {[string]} idFields
     * @returns {Promise}
     * @memberof BaseService
     */
    getLastQueuedById(entity, ids, idFields) {
        logger.Debug(`base getLastQueuedById`);
        return this.db.getLastQueuedById(entity, ids, idFields)
        .then(result => {
            return new entity(result[0]);
        });
    }

    /**
     * Removes an entity by Id.
     *
     * @param {string} id
     * @param {*} entity
     * @returns {Promise}
     * @memberof BaseService
     */
    delete(id, entity) {
        logger.Debug(`base delete`);
        return this.db.delete(id, entity);
    }

    /**
     * Returns commands for class.
     *
     * @readonly
     * @memberof BaseService
     */
    get commands() {
    }
}

module.exports = BaseService;