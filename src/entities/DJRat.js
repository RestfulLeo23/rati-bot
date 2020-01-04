const Base = require('./Base');

const PLAY = [
    'CLEAR',
    'SKIP',
    'PAUSE'
]
const PAUSE = [
    'RESUME',
    'CLEAR'
]
const RESUME = [
    'PLAY',
]
const DISCONNECTED = [
    'DISCONNECTED',
]
const SKIP = [
    'CLEAR',
    'PAUSE',
]
const CLEAR = [
    'START'
]

/**
 * DJRat class with fields Id, Link, UpdatedBy, and UpdatedOn.
 *
 * @class DJRat
 * @extends {Base}
 */
class DJRat extends Base { 

    constructor(djRat) {
        super(djRat ? djRat.UserId ? djRat.UserId : djRat.UpdatedBy : null);
        this.Id = djRat ? djRat.Id : null;
        this.VoiceChannelId = djRat ? djRat.VoiceChannelId : null;
        this.GuildId = djRat ? djRat.GuildId : null;
        this.QueueId = djRat ? djRat.QueueId : null;
        this.Status = djRat ? djRat.Status : null;
        this.Title = djRat ? djRat.Title : null;
        this.Url = djRat ? djRat.Url : null;
        this.ErrorMessage = djRat ? djRat.ErrorMessage : null;

        if (this.QueueId === null) {
            delete this.QueueId;
        }
        if (this.ErrorMessage === null) {
            delete this.ErrorMessage;
        }
    }
}

module.exports = DJRat;