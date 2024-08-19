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

const { getPlaylistData } = require('./controller');
app.get('/playlist_data', getPlaylistData);

// app.get('/playlist_data', async (req, res) =>
// {
//     const user_id = req.query.user_id;
//     const token = req.session.spotifyAccessToken;

//     console.log('user_id:', user_id);

//     console.log('token:', token);

//     const url = 'https://api.spotify.com/v1/me/playlists';

//     if (!user_id || !token)
//     {
//         console.log("/playlist_data token or user_id missing");
//         return res.status(400).send({ user_id: null, message: "No user id or token" });
//     }

//     try
//     {
//         const response = await axios.get(url, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         console.log("response gotten");

//         return res.status(200).send({ user_id: user_id, data: response.data });
//     } catch (error)
//     {
//         console.error("Error fetching playlists:", error.message);
//         return res.status(400).send({ user_id: null, message: "No user id" })
//     }

// });

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

            console.log('response:', response.data);

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

    //     const token = req.session.spotifyAccessToken;

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




app.get('/recommend', async (req, res) =>
{
    const { seed_genres, tracks } = req.query
    const token = req.session.spotifyAccessToken;
    const url = 'https://api.spotify.com/v1/recommendations';

    const params = {
        'limit': 5
    }

    if (seed_genres)
    {
        params['seed_genres'] = seed_genres;
    }
    else
    {
        //set seed_genres to alternative by default:
        params['seed_genres'] = 'alternative';
    }

    if (tracks)
    {
        var seed_tracks = [];

        try
        {
            const trackQueries = tracks.split(',');
            for (const query of trackQueries)
            {
                seed_tracks.push(await makeCall(query, token));
            }
            seed_tracks.join(',');

            console.log("seed_tracks: ", seed_tracks);
        } catch (error)
        {
            console.log("Error Converting tracks to their ids", error);
            return res.status(503).json({ error: 'Error converting tracks to their associated ids.' });
        }
        params['seed_tracks'] = seed_tracks;
    }




    if (!seed_genres && !tracks)
    {
        console.log("No genres or tracks ")
        return res.status(400).json({ message: 'No seed genres or seed tracks provided' });
    }
    else
    {


        try
        {

            console.log("Getting recommendations from", url, "with params: ", params);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: params
                // {
                //     'seed_genres': seed_genres,
                //     'seed_tracks': seed_tracks,
                //     'limit': 5
                // }
            });

            console.log("Recommended Tracks: ", response.data.tracks);

            return res.status(200).send({ data: response.data });

        } catch (error)
        {
            console.error('Internal error getting recommendations', error);
            return res.status(400).send({ error: error });
        }
    }
});


const makeCall = async (item, token) =>
{
    // make a call to https://api.spotify.com/v1/search

    const url = 'https://api.spotify.com/v1/search';

    try
    {
        const response = await axios.get(url, {
            headers:
            {
                'Authorization': `Bearer ${token}`
            },
            params: {
                'q': item,
                'type': 'track'
            }

        });
        console.log("makeCall response: ", response.data);

        return response.data.tracks.items[0].id;

    } catch (error)
    {
        console.error("Internal error in makeCall", error);
        return null;
    }

}


app.get('/track', async (req, res) =>
{
    const token = req.session.spotifyAccessToken;
    const track = req.query.track;
    const url = 'https://api.spotify.com/v1/search';

    console.log('Track: ', track);

    if (!token)
    {
        return res.status(400).json({ error: 'No token provided' });
    } else
    {
        try
        {
            const response = await axios.get(url, {
                headers:
                {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    'q': track,
                    'type': 'track',
                    'limit': 1
                }

            });
            console.log("Hello I am a response code: ", response.status);

            return res.status(200).json({ data: response.data });

        } catch (error)
        {
            console.error("Internal error getting genres", error);
            return res.status(400).send({ error: error });
        }
    }


});

app.get('/genres', async (req, res) =>
{
    const token = req.session.spotifyAccessToken;
    const url = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
    console.log("getting /genres");
    if (!token)
    {
        return res.status(400).json({ error: 'No token provided' });

    } else
    {
        try
        {

            return res.status(200).json({ genres: genres });

        } catch (error)
        {
            console.error("Internal error getting genres", error);
            return res.status(400).send({ error: "Error /genres" });
        }
    }
});

app.use('/genres', limiter);


app.listen(3000, () =>
{
    console.log('Server is listening on port 3000');
});