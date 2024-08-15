// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************
// Example with Express.js
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


const SpotifyWebAPi = require('spotify-web-api-node'); //wrapper for spotify web api
const { access } = require('fs');

///Album ID holders (holds these ids from Spotify)
const AlbumIDs = {
  Album1: '30JZqToNZZH4mN7I0ymGvH', //Planet Pit
  Album2: '18NOKLkZETa4sWwLMIm0UZ', //Utopia
  Album3: '43otFXrY0bgaq5fB3GrZj6', //The Getaway
  Album4: '1bt6q2SruMsBtcerNVtpZB', //Rumours
  Album5: '0ETFjACtuP2ADo6LFhL6HN', //Abby Road
  Album6: '6dVIqQ8qmQ5GBnJ9shOYGE', //OK Computer
  Album7: '6yskFQZNlLYhkchAxELHi6', //Nebraska
  Album8: '2v6ANhWhZBUKkg6pJJBs3B', //What's Going On
  Album9: '1weenld61qoidwYuZ1GESA', //Kind Of Blue
  Album10: '6iHuSGy6pq4tNGFV3ZVPtl',//Substance
  Album11: '5mwOo1zikswhmfHvtqVSXg',//Pink Moon
  Album12: '1gIC63gC3B7o7FfpPACZQJ', //4
  Album13: '4xwx0x7k6c5VuThz5qVqmV', //The Velvet Underground & Nico
  Album14: '5lEphbceIgaK1XxWeSrC9E', //Heaven or Las Vegas
  Album15: '35UJLpClj5EDrhpNIi4DFg', //The Bends
  Album16: '3Us57CjssWnHjTUIXBuIeH', //Bad
  Album17: '4piJq7R3gjUOxnYs6lDCTg', //Hot Fuss
  Album18: '1jToVugwBEzcak8gJNZG2f', //GINGER
  Album19: '4ndTvTrNwgUfRw4g1R2B4l', //MUNA
  Album20: '4HTVABUq8amDUxBv3zJbX4', //Brown Sugar
  Album21: '4m2880jivSbbyEGAKfITCa', //Random Access Memories
  Album22: '4bJCKmpKgti10f3ltz6LLl', //22, A Million
  Album23: '2aoI8tkPq9NBvGiARD0KoR', //Multi-Love
  Album24: '20r762YmB5HeofjMCiPMLv', //My Beautiful Dark Twisted Fantasy
  Album25: '4X8hAqIWpQyQks2yRhyqs4', //Born To Die
  Album26: '7ycBtnsMtyVbbwTfJwRjSP', //To Pimp A Butterfly
  Album27: '3nyszXBcbHA92HAB5NPsRL', //Sittin' By the Road
  Album28: '1dShPPoxXfzbjFO1jIHJZz', //Blue Rev
  Album29: '3mH6qwIy9crq0I9YQbOuDf', //Blonde
  Album30: '4Coa8Eb9SzjrkwWEom963Q', //Puberty 2
  Album31: '2k8KgmDp9oHrmu0MIj4XDE', //Is This It
  Album32: '0rPtXOMN42nsLDiShvGamv', //Yankee Hotel Foxtrot
  Album33: '7D2NdGvBHIavgLhmcwhluK', //Yeezus
  Album34: '392p3shh2jkxUxY2VHvlH8', //Channel Orange
  Album35: '19bQiwEKhXUBJWY6oV3KZk', //Madvillainy
  Album36: '5XpEKORZ4y6OrCZSKsi46A', //Norman Fucking Rockwell!
  Album37: '64xtjfsPHNHch0CZ7fPTjS', //Carrie and Lowell
  Album38: '0rmhjUgoVa17LZuS8xWQ3v', //Pure Heroine
  Album39: '3DrgM5X3yX1JP1liNLAOHI', //The Suburbs
  Album40: '79dL7FLiJFOO0EoehUHQBv', //Currents
  Album41: '6Pp6qGEywDdofgFC1oFbSH', //Punisher
  Album42: '5rcJ5xCMYYLCgGilFDKRZl', //Stranger in the Alps
  Album43: '2tm3Ht61kqqRZtIYsBjxEj', //Pure Heroine
  Album44: '0E4xv5gPjykrwBgBZzI8XG', //Back to Black
  Album45: '5WupqgR68HfuHt3BMJtgun', //Goodbye Yellow Brick Road
  Album46: '5zi7WsKlIiUXv09tbGLKsE', //Igor
  Album47: '5SbcupirEParczvqqyUPXL', //The Moon & Antarctica
  Album48: '0Cuqhgy8vm96JEkBY3polk', //Titanic Rising
  Album49: '5iVEe1GHMtvUHwwqArThFa', //And Then Nothing turned Itself Inside-Out
  Album50: '0e9GjrztzBw8oMC6n2CDeI' //the record
};

