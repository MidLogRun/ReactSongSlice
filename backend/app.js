const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const qs = require('qs');
const axios = require('axios'); // To make HTTP requests from our server.
const port = 3000;
const queryString = require('querystring');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const SpotifyWebAPi = require('spotify-web-api-node');
const cors = require('cors');

require('dotenv').config();

const generateRandomString = (length) =>
{
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

var stateKey = 'spotify_auth_state';

const redirect_uri = process.env.REDIRECT_URI;

/******** Section 1.5 */
const client_id = process.env.CLIENT_ID; //client id
const client_secret = process.env.CLIENT_SECRET; //client secret

var spotifyApi = new SpotifyWebAPi();


// const dbConfig = {
//     host: 'db', // the database server
//     port: 5432, // the database port
//     database: process.env.POSTGRES_DB, // the database name
//     user: process.env.POSTGRES_USER, // the user account to connect with
//     password: process.env.POSTGRES_PASSWORD, // the password of the user account
// };

// const db = pgp(dbConfig);

// db.connect()
//     .then(obj =>
//     {
//         console.log('Database connection successful'); // you can view this message in the docker compose logs
//         obj.done(); // success, release the connection;
//     })
//     .catch(error =>
//     {
//         console.log('ERROR:', error.message || error);
//     });


app.use(express.json());

app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: ["POST", "GET"],
        credentials: true
    }
));

app.use(cookieParser());
app.use(bodyParser.urlencoded(
    {
        extended: true
    }));


//// INITIALIZE THE SESSION:
app.use(session({
    key: "userId",
    secret: process.env.SESSION_SECRET, // Use SESSION_SECRET for session secret
    resave: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Ensure cookie is sent only over HTTP(S), not accessible via JavaScript
        secure: true, // Set to true if using https
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));

app.get('/', (req, res) =>
{
    console.log("Default endpoint");
});


app.get('/login', function (req, res)
{

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
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
                            console.log("response.data: ", response.data); /////////TODO
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
        req.session.accessToken = accessToken;

        console.log('Successfully refreshed token');
        res.json({ accessToken });
    } catch (error)
    {
        console.error('Error refreshing token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

app.post('/playlist_data', async (req, res) =>
{
    const user_id = req.body.user_id;
    const token = req.body.token


    if (user_id && token)
    {
        console.log("received user_id", user_id);
        console.log("received token:", token);
        spotifyApi.setAccessToken(token);

        await spotifyApi.getUserPlaylists(user_id)
            .then((data) =>
            {
                console.log("Retrieved Playlists", data.body);
                res.status(200).send({ user_id: user_id, data: data.body });
            }).catch(error =>
            {
                console.log("error occurred retrieving playlists", error);
            })

    } else
    {
        console.log("No user id or no token");
        return res.status(200).send({ user_id: null, message: "No user id" })
    }

    // res.status(200).send({ user_id: user_id, data: data.body });
});

app.listen(3000, () =>
{
    console.log('Server is listening on port 3000');
});