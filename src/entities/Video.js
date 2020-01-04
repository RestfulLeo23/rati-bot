const Base = require('./Base');

/**
 * Video class with fields Id, Name, UpdatedBy, UpdatedOn, DiscordId, and GuildId
 *
 * @class Video
 * @extends {Base}
 */
class Video extends Base {

    constructor(video) {
        super(video ? video.UserId ? video.UserId : video.UpdatedBy : null);
        this.Id = video ? video.Id : null;
        this.Search = video ? video.Search : null;
        this.Stream = video ? video.Stream : null;
        this.GuildId = video ? video.GuildId : null;
        this.VoiceChannelId = video ? video.VoiceChannelId : null;
        this.Url = video ? video.Url : null;
    }
}

module.exports = Video;