/******** Section 1.5 */
//Mount Spotify API:
const client_id = process.env.CLIENT_ID; //client id
const client_secret = process.env.CLIENT_SECRET; //client secret
//const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64'); //Auth token to give to spotify

var spotifyApi = new SpotifyWebAPi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

//Retrieving access token:
/* The JSON body returned from Spotify looks like this:
    {
      "access_token": "NgCXRKc...MzYjw",
      "token_type": "bearer",
      "expires_in": 3600
    }
*/



function authenticateSpotifyApi()
{
  return spotifyApi
    .authorizationCodeGrant() // .clientCredentialsGrant() //we are using client credentials OAuth flow (no need to have redirect URI)
    .then(data =>
    {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
      spotifyApi.setAccessToken(data.body['access_token']);
    })
    .catch(error =>
    {
      console.error("Something went wrong when retrieving an access token", error);
      throw error;
    });
}


async function refreshToken()
{
  try
  {
    await authenticateSpotifyApi();
  } catch (error)
  {
    console.error("Error refreshing access token", error.message || error);
  }
}


async function startTimer()
{
  try
  {
    await authenticateSpotifyApi();

    // Set up a recurring timer for refreshing the token every 50 minutes
    setInterval(async () =>
    {
      await refreshToken();
    }, 60 * 60 * 1000); // 50 minutes in milliseconds
  } catch (error)
  {
    console.error("Error starting the timer: ", error.message || error);
  }
  // Set an initial timer for authentication

}

// Start the timer
// startTimer();


/**************** */
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
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

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use('/resources', express.static('./resources'))
  .use(cookieParser());

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

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

//Dummy Route:
app.get('/welcome', (req, res) =>
{
  res.json({ status: 'success', message: 'Welcome!' });
});

// Redirect root URL to /login
app.get('/', (req, res) =>
{
  res.redirect('/login2');
});


