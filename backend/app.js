const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const qs = require('qs');
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server.
const { localsName } = require('ejs');
const { application } = require('express');
const port = 3000;
const queryString = require('querystring');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const generateRandomString = (length) =>
{
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

var stateKey = 'spotify_auth_state';

const redirect_uri = 'http://localhost:3000/callback';

/******** Section 1.5 */
const client_id = process.env.CLIENT_ID; //client id
const client_secret = process.env.CLIENT_SECRET; //client secret

var spotifyApi = new SpotifyWebAPi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});

const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

db.connect()
    .then(obj =>
    {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error =>
    {
        console.log('ERROR:', error.message || error);
    });


app.use(cookieParser());

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get('/', (req, res) =>
{
    console.log("Default endpoint");
});


app.get('/login', function (req, res)
{

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email';
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
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState)
    {
        res.json({ status: 'failure', message: `state is: ${state} and storedState is ${storedState}` });
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

                    const options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        json: true
                    };

                    ///Access Spotify Web API:
                    axios.get(options.url, { headers: options.headers })
                        .then(response =>
                        {
                            console.log(response.data); /////////TODO
                        })
                        .catch(error =>
                        {
                            console.log('Error with api.spotify.com/v1/me ', error);
                        });

                    // res.redirect('/home' +
                    //   queryString.stringify({
                    //     access_token: access_token,
                    //     refresh_token: refresh_token
                    //   }));

                    res.json({ token: access_token });


                } else
                {
                    res.redirect('/welcome' +
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

app.listen(3000, () =>
{
    console.log('Server is listening on port 3000');
});