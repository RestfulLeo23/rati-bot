const DJRat = require('../entities/DJRat');
const User = require('../entities/User');
const VoiceChannel = require('../entities/VoiceChannel');
const Guild = require('../entities/Guild');
const Video = require('../entities/Video');
const BaseService = require('./BaseService');
const logger = require('../log/logger');
const ytdl = require('ytdl-core');
const https = require('https');
const { yt_Token } = require('../config/localconfig');

/**
* DJRat personality. Can play audio from youtube videos.
*
* @class DJRatService
* @extends {BaseService}
*/
class DJRatService extends BaseService {

    constructor(_db, _client) {
        super(_db);
        this.db = _db
        this.client = _client;
        this.client.on('ready', () => {

        });
    }

    /**
     * DJRat song play. Plays a song given a url.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    play(message) {
        logger.Debug(`djRat play`);
        let messageContents = message.content.split(','); 
        messageContents = messageContents.map(x => x.trim());
        const url = messageContents[1]
        const voiceChannel = message.member.voiceChannel;
        const guild = message.member.guild;
        this.checkConnectionSettings(message);

        if(!url) {
            super.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
            .then(ratiVoiceChannelResults => {
                const ratiVoiceChannel = ratiVoiceChannelResults[0];
                this.getLastQueuedById(DJRat, [[ratiVoiceChannel.Id], ["NEW"]], ["VoiceChannelId", "Status"])
                .then(djRatResult => {
                    if(!djRatResult.Id) {
                        this.disconnectChannel(voiceChannel, ratiVoiceChannel);
                        return message.channel.send(`No songs queued. Please enter a url.`);
                    }
                    this.startSong(ratiVoiceChannel, message);
                });
            });
        }
        else {
            this.searchYouTube(url)
            .then(videoResults => {
                const youtubeSearchResults = JSON.parse(videoResults);
                return this.handleYouTubeResults(message, voiceChannel, guild, youtubeSearchResults, false)
            })
            .catch(error => {
                return this.handleYouTubeResults(message, voiceChannel, guild, error, true)
            });
        }
    }

    /**
     * Pauses current user's voice channel DjRat stream.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    pause(message) {
        logger.Debug(`djRat pause`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);
        this.pauseQueue(voiceChannel);
        return message.channel.send('Rati has been paused!');
    }

    /**
     * Resumes current user's voice channel DjRat stream.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    resume(message) {
        logger.Debug(`djRat resume`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);
        return this.resumeQueue(voiceChannel);
    }

    /**
     * Clears current user's voice channel queue.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    clear(message){
        logger.Debug(`djRat clear`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);
        this.clearQueue(voiceChannel);
        return message.channel.send('Queue has been cleared!');
    }

    /**
     * Stops current user's voice channel DjRat stream.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    stop(message) {
        logger.Debug(`djRat stop`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);
        this.stopSong(voiceChannel, true);
        return message.channel.send('Song has been stopped!');
    }

    /**
     * Skips current user's song in voice channel.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    skip(message) {
        logger.Debug(`djRat skip`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);
        this.skipSong(voiceChannel, message);
        return message.channel.send('Song has been skipped!');
    }

    /**
     * Shows current user's voice channel queue.
     *
     * @param {*} message
     * @returns {Promise}
     * @memberof DJRatService
     */
    showQueue(message) {
        logger.Debug(`djRat showQueue`);

        const voiceChannel = message.member.voiceChannel;
        this.checkConnectionSettings(message);

        super.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
            .then(ratiVoiceChannelResults => {
                const ratiVoiceChannel = ratiVoiceChannelResults[0];
                this.getById(DJRat, [[ratiVoiceChannel.Id], ["NEW"]], ["VoiceChannelId", "Status"])
                .then(djRatResults => {
                    if(djRatResults.length === 0) {
                        return message.channel.send(`No songs queued.`);
                    }

                    var currentPosition = 0;
                    const sortedDJRatResults = djRatResults.sort((a,b) => (a.QueueId < b.QueueId) ? 1 : -1);
                    var fields = [];
                    sortedDJRatResults.forEach(djRatResult => {
                        var newFormatedResults = {
                            name: djRatResult.Title,
                            value: `Position: ${currentPosition}, Url: ${djRatResult.Url}`,
                        }
                        currentPosition += 1;
                        fields.push(newFormatedResults);
                    })

                    const djratMessage = this.generateDJRatMessage(`Current Queue`, `Current queue for this discord.`, fields)
                    return message.channel.send(djratMessage);
                });
            });
    }