app.get('/login2', function (req, res)
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


// //***********************LOGIN */
// Login - GET route
app.get('/login', (req, res) =>
{
  console.log("Rendering login:");
  res.render('pages/login');
});

// login POST routine:
app.post('/login', async (req, res) =>
{

  const usrname = req.body.username;
  const password = req.body.password;

  const userQuery = 'SELECT * FROM users WHERE username = $1';
  console.log('Generated SQL Query:', userQuery, [usrname]);

  try
  {
    if (!usrname || !password)
    {
      return res.render('pages/login', { message: 'Username and password are both required for login' });
    }

    const user = await db.oneOrNone(userQuery, [usrname]);

    console.log('Attempting login for username:', usrname);


    if (!user)
    {
      //if username is not in DB:
      console.log("Username not found");
      return res.render('pages/login', { message: 'Username provided was not found. Please try again or register by clicking the link below!' });
    }

    const passValid = await bcrypt.compare(password, user.password);
    if (!passValid)
    {
      console.log("Password is invalid");
      return res.render('pages/login', { message: 'Password is invalid' });
    }

    console.log("User logged in successfully");

    req.session.user = user;
    // res.status(200);
    req.session.save();


    return res.redirect('/homepage');


  } catch (error)
  {
    console.error('Error during login', error.message);
    res.status(500).json({ message: 'Login failed (Entered catch block)' });
  }
});


// //***********************REGISTER */
// Register - GET route
app.get('/register', (req, res) =>
{
  res.render('pages/register');
});

// register POST routine:
app.post('/register', async (req, res) =>
{
  const userPassword = req.body.password;
  const username = req.body.username;

  if (!userPassword)
  {
    return res.render('pages/register', { message: 'You need to enter a password' }); //correct path is?
  }

  if (!username)
  {
    return res.render('pages/register', { message: 'You need to enter a username' }); //correct path is?
  }

  try
  {
    const saltRounds = 10;

    const hashWord = await bcrypt.hash(userPassword, saltRounds); // Hash the password
    const insertUser = 'INSERT INTO users (username, password) VALUES ($1, $2)'; // SQL Query to insert user

    //insert the user into database
    await db.none(insertUser, [
      username,
      hashWord
    ]);

    console.log("User registered successfully.");
    const userQuery = 'SELECT * FROM users WHERE username = $1';
    const user = await db.oneOrNone(userQuery, [username]); //query the database to see if the user is there
    //Save session info
    console.log("username is: " + user.username);
    req.session.user = user;
    req.session.save();

    return res.redirect('/homepage'); //redirect the user to the home page

  } catch (error)
  {
    console.error('Error saving user info: ', error);
    res.render('pages/register', { message: 'An error occurred while registering the user.' })
  }
});

// Authentication Middleware:
const auth = (req, res, next) =>
{
  if (!req.session.user)
  {
    // Default to login page if no user session:
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

// //***********************LOGOUT */

//Logout GET routine:
app.get('/logout', (req, res) =>
{

  if (req.session)
  {
    //delete session object if exists
    req.session.destroy();

    console.log("User has successfully logged out");
    return res.redirect('/login');
  }
  console.log("User not logged in");
});

/**
 * OAuth to Spotify
 * The following function verifies our client credentials and secret in order to create a
 * token for us to use in our Spotify endpoints
 *
 */

//Spotify Get Albums:
//https://api.spotify.com/v1/albums
//Function that returns 4 random ids from the bank of AlbumIDs above
function randomizeAlbums()
{
  const albumIDsArray = Object.values(AlbumIDs);
  const maxAlbums = 4;

  const cloneAlbumIDs = [...albumIDsArray];
  for (let i = cloneAlbumIDs.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [cloneAlbumIDs[i], cloneAlbumIDs[j]] = [cloneAlbumIDs[j], cloneAlbumIDs[i]]
  }
  // const selectedAlbumIDs = cloneAlbumIDs.slice(0, maxAlbums); //30
  //  return selectedAlbumIDs;
  return cloneAlbumIDs;
}


// //***********************HOME */
app.get('/home', (req, res) =>
{
  try
  {
    res.render('pages/home');
  } catch (error)
  {
    console.error('Error saving user info: ', error);
  }
});


//////////Homepage Route.
/**
 * When a user logs in, they should expect to see a welcome message and description as well as:
 *
 *  four randomly-selected albums within a carousel
 */
app.get('/homepage', async (req, res) =>
{
  var images = [], names = [], artists = [];
  const IDs = randomizeAlbums(); //Array of random IDs from bank above

  try
  {
    //Can't use a regular loop since spotifyApi.getAlbums returns a promise:
    await Promise.all(IDs.map(async (ID, index) =>
    {
      const data = await spotifyApi.getAlbum(ID);
      images[index] = data.body.images[0].url; // Grab the first image in the list (images[0])
      names[index] = data.body.name; // Name of the album
      artists[index] = data.body.artists[0].name; // Name of the primary album artist
    }));

    res.render('pages/homepage', { IDs, images, names, artists }); //render the homepage with these attributes
  } catch (error)
  {
    console.error("Error loading the homepage", error);
    res.status(500).send("Error loading the homepage");
  }
});


/////////////// RELEASE ROUTE
//5mwOo1zikswhmfHvtqVSXg for debug
async function rateAlbum(rating, album_id, username)
{
  const checkRating = `SELECT * FROM user_to_release WHERE username = $1 AND release_id = $2 `;
  const ratingExists = await db.oneOrNone(checkRating, [username, album_id]); //check if the rating exists

  if (!ratingExists)
  {
    const insertRating = `INSERT INTO user_to_release (username, release_id, rating)
      VALUES (
          (SELECT username from users WHERE username = $1),
          $2,
          $3
        )`;
    console.log("Rating " + album_id + " with: " + insertRating, [username, album_id, rating]);
    await db.none(insertRating, [username, album_id, rating]); //insert the rating into the DB

  }
  else
  {
    const updateRating = `UPDATE user_to_release
    SET rating = $1
    WHERE release_id = $2 AND username = $3`;

    console.log("Updating user " + username + "'s rating for " + album_id);
    await db.none(updateRating, [rating, album_id, username]);
  }
  //regardless of what the user is doing, update the rating:
  const updateAverage = `
      UPDATE release
      SET overallRating = (
        SELECT AVG(rating) FROM user_to_release WHERE release_id = $1
      )
      WHERE release_id = $1`; //updates the average rating in the release table
  console.log("Updating ", album_id, " within release table : ", updateAverage, album_id);
  await db.none(updateAverage, album_id);
}

async function getTotalRatings(album_id)
{
  const fetchRating = 'SELECT overallRating FROM release WHERE release_id = $1';
  const result = await db.oneOrNone(fetchRating, album_id);
  const avgRating = result.overallrating;

  //display the rating to console:
  console.dir({ result });
  console.log("overallRating = " + avgRating);
  return avgRating;

}

async function getUserRating(album_id, username)
{
  const checkRating = `SELECT * FROM user_to_release WHERE username = $1 AND release_id = $2 `;
  const ratingObj = await db.oneOrNone(checkRating, [username, album_id]); //check if the rating exists

  if (ratingObj)
  {
    return ratingObj.rating;
  }

}

async function getReviews(album_id)
{
  var reviews = [];
  const revQuery = `SELECT * FROM review WHERE release_id = $1`;
  reviews = await db.any(revQuery, album_id);
  return reviews;
}

app.get('/release/:id', async (req, res, next) =>
{
  const id = req.params.id;
  try
  {

    //Is the album currently in our database?:
    const testQuery = 'SELECT * FROM release WHERE release_id = $1';
    const release = await db.oneOrNone(testQuery, [String(id)]);

    //if not:
    if (!release)
    {
      console.log("Inserting album " + id + " into database");
      const insertRelease = 'INSERT INTO release (release_id) VALUES ($1)';
      await db.none(insertRelease, id);
    }
    const avgRating = await getTotalRatings(id); //fetch the overrall rating to display to the user:
    const userRating = await getUserRating(id, req.session.user.username);
    const reviews = await getReviews(id);
    console.log("reviews: ", reviews);

    const data = await spotifyApi.getAlbum(id); //pass data to render function
    res.render('pages/release', {
      albumBody: data.body,
      image: data.body.images[0].url,
      albumName: data.body.name,
      artist: data.body.artists[0].name,
      tracks: data.body.tracks,
      id,
      avgRating,
      userRating,
      reviews
    });
  } catch (error)
  {
    console.error("Error:", error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }
});

///////////////////////////////////////////////////////////// RATE ROUTE
app.post('/release/rate', async (req, res, next) =>
{
  const rating = req.body.rating;
  const album_id = req.body.albumID;
  await rateAlbum(rating, album_id, req.session.user.username); //call rate album with rating and album_id

  //RE-render the page:
  try
  {
    const fetchRating = 'SELECT overallRating FROM release WHERE release_id = $1';
    const result = await db.oneOrNone(fetchRating, album_id);
    const avgRating = result.overallrating;

    const userRating = await getUserRating(album_id, req.session.user.username);

    const reviews = await getReviews(album_id);
    console.log("reviews: ", reviews);

    console.log("overallRating = " + avgRating);
    const data = await spotifyApi.getAlbum(album_id);
    const updatedAlbumBody = data.body;
    console.log("Rerendering the page with updated data:");
    // Pass the updated Spotify data to the render function
    res.render('pages/release', {
      albumBody: updatedAlbumBody,
      image: updatedAlbumBody.images[0].url,
      albumName: updatedAlbumBody.name,
      artist: updatedAlbumBody.artists[0].name,
      tracks: updatedAlbumBody.tracks,
      id: album_id,
      avgRating,
      userRating,
      reviews
    });
  } catch (error)
  {
    console.error("Error fetching updated data from Spotify:", error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }
});

///////////////////////////////////////////////////GET REVIEW PAGE:
app.get('/review', (req, res) =>
{
  const album_title = req.query.album_title;
  const album_id = req.query.albumID;
  const errorMessage = req.query.errorMessage || null;
  try
  {
    console.log("album_title: ", album_title);
    console.log("id: ", album_id);
    res.render('pages/review',
      { album_title, album_id, errorMessage });
  } catch (error)
  {
    console.error('Error rendering the reviews page: ', error);
  }
});

async function insertReview(username, album_id, review)
{
  //Don't insert empty reviews:
  if (!review.trim())
  {
    console.log("Review is empty. Not inserting into the database.");
    return;
  }
  const prevQuery = `SELECT * FROM review WHERE username = $1 and release_id = $2`; ///
  const prevReview = await db.oneOrNone(prevQuery, [username, album_id]);

  if (prevReview)
  {
    //user has wrote a review for this album:
    console.log("User has previously wrote a review for the album. User updates their current review");
    const updateReview = `UPDATE review
    SET summary = $1
    WHERE release_id = $2 AND username = $3`;
    console.log("Updating user ", username, "'s review for ", album_id);
    await db.none(updateReview, [review, album_id, username]);
  }
  else
  {
    const reviewQuery = `INSERT INTO review (username, release_id, summary)
      VALUES (
          (SELECT username from users WHERE username = $1),
          (SELECT release_id from release WHERE release_id = $2),
          $3
        )`;
    console.log("inserting review: \'", review, "\' into review table");
    await db.none(reviewQuery, [username, album_id, review]);
  }

}

app.post('/review', async (req, res) =>
{
  const album_id = req.body.album_id;
  const review = req.body.review;

  if (!review.trim()) //do not insert empty reviews:
  {
    console.log("Review is empty. Skipping insertion and rendering page with error");
    const errorMessage = "Please enter a non-empty review.";
    const album_title = req.body.album_title;
    return res.render('pages/review', { album_title, album_id, errorMessage });
  }

  try
  {
    console.log("review: ", review);
    await insertReview(req.session.user.username, album_id, review);

    return res.redirect('/release/' + album_id);
  } catch (error)
  {
    console.error('Error with review', error);
  }
});





//pass in item id as paramter
//click on release to show average rating, so not shown on the home for each album (dont worry about it now)


// *****************************************************
// <!-- Section 5 : Start Server -->
// *****************************************************

// module.exports = app.listen(3000, () =>
// {
//   console.log('Server is listening on port 3000');
// });

//Chris solution:

const server = app.listen(3000, () =>
{
  console.log('Server is listening on port 3000');
});