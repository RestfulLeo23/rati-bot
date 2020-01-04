const { dbcn } = require('../config/localconfig');
const logger = require('../log/logger');
const pgp = require('pg-promise')({
    capSQL: true
});

const dbClient = pgp(dbcn);
var db = {};
module.exports = db;

/** 
* Get All records from a table defined by the entity given.
* @param {*} entity 
* @returns {Promise}
*/
db.getAll = function(entity){
    logger.Debug(`database getAll`);
    const table = new entity();
    const sqlStatement = `SELECT * FROM public."${table.constructor.name}"`;
    return dbClient.any(sqlStatement);
}

/** 
* Get All records from a table defined by the entity and a given field.
* 
* @param {*} entity 
* @param {[[string]]} ids
* @param {[string]} idFields
* @returns {Promise}
*/
db.getById = function(entity, ids, idFields) {
    logger.Debug(`database getById`);
    const table = new entity();
    const idQueriesStatement = getIdQueriesStatement(ids, idFields);
    const sqlStatement = `SELECT * FROM public."${table.constructor.name}" WHERE ${idQueriesStatement}`
    return dbClient.any(sqlStatement);
}

/** 
* Get all records from two tables defined by the entities given. Using the foreign key of the first table,
* combine the tables on the primary key relationship of the second table to the first.
* @param {*} entities 
* @param {string} foreignId
* @param {string} primaryId
* @returns {Promise}
*/
db.joinAll = function(entities, foreignId, primaryId){
    logger.Debug(`database joinAll`);
    const firstTable = new entities[0]();
    const secondTable = new entities[1]();
    const entityFields = Object.getOwnPropertyNames(firstTable).concat(Object.getOwnPropertyNames(secondTable));
    const filteredEntityFields = entityFields
    .filter((item,pos) => entityFields.indexOf(item) == pos)
    .filter(x => x != "Id" && x != "UpdatedBy" && x != "UpdatedOn")
    .map(x => `"${x}"`)
    .join(', ');
    
    const sqlStatement = `SELECT ${filteredEntityFields} 
    FROM public."${firstTable.constructor.name}" ${firstTable.constructor.name.charAt(0).toLowerCase()}, public."${secondTable.constructor.name}" ${secondTable.constructor.name.charAt(0).toLowerCase()} 
    WHERE ${firstTable.constructor.name.charAt(0).toLowerCase()}."${foreignId}" = ${secondTable.constructor.name.charAt(0).toLowerCase()}."${primaryId}"`
    
    return dbClient.any(sqlStatement);
}

/**
 * Gets last queued Id for given table by ids.
 *
 * @param {*} entity
 * @param {[[string]]} ids
 * @param {[string]} idFields
 * @returns {Promise}
 */
db.getLastQueuedById = function(entity, ids, idFields){
    logger.Debug(`database getLastQueuedById`);
    const table = new entity();
    const idQueriesStatement = getIdQueriesStatement(ids, idFields);
    const sqlStatement = `SELECT * FROM public."${table.constructor.name}" WHERE ${idQueriesStatement} order by "QueueId" desc limit 1`
    return dbClient.any(sqlStatement);
}

/** 
* Get all records from two tables defined by the entities given and by a given field. Using the foreign key of the first table,
* combine the tables on the primary key relationship of the second table to the first and query the specific records by the given
* entity field of one of the two tables.
* @param {*} entities 
* @param {string} foreignId
* @param {string} primaryId
* @param {string} Id
* @param {string} idField
* @returns {Promise}
*/
db.joinAllById = function(entities, foreignId, primaryId, id, idField){
    logger.Debug(`database joinAllById`);
    const firstTable = new entities[0]();
    const secondTable = new entities[1]();
    const entityFields = Object.getOwnPropertyNames(firstTable).concat(Object.getOwnPropertyNames(secondTable));
    const filteredEntityFields = entityFields
    .filter((item,pos) => entityFields.indexOf(item) == pos)
    .filter(x => x != "Id" && x != "UpdatedBy" && x != "UpdatedOn")
    .map(x => `"${x}"`)
    .join(', ');

    
    const sqlStatement = `SELECT ${filteredEntityFields} 
    FROM public."${firstTable.constructor.name}" ${firstTable.constructor.name.charAt(0).toLowerCase()}, public."${secondTable.constructor.name}" ${secondTable.constructor.name.charAt(0).toLowerCase()} 
    WHERE ${firstTable.constructor.name.charAt(0).toLowerCase()}."${foreignId}" = ${secondTable.constructor.name.charAt(0).toLowerCase()}."${primaryId}" 
    AND "${idField}" = '${id}'`;
    
    return dbClient.any(sqlStatement);
    
}