    /**
     * Starts current user's song.
     *
     * @param {*} voiceChannel
     * @param {*} message
     * @returns {null}
     * @memberof DJRatService
     */
    startSong(voiceChannel, message) {
        logger.Debug(`djRat startSong`);
        super.getLastQueuedById(DJRat, [[voiceChannel.Id], ["NEW"]], ["VoiceChannelId", "Status"])
        .then(djRatResult => {
            if(djRatResult){
                super.getById(VoiceChannel, [[djRatResult.VoiceChannelId]], ["Id"])
                .then(ratiVoiceChannelResults => {
                    if(ratiVoiceChannelResults.length > 0){
                        const ratiVoiceChannel = ratiVoiceChannelResults[0]
                        const voiceChannel = this.client.channels.get(ratiVoiceChannel.DiscordId);
                        const isPlaying = this.isPlaying(voiceChannel);
                        const isConnected = this.isConnected(voiceChannel);
                        if(!isPlaying){
                            voiceChannel.join()
                            .then(connection => {
                                this.startQueue(connection, voiceChannel, ratiVoiceChannel, djRatResult);
                                this.traceClientEvents(voiceChannel);
                            }); 
                        }
                        else if(isPlaying && !isConnected) {
                            this.fixConnection(voiceChannel);
                        }
                        else if(isPlaying && isConnected) {
                            message.channel.send(`Song has been queued.`);
                        }
                    }
                });
            }
        });   
    }

    /**
     * Pauses DjRat queue for given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Promise}
     * @memberof DJRatService
     */
    pauseQueue(voiceChannel) {
        logger.Debug(`djRat pauseQueue`);
        return this.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
        .then(RatiVoiceChannelResults => {
            voiceChannel.connection.dispatcher.pause();
            const ratiVoiceChannel = RatiVoiceChannelResults[0];
            this.updateVoiceChannel(ratiVoiceChannel, 'PAUSED');
            this.getLastQueuedById(DJRat, [[ratiVoiceChannel.Id], ["PLAYING"]], ["VoiceChannelId", "Status"])
            .then(djRatResult => {
                return this.updateDJRat(djRatResult, 'PAUSED');
            });
        });
    }

    /**
     * Stops current playing song in given voice channel.
     *
     * @param {*} voiceChannel
     * @param {boolean} isDisconnecting
     * @returns {Promise}
     * @memberof DJRatService
     */
    stopSong(voiceChannel, isDisconnecting = false) {
        logger.Debug(`djRat stopSong`);
        if(voiceChannel.connection && voiceChannel.connection.dispatcher) {
            voiceChannel.connection.dispatcher.end();
            if(isDisconnecting){
                return this.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
                .then(ratiVoiceChannelResults => {
                    const ratiVoiceChannel = ratiVoiceChannelResults[0];
                    this.disconnectChannel(voiceChannel, ratiVoiceChannel);
                });
            }
        }
        return Promise.resolve();
    }

    /**
     * Skips current playing song in given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Promise}
     * @memberof DJRatService
     */
    skipSong(voiceChannel, message) {
        logger.Debug(`djRat skipSong`);
        voiceChannel.connection.dispatcher.end();
        super.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
        .then(ratiVoiceChannelResults => {
            const ratiVoiceChannel = ratiVoiceChannelResults[0];
            this.getLastQueuedById(DJRat, [[ratiVoiceChannel.Id], ["NEW"]], ["VoiceChannelId", "Status"])
            .then(djRatResult => {
                if(!djRatResult.Id) {
                    this.disconnectChannel(voiceChannel, ratiVoiceChannel);
                    return message.channel.send(`No songs queued. Disconnecting...`);
                }
                this.startSong(ratiVoiceChannel, message);
            });
            
        })
    }

    /**
     * Resumes current queue in given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Promise}
     * @memberof DJRatService
     */
    resumeQueue(voiceChannel) {
        logger.Debug(`djRat resumeQueue`);
        return this.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"])
        .then(ratiVoiceChannelResults => {
            voiceChannel.connection.dispatcher.resume();
            const ratiVoiceChannel = ratiVoiceChannelResults[0];
            this.updateVoiceChannel(ratiVoiceChannel, 'PLAYING');
            this.getLastQueuedById(DJRat, [[ratiVoiceChannel.Id], ["PAUSED"]], ["VoiceChannelId", "Status"])
            .then(djRatResult => {
                return this.updateDJRat(djRatResult, 'PLAYING');
            });
        });
    }

