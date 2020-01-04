const Base = require('./Base');

/**
 * VoiceChannel class with fields Id, Name, UpdatedBy, UpdatedOn, DiscordId, and GuildId
 *
 * @class VoiceChannel
 * @extends {Base}
 */
class VoiceChannel extends Base {

    constructor(voiceChannel) {
        super(voiceChannel ? voiceChannel.UserId ? voiceChannel.UserId : voiceChannel.UpdatedBy : null);
        this.Id = voiceChannel ? voiceChannel.Id : null;
        this.Name = voiceChannel ? voiceChannel.Name : null;
        this.DiscordId = voiceChannel ? voiceChannel.DiscordId : null;
        this.GuildId = voiceChannel ? voiceChannel.GuildId : null;
        this.State = voiceChannel ? voiceChannel.State : null;
    }
}

module.exports = VoiceChannel;