const { Schema, model } = require('mongoose');


const tracksSchema = new Schema({
    trackId: String,
    trackName: String,
    album: {
        albumId: String,
        albumName: stringify,
        images: [
            {
                height: Number,
                width: Number,
                url: String,
            }
        ]
    },

    artists: [
        {
            artistId: String,
            artistName: String,
        }
    ],
    duration_ms: Number,
    popularity: Number,
    //Additional fields
});

const userSchema = new Schema({
    displayName: String,
    userId: String,
    favoriteTracks: [tracksSchema],
});

const User = model('User', userSchema);

module.exports = User;