    /**
     * Clears the current queue in given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Promise}
     * @memberof DJRatService
     */
    clearQueue(voiceChannel) {
        logger.Debug(`djRat clearQueue`);
        return Promise.all([
            this.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"]),
            this.getById(Guild, [[voiceChannel.guild.id]], ["DiscordId"])
        ])
        .then(results => {
            const ratiVoiceChannelResults = results[0];
            const ratiGuildResults = results[1];
            return this.updateFieldById(DJRat, [[ratiVoiceChannelResults[0].Id], [ratiGuildResults[0].Id]], ["VoiceChannelId", "GuildId"], "FINISHED", "Status")
        });
    }

    /**
     * Starts the current queue in given voice channel.
     *
     * @param {*} connection
     * @param {*} voiceChannel
     * @param {VoiceChannel} ratiVoiceChannel
     * @param {DJRat} djRat
     * @returns {null}
     * @memberof DJRatService
     */
    startQueue(connection, voiceChannel, ratiVoiceChannel, djRat){
        logger.Debug(`djRat startQueue`);
        this.updateVoiceChannel(ratiVoiceChannel, 'CONNECTED');
        const streamOptions = { seek: 0, volume: 1, };
        const stream = ytdl(
            djRat.Url, 
            {
                filter: 'audioonly', 
                quality: 'highestaudio', 
                bitrate: 192000, 
                highWaterMark: 1024 * 1024 * 10
            });
        const dispatcher = connection.playStream(stream, streamOptions);
        this.traceDispatcher(dispatcher, voiceChannel, ratiVoiceChannel, djRat);
    }

    /**
     * Handles current YouTube results from url lookup.
     *
     * @param {*} message
     * @param {*} voiceChannel
     * @param {*} guild
     * @param {*} youtubeSearchResults
     * @param {string} url
     * @param {boolean} isErrored
     * @returns {Promise}
     * @memberof DJRatService
     */
    handleYouTubeResults(message, voiceChannel, guild, youtubeSearchResults, isErrored) {
        logger.Debug(`djRat handleYouTubeResults`);
        return super.getById(User, [[message.member.id], [message.member.guild["id"]]], ["DiscordId", "GuildId"])
        .then(ratiUser => {
            if (!ratiUser) {
                return message.channel.send(`You aren't a user, please add yourself (AddMe).`);
            }
            return Promise.all([
                super.getById(VoiceChannel, [[voiceChannel.id]], ["DiscordId"]),
                super.getById(Guild, [[guild.id]], ["DiscordId"])
            ]).then(serviceResults => {
                const ratiVoiceChannelResults = serviceResults[0];
                const ratiGuildResults = serviceResults[1];
                if(isErrored){
                    const djRat = this.createDJRat(ratiUser, youtubeSearchResults, true, ratiVoiceChannelResults[0], ratiGuildResults[0]);
                    this.queue(djRat, ratiUser[0].Id);
                } else {
                    youtubeSearchResults.items.forEach(video => {
                        const djRat = this.createDJRat(ratiUser, video, false, ratiVoiceChannelResults[0], ratiGuildResults[0]);
                        this.queue(djRat, ratiUser[0].Id)
                        .then(() => {
                            this.startSong(ratiVoiceChannelResults[0], message);
                        });
                    });
                }
            });
        });
    }

    /**
     * Starts a trace of current voice channel client events.
     *
     * @param {*} voiceChannel
     * @returns {null}
     * @memberof DJRatService
     */
    traceClientEvents(voiceChannel){
        logger.Debug(`djRat traceClientEvents`);
        this.client.on('voiceStateUpdate', (oldMember, newMember) => {
            if(oldMember.voiceChannelID) {
                this.stopSong(voiceChannel, true);
            }
        });
    }

    /**
     * Starts an audio stream trace of current voice channel.
     *
     * @param {*} stream
     * @param {VoiceChannel} ratiVoiceChannel
     * @param {DJRat} djRat
     * @param {User} ratiUser
     * @param {Guild} ratiGuild
     * @param {string} searchQuery
     * @returns {null}
     * @memberof DJRatService
     */
    traceStream(stream, ratiVoiceChannel, djRat, ratiUser, ratiGuild, searchQuery){
        logger.Debug(`djRat traceStream`);
        let byteArray = [];
        let length = 0;
        stream.on('data', (chunk) => {
            console.log(`Received ${chunk.length} bytes of data.`);
            length += chunk.length;
            const bytes = Uint8Array.from(chunk);
            byteArray.push(bytes);
        });
        stream.on('end', () => {
            console.log(`Finsihed, total bit count: ${length}`);
            var mergedByteArray = Array.prototype.concat.apply([], byteArray);
            const video = this.createVideo(ratiUser, mergedByteArray, ratiVoiceChannel, ratiGuild, searchQuery, djRat.Url)
            this.add(video, ratiUser.Id);
        });
    }

    /**
     * Starts a dispatcher stream of current voice channel.
     *
     * @param {*} dispatcher
     * @param {*} voiceChannel
     * @param {VoiceChannel} ratiVoiceChannel
     * @param {DJRat} djRat
     * @returns {null}
     * @memberof DJRatService
     */
    traceDispatcher(dispatcher, voiceChannel, ratiVoiceChannel, djRat){
        logger.Debug(`djRat traceDispatcher`);
        dispatcher.on('start', start => {
            this.updateVoiceChannel(ratiVoiceChannel, 'PLAYING');
            this.updateDJRat(djRat, 'PLAYING');
        });
        dispatcher.on('end', end => {
            return Promise.all([
                this.updateVoiceChannel(ratiVoiceChannel, 'FINISHED'),
                this.updateDJRat(djRat, 'FINISHED'),
            ]);
        });
        dispatcher.on('error', error => {
            djRat.ErrorMessage = error;
            this.updateDJRat(djRat, 'ERROR');
            this.disconnectChannel(voiceChannel, ratiVoiceChannel);
        })
    }

    /**
     * Fixes the connection for a given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {null}
     * @memberof DJRatService
     */
    fixConnection(voiceChannel){
        logger.Debug(`djRat fixConnection`);
        voiceChannel.connection.dispatcher.end();
        voiceChannel.leave();
    }

    /**
     * Checks if the DjRat is currently connected to a given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Boolean}
     * @memberof DJRatService
     */
    isConnected(voiceChannel){
        logger.Debug(`djRat isConnected`);
        const botDiscordId = this.client.user.id;
        const isConnected = voiceChannel.members.get(botDiscordId);
        return isConnected ? true : false;
    }

    /**
     * Checks if the queue for a given voice channel is empty.
     *
     * @param {VoiceChannel} ratiVoiceChannel
     * @returns {Boolean}
     * @memberof DJRatService
     */
    isQueueEmpty(ratiVoiceChannel) {
        logger.Debug(`djRat isQueueEmpty`);
        return super.getLastQueuedById(DJRat, [[ratiVoiceChannel.Id], ["NEW"]], ["VoiceChannelId", "Status"])
        .then(djRat => {
            return djRat === null;
        });
    }

    /**
     * Checks if there is a DjRat currently playing in a given voice channel.
     *
     * @param {*} voiceChannel
     * @returns {Boolean}
     * @memberof DJRatService
     */
    isPlaying(voiceChannel){
        logger.Debug(`djRat isPlaying`);
        return voiceChannel.connection && voiceChannel.connection.dispatcher ? true : false;
    }

    /**
     * Disconnects DjRat from a given voice channel.
     *
     * @param {*} voiceChannel
     * @param {VoiceChannel} ratiVoiceChannel
     * @returns {null}
     * @memberof DJRatService
     */
    disconnectChannel(voiceChannel, ratiVoiceChannel) {
        logger.Debug(`djRat disconnectChannel`);
        this.updateVoiceChannel(ratiVoiceChannel, 'DISCONNECTED');
        voiceChannel.leave();
    }

    /**
     * Updates a DjRat with a new status.
     *
     * @param {DJRat} djRat
     * @param {string} status
     * @returns {Promise}
     * @memberof DJRatService
     */
    updateDJRat(djRat, status) {
        logger.Debug(`djRat updateDJRat`);
        djRat.Status = status;
        return super.updateById(djRat, DJRat, [[djRat.Id]], ["Id"], djRat.UpdatedBy);
    }

    /**
     * Updates a given voice channel with new state.
     *
     * @param {VoiceChannel} ratiVoiceChannel
     * @param {string} state
     * @returns {Promise}
     * @memberof DJRatService
     */
    updateVoiceChannel(ratiVoiceChannel, state) {
        logger.Debug(`djRat updateVoiceChannel`);
        ratiVoiceChannel.State = state;
        return super.updateById(ratiVoiceChannel, VoiceChannel, [[ratiVoiceChannel.Id]], ["Id"], ratiVoiceChannel.UpdatedBy);
    }


    /**
     * Checks current connections settings for permissions and voice channel;
     *
     * @param {*} message
     * @returns
     * @memberof DJRatService
     */
    checkConnectionSettings(message) {
        const voiceChannel = message.member.voiceChannel;

        if (!voiceChannel) {
            return message.channel.send('You need to be in a voice channel to play music!');
        }
	    const permissions = voiceChannel.permissionsFor(message.client.user);
	    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		    return message.channel.send('I need the permissions to join and speak in your voice channel!');
        }
    }

    /**
     * Generates an embeded message for a djRat channel message.
     *
     * @param {string} title
     * @param {string} description
     * @param {[{string, string}]} fields
     * @returns
     * @memberof DJRatService
     */
    generateDJRatMessage(title, description, fields) {
        return {embed: {
            color: 3447003,
            author: {
              name: this.client.user.username,
              icon_url: this.client.user.avatarURL
            },
            title,
            description,
            fields,
            timestamp: new Date(),
            footer: {
              icon_url: this.client.user.avatarURL,
              text: "Rati"
            }
          }
        }
    }

    /**
     * Creates a new DjRat.
     *
     * @param {*} user
     * @param {*} item
     * @param {boolean} [error=false]
     * @param {*} ratiVoiceChannel
     * @param {*} ratiGuild
     * @returns
     * @memberof DJRatService
     */
    createDJRat(user, item, error = false, ratiVoiceChannel, ratiGuild) {
        logger.Debug(`djRat createDJRat`);
        return new DJRat({
            'VoiceChannelId': ratiVoiceChannel.Id,
            'GuildId': ratiGuild.Id,
            'Status': error ? 'ERROR' : 'NEW',
            'Title': error ? null : item.snippet.title,
            'Url': error ? item.url : `https://www.youtube.com/watch?v=${item.id.videoId}`,
            'UserId': user[0].Id,
            'QueueId': null,
            'ErrorMessage': error ? item.message : null
        });
    }

    /**
     * Creates a new video.
     *
     * @param {User} ratiUser
     * @param {byteArray} stream
     * @param {VoiceChannel} ratiVoiceChannel
     * @param {Guild} ratiGuild
     * @param {string} searchQuery
     * @param {string} url
     * @returns {Video}
     * @memberof DJRatService
     */
    createVideo(ratiUser, stream, ratiVoiceChannel, ratiGuild, searchQuery, url) {
        logger.Debug(`djRat createVideo`);
        return new Video({
            'VoiceChannelId': ratiVoiceChannel.Id,
            'GuildId': ratiGuild.Id,
            'Search': searchQuery,
            'Stream': stream,
            'Url': url,
            'UserId': ratiUser.Id
        });
    }

    /**
     * Searches YouTube API given a set of search criteria.
     *
     * @param {string} searchCriteria
     * @returns {Promise}
     * @memberof DJRatService
     */
    searchYouTube(searchCriteria) {
        logger.Debug(`djRat searchYouTube`);
        const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
        const searchParam1 = `part=snippet`;
        const searchParam2 = `q=${searchCriteria}`;
        const searchParam3 = `key=${yt_Token}`;
        const searchParam4 = `order=relevance`;
        const searchParam5 = `maxResults=1`
        const searchParam6 = `type=video`;

        const url = `${baseUrl}?${searchParam1}&${searchParam2}&${searchParam3}&${searchParam4}&${searchParam5}&${searchParam6}`
        return this.makeRequest(url);
    }

    /**
     * Makes a request to an API given a url.
     *
     * @param {string} url
     * @returns {Promise}
     * @memberof DJRatService
     */
    makeRequest (url) {
        logger.Debug(`djRat makeRequest`);
        return new Promise((resolve, reject) => {
            // select http or https module, depending on reqested url
            const request = https.get(url, (response) => {
              // handle http errors
              if (response.statusCode < 200 || response.statusCode > 299) {
                var error = new Error('Failed to load page, status code: ' + response.statusCode);
                error.url = url;
                 reject(error);
               }
              // temporary data holder
              const body = [];
              // on every content chunk, push it to the data array
              response.on('data', (chunk) => body.push(chunk));
              // we are done, resolve promise with those joined chunks
              response.on('end', () => resolve(body.join('')));
            });
            // handle connection errors of the request
            request.on('error', (err) => reject(err))
        });
    }

    /**
     * Maps user input to birthdayrat commands.
     *
     * @readonly
     * @memberof BirthdayRatService
     */
    get commands() {
        return {
            [`play`]: (message) => this.play(message), 
            [`pause`]: (message) => this.pause(message, message.member),
            [`skip`] : (message) => this.skip(message, message.member),
            [`resume`] : (message) => this.resume(message, message.member),
            [`clear`] : (message) => this.clear(message),
            [`stop`] : (message) => this.stop(message),
            [`showqueue`] : (message) => this.showQueue(message),
        }
    }
}

module.exports = DJRatService;
