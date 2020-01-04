const ACTIONS = [{"DB_ACTION": "DB Action:", "BOT_ACTION": "Bot Action:"}];
var logger = {};

module.exports = logger;

/**
 * Sends an Info message to console.
 *
 * @param {string} message
 * @returns {null}
 */
logger.Info = function(message){
    let timeStamp = new Date();
    let consoleMessage = `[${timeStamp.toString("dddd, mmmm dS, yyyy, h:MM:ss TT BST-0600")}] INFO ${message}.`
    console.log(consoleMessage);
}

/**
 * Sends a debug message to console.
 *
 * @param {string} method
 * @returns {null}
 */
logger.Debug = function(method){
    let timeStamp = new Date();
    let consoleMessage = `[${timeStamp.toString("dddd, mmmm dS, yyyy, h:MM:ss TT BST-0600")}] DEBUG ${method}.`
    console.log(consoleMessage);
}

/**
 * Sends a trace message to console.
 *
 * @param {string} event
 * @returns {null}
 */
logger.Trace = function(event){
    let timeStamp = new Date();
    let consoleMessage = `[${timeStamp.toString("dddd, mmmm dS, yyyy, h:MM:ss TT BST-0600")}] TRACE ${event}.`
    console.log(consoleMessage);
}