/** 
* Update an entity given the new entity, the entity type,
* and the ids and fields for the entity.
* @param {*} entity 
* @param {*} table
* @param {[[string]]} ids
* @param {[string]} idFields
* @param {string} updatedByUserId
* @returns {Promise}
*/
db.updateById = function(entity, table, ids, idFields, updatedByUserId) {
    logger.Debug(`database updateById`);
    return this.getById(table, ids, idFields)
    .then(result => {
        const updatedResult = new table(result[0]);
        Object.keys(updatedResult).forEach(key => entity[key] != null ? updatedResult[key] = entity[key] : updatedResult[key] = updatedResult[key]);
        const idQueriesStatement = getIdQueriesStatement(ids, idFields);
        const entityUpdateStatement = getEntityStatement(updatedResult);
        updatedResult.UpdateById = updatedByUserId;

        
        const sqlStatement = `UPDATE public."${entity.constructor.name}"
        SET ${entityUpdateStatement}
        WHERE ${idQueriesStatement}`;
        
        return dbClient.any(sqlStatement);
    });
}

/**
 * Updates all entities' field by given ids.
 *
 * @param {*} entity
 * @param {[[string]]} ids
 * @param {[string]} idFields
 * @param {string} columnValue
 * @param {string} column
 * @returns {Promise}
 */
db.updateFieldById = function(entity, ids, idFields, columnValue, column) {
    logger.Debug(`database UpdateFieldById`);
    const table = new entity();
    const idQueriesStatement = getIdQueriesStatement(ids, idFields);

    const sqlStatement = `UPDATE public."${table.constructor.name}" 
    SET "${column}"='${columnValue}'
    WHERE ${idQueriesStatement}`
    return dbClient.any(sqlStatement);
}

/** 
* Add an entity given the new entity.
* @param {*} entity
* @param {string} updatedByUserId
* @returns {Promise}
*/
db.add = function(entity, updatedByUserId) {
    logger.Debug(`database add`);
    const entityFields = Object.getOwnPropertyNames(entity);   
    const entityValues = [];
    
    entity.Id = uuidv4();
    entity.UpdatedBy = updatedByUserId != null ? updatedByUserId : entity.Id;
    entityFields.forEach(x => {
        entityValues.push(entity[x]);
    })

    const entityFieldStatement = entityFields.map(x => `"${x}"`).join(', ');
    const entityValueStatement = entityValues.map(x => `'${x}'`).join(', ');
    const sqlStatement = `INSERT INTO public."${entity.constructor.name}"(
    ${entityFieldStatement})
    VALUES (${entityValueStatement})`;
    return dbClient.any(sqlStatement);
}

/** 
* Queue an entity given the new entity.
* @param {*} entity
* @param {string} updatedByUserId
* @returns {Promise}
*/
db.queue = function(entity, updatedByUserId) {
    logger.Debug(`database queue`);
    const entityFields = Object.getOwnPropertyNames(entity);   
    const entityValues = [];
    
    entity.Id = uuidv4();
    entity.UpdatedBy = updatedByUserId != null ? updatedByUserId : entity.Id;
    entityFields.forEach(x => {
        entityValues.push(entity[x]);
    })

    const entityFieldStatement = entityFields.map(x => `"${x}"`).join(', ');
    const entityValueStatement = entityValues.map(x => `'${x}'`).join(', ');
    const sqlStatement = `INSERT INTO public."${entity.constructor.name}"(
    ${entityFieldStatement})
    VALUES (${entityValueStatement})`;
    return dbClient.any(sqlStatement);
}

/** 
* Remove an entity given an id and the entity type .
* @param {string} id
* @param {*} entity
* @returns {Promise}
*/
db.delete = function(id, entity) {
    logger.Debug(`database delete`);
    const table = new entity();
    const sqlStatement = `DELETE FROM public."${table.constructor.name}"
    WHERE "Id" = '${id}'`;
    return dbClient.any(sqlStatement);
}

/** 
* Given an entity, build the sql statemtent for the entity fields to values.
* @param {*} entity 
* @returns {String}
*/
getEntityStatement = function(entity) {
    logger.Debug(`database getEntityStatement`);
    const entityFields = Object.getOwnPropertyNames(entity)
    entityUpdates = [];
    entityFields.forEach(entityField=> {
        entityUpdates.push(`"${entityField}"='${entity[entityField]}'`)
    })
    const entityUpdateStatement = entityUpdates.join();
    return entityUpdateStatement;
}

/** 
* Given ids and idFields build the sql statement for the id to idFields.
* @param {[[string]]} ids
* @param {[string]} idFields 
* @returns {String}
*/
getIdQueriesStatement = function(ids, idFields){
    logger.Debug(`database getIdQueriesStatement`);
    const idQueries = []; 
    ids.forEach((item, pos) => {
        ids[pos].forEach(x => {
            idQueries.push(`"${idFields[pos]}" = '${x}'`);
        });
    });
    const idQueriesStatement = idQueries.join(' AND ');
    return idQueriesStatement;
}

/** 
* Generates a random uuid.
* @returns {String}
*/
uuidv4 = function() {
    logger.Debug(`database uuidv4`);
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}