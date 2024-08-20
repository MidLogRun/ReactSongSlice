const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const MemoryStore = require('memorystore')(session);
const qs = require('qs');
const axios = require('axios'); // To make HTTP requests from our server.
const port = 3000;
const queryString = require('querystring');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const SpotifyWebAPi = require('spotify-web-api-node');
const cors = require('cors');
const { access } = require('fs');
const mongoose = require('mongoose');
const genres = require('./genres');

require('dotenv').config();


const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

var stateKey = 'spotify_auth_state';

const redirect_uri = process.env.REDIRECT_URI;
const client_id = process.env.CLIENT_ID; //client id
const client_secret = process.env.CLIENT_SECRET; //client secret


app.use(express.json());

app.use(cors(
    {
        origin: "http://localhost:5173",//frontendURL
        credentials: true
    }
));

app.use(cookieParser());
app.use(bodyParser.urlencoded(
    {
        extended: true
    }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    } // Make sure secure is false for development
}));


const generateRandomString = (length) =>
{
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

const { getPlaylistData, getTrack, getRecommendation, getGenres, getPlaylistRecommendations } = require('./controller');


app.get('/', (req, res) =>
{
    console.log("Default endpoint");
});


app.get('/login', function (req, res)
{

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        queryString.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));

});

app.get('/callback', (req, res) =>
{
    var code = req.query.code || null;
    var state = req.query.state || null;
    // var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null)
    {
        res.redirect('/#' +
            queryString.stringify({
                error: 'state_mismatch'
            }));
    } else
    {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            data: queryString.stringify({
                code: code,
                redirect_uri: 'http://localhost:3000/callback',
                grant_type: 'authorization_code'
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
        };

        axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers })
            .then(response =>
            {
                if (response.status === 200)
                {
                    const access_token = response.data.access_token;
                    const refresh_token = response.data.refresh_token;

                    console.log('Session before setting token:', req.session);

                    req.session.spotifyAccessToken = access_token;
                    req.session.spotifyRefreshToken = refresh_token;

                    // After setting the session data
                    console.log('Session after setting token:', req.session);

                    req.session.save(err =>
                    {
                        if (err)
                        {
                            console.log("Failed to save session:", err);
                        } else
                        {
                            console.log("Session saved successfully.", req.session);

                        }
                    });



                    console.log("access_token: ", access_token);
                    console.log("refresh_token: ", refresh_token);

                    const options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        json: true
                    };

                    ///Access Spotify Web API:
                    axios.get(options.url, { headers: options.headers })
                        .then(response =>
                        {
                            // console.log("response.data.id : ", response.data.id); /////////TODO
                        })
                        .catch(error =>
                        {
                            console.log('Error with api.spotify.com/v1/me ', error);
                        });

                    res.redirect('http://localhost:5173/homepage#' +
                        queryString.stringify({
                            access_token: access_token,
                            refresh_token: refresh_token
                        }));
                } else
                {
                    res.redirect('http://localhost:5173/login' +
                        queryString.stringify({
                            error: 'invalid_token'
                        }));
                }
            })
            .catch(error =>
            {
                console.error('Error:', error);
                res.redirect('/#' +
                    queryString.stringify({
                        error: 'invalid_token'
                    }));
            });
    }
});
app.get('/refresh-token', async (req, res) =>
{
    const refreshToken = req.session.refreshToken; //refresh token stored on session
    if (!refreshToken)
    {
        return res.status(400).json({ error: "refresh token is missing." });

    }

    try
    {
        const { data } = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token: accessToken } = data;
        req.session.spotifyAccessToken = accessToken;

        console.log('Successfully refreshed token');
        res.json({ accessToken });
    } catch (error)
    {
        console.error('Error refreshing token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});


app.get('/playlist/:id', async (req, res) =>
{
    const playlist_id = req.params.id;


    const url = `https://api.spotify.com/v1/playlists/${playlist_id}`;

    const token = req.session.spotifyAccessToken;

    console.log("token:", token)

    if (!token)
    {
        console.log("where the fuck's your token, bud?");
    }
    else
    {
        try
        {
            // const data = await spotifyApi.getPlaylist(playlist_id);
            // console.log("data.body:", data.body);

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${req.session.spotifyAccessToken}`
                }
            });

            console.log("Response getting playlist successful!");
            return res.status(200).send({ playlist: response.data });
        } catch (error)
        {
            console.log(`error with pulling playlist with ${playlist_id}:`, error);
            return res.status(400).send({ error: error });
        }
    }


});

app.get('/library/toptracks', async (req, res) =>
{

    //Get User's Saved Tracks

    const token = req.session.spotifyAccessToken;

    console.log("token:", token);

    const url = 'https://api.spotify.com/v1/me/tracks'

    try
    {
        await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(response =>
        {
            console.log('response data:', response.data);
            return res.status(200).send({ topTracks: response.data });
        }).catch(error =>
        {
            console.error('SpotifyApi error fetching Tracks:', error);
            return res.status(400).send({ error: error });
        });

    } catch (error)
    {
        console.log('Internal error fetching top tracks', error);
        return res.status(400).send({ error: error });
    }

});



app.get('/playlist_data', getPlaylistData); //homepage
app.get('/recommend', getRecommendation); //recommendation page
app.get('/track', getTrack); //recommendation page
app.get('/genres', getGenres); //
app.get('/playlistRecommendations', getPlaylistRecommendations)


app.listen(3000, () =>
{
    console.log('Server is listening on port 3000');
});