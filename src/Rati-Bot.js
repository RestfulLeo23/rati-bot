// New Years 01/01
// Martin Luther King 01/21
// Groundhog Day 02/02
// Super Bowl 02/03
// Chinese New Year 02/05
// Valentines Day 02/14
// President's Day 02/18
// Texas Indepence Day 03/02
// St. Patrick's Day 03/17
// Tax Day 04/15
// Easter 04/21
// Cinco De Mayo 05/05
// Mother's Day 05/12
// Memorial Day 05/27
// Father's Day 06/16
// Labor Day 09/02
// Halloween 10/31
// Veteran's Day 11/11
// ThanksGiving 11/28
// Christmas 12/25
//testing
// TODO: add system usage statistics
// Rabid Autonomous Technical Interface (Rati)

const Discord = require('discord.js');
const { token } = require('./config/localconfig');
const logger = require('./log/logger');
const db = require('./db/connection');
const Personalities = require('./services/ServiceRegistry');

var client = new Discord.Client();
const personalities = new Personalities(client, db);
const DM_CHANNEL_TYPE = "dm";

checkAlive();

/**
 * Method to check if the bot is connected to Discord API.
 * @returns {null}
 */
function checkAlive(){
  logger.Debug(`rati checkAlive`);

  if(client.guilds.size === 0) {
    try{
      logger.Info(`Couldn't connect, trying to login.`)
      client.login(token);
    }
    catch(loginException){
      logger.Info(`Couldn't login, ${loginException}`);
    }
  }
  
  setTimeout(checkAlive, 60*1000);
}

client.on('ready', () => {
  logger.Info("rati connected to Discord");
});

client.on('message', message => {
  logger.Trace(`rati received message`);
  
  if (message.channel.type !== DM_CHANNEL_TYPE) {
    readGuildChannelMessage(message);
  }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  logger.Trace(`rati recieved voiceStateUpdate`);
  
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel

  if(oldUserChannel === undefined && newUserChannel !== undefined && newUserChannel.name === 'Rat den') {
    logger.Info(`User: ${newMember.user["username"]} connected to ${newUserChannel.name}`);
  }
})

/**
 * Reads the guild channel a message was posted in and attempts to interpret the message.
 *
 * @param {*} message
 * @returns {Promise}
 */
function readGuildChannelMessage(message) {
  logger.Debug(`rati readGuildChannelMessage`);
  logger.Info(`Message Recieved from: ${message.member.user.username}, message: ${message.content}`);
  
  const mentionedUser = message.mentions.members.values().next().value;
  const botId = client.user.id;
  
  if(!message.author.bot && mentionedUser && mentionedUser.id === botId) {
    let messageContents = message.content.split('>').join(',').split(':').join(',').split('=').join(',').split(','); 
    messageContents = messageContents.map(x => x.trim());
    const command = messageContents[1].replace(/\s/g, '').toLowerCase();
    if(command === 'help') {
      postHelpMessage(message);
    } else {
      personalities.serviceRegistry.forEach(x => {
        try{
          return x.commands[`${command}`](message);
        }
        catch(error){
        }
      });
    }
  }
}

/**
 * Sends available commands with help message for all services Rati has available.
 *
 * @param {*} message
 */
function postHelpMessage(message) {
  logger.Debug(`rati postHelpMessage`);
  
  let commandCollection = [];
  
  personalities.serviceRegistry.forEach(x => {
    if (x.commands != null) {
      commandNames = Object.getOwnPropertyNames(x.commands);
      commandCollection = commandCollection.concat(commandNames);
    }
  });
  message.channel.send(`Here are all available commands for Rati: \n${commandCollection.join('\n')}\nPlease reference Rati (@Rati) followed by a seperator (, : =) and then the value.`);
}