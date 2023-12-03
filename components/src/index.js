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

const SpotifyWebAPi = require('spotify-web-api-node'); //wrapper for spotify web api


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
  Album30: '4Coa8Eb9SzjrkwWEom963Q' //Puberty 2
};

/******** Section 1.5 */
//Mount Spotify API:
const client_id = process.env.CLIENT_ID; //client id
const client_secret = process.env.CLIENT_SECRET; //client secret
//const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64'); //Auth token to give to spotify

const spotifyApi = new SpotifyWebAPi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

//Retrieving access token:
/* The JSON body returned from Spotify looks like this:
    {
      "access_token": "NgCXRKc...MzYjw",
      "token_type": "bearer",
      "expires_in": 3600
    }
*/
spotifyApi
  .clientCredentialsGrant() //we are using client credentials OAuth flow (no need to have redirect URI)
  .then(data =>
  {
    console.log("spotifyApi data body: " + data.body);
    spotifyApi.setAccessToken(data.body["access_token"]);

  })
  .catch(error =>
  {
    console.error("Something went wrong when retrieving an access token", error);
  })


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
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use('/resources', express.static('./resources'));

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
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

// Redirect root URL to /login
app.get('/', (req, res) => {
    res.redirect('/login');
});



// //***********************LOGIN */
// Login - GET route
app.get('/login', (req, res) => {
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
    req.session.save();

    //res.json({status: 'Login success!', message: 'Welcome!'});
    return res.redirect('/homepage');


  } catch (error)
  {
     console.error('Error during login', error.message);
     res.status(500).json({ message: 'Login failed (Entered catch block)' });
  }
});


// //***********************REGISTER */
// Register - GET route
app.get('/register', (req, res) => {
  res.render('pages/register');
});

// register POST routine:
app.post('/register', async (req, res) =>
{
   const userPassword = req.body.password;
  const username = req.body.username;

  if (!userPassword)
  {
   return res.render('pages/register', { message: 'You need to enter a password'}); //correct path is?
  }

  if (!username)
  {
   return res.render('pages/register', { message: 'You need to enter a username'}); //correct path is?
  }

  try {
    const saltRounds = 10;
    console.log("user password is: " + userPassword);
    const hashWord = await bcrypt.hash(userPassword, saltRounds); // Hash the password

    const insertUser = 'INSERT INTO users (username, password) VALUES ($1, $2)'; // SQL Query to insert user

    //insert the user into database
    const result = await db.none(insertUser, [
      username,
      hashWord
    ]);

    console.log("User registered successfully.");
    //Save session info
    req.session.user = insertUser;
    req.session.save();
    return res.redirect('/home'); //redirect the user to the home page

  } catch (error) {
    console.error('Error saving user info: ', error);
    res.render('pages/register',{message: 'An error occurred while registering the user.'})
  }
});


// Authentication Middleware:
const auth = (req, res, next) => {
  if (!req.session.user) {
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
    return res.redirect('/home');
  }

  return res.redirect('/login');

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
function randomFourAlbums()
{
  const albumIDsArray = Object.values(AlbumIDs);
  const maxAlbums = 4;

  const cloneAlbumIDs = [...albumIDsArray];
  for (let i = cloneAlbumIDs.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [cloneAlbumIDs[i], cloneAlbumIDs[j]] = [cloneAlbumIDs[j], cloneAlbumIDs[i]]
  }
    const selectedAlbumIDs = cloneAlbumIDs.slice(0, maxAlbums); //4 random ids

    return selectedAlbumIDs;
}


// //***********************HOME */
app.get('/home', (req, res) => {
  try
  {
    res.render('pages/home');
  } catch (error) {
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
  const IDs = randomFourAlbums(); //Array of four random IDs from bank above

  try
  {
    //Can't use a regular loop since spotifyApi.getAlbums returns a promise:
    await Promise.all(IDs.map(async (ID, index) => {
      const data = await spotifyApi.getAlbum(ID);
      images[index] = data.body.images[0].url; // Grab the first image in the list (images[0])
      names[index] = data.body.name; // Name of the album
      artists[index] = data.body.artists[0].name; // Name of the primary album artist
    }));

    res.render('pages/homepage', { IDs, images, names, artists }); //render the homepage with these attributes
  } catch (error)
  {
    console.error("Error loading the homepage");
    res.status(500).send("Error loading the homepage");
  }
});


/////////////// Beginning of release function
app.get('/release', (req, res, next) =>
{
  spotifyApi.getAlbum('43otFXrY0bgaq5fB3GrZj6')
    .then(
      function (data)
      {
        // let image = data.body.images[0];
        res.render('pages/release', { image: data.body.images[0].url, albumName: data.body.name, artist: data.body.artists[0].name, tracks: data.body.tracks });
      },
      function (error)
      {
        console.error("This error happened", error);
      }
    )
});



//pass in item id as paramter
//click on release to show average rating, so not shown on the home for each album (dont worry about it now)
function rated1(){

  let rate = 1;

  //way to get album id

  //let album_id = album currently on
  const checkRate = 'SELECT 1 FROM user_to_release WHERE release_id = album_id';

  const result = db.query(checkRate);


  //if user has not rate before
  if(result.length == 0)
  {
    //inserts album to user_to_release, as they have not yet rated album
    const insertRelease = 'INSERT INTO user_to_release release_id VALUES = album_id'; //insert the album into the release_id collum


    //inserts rating to release's ratings
    const insertRate = 'INSERT INTO release overallRating VALUES = rate'; //check if this adds, not replaces all ratings

    //inserts rating for the album, into user_to_release
    const insertRateUser = 'INSERT INTO user_to_release SET rating = rate WHERE release_id = album_id';

  }




};

function rated2(){


};

function rated3(){


};

function rated4(){


};

function rated5(){


};



 //TESTNG OTHER WAYS 
// var rating = document.getElementById('userRating');

// var buttons = document.getElementsByTagName('button');
    
// var selectedButtonNumber;
//     // find button selected
//     for (var i = 0; i < buttons.length; i++) {
//         buttons[i].addEventListener('click', function(event) {
            
//             if(document.getElementById('button') == enabled)
//             {
//               selectedButtonNumber = i;
//             }

//           })
//         }
//         //disable others
//         for (var i = 0; i < buttons.length; i++) {
//           if(i != selectedButtonNumber)
//           {
//             document.getElementsById('button') = disabled;
//           }

//         }
          
//};

//test
// app.put('/updateLikes', (req, res) => {
//   const { like_input } = req.body;

// //TODO: Change attributes of query to fit album database
// //query to update data in album query  

// const insertRate = 'INSERT INTO release ratings VALUES = $1'

// //add my rate into the release reviews
// //then we can query / average 
//maybe get id of image/song/album currently on when pressing button. Then when carousel rotates, refresh button disability


// //talk to lilia - she has to edit table for below part to work
// //eventually, going to have to make it so you can only review once, updating a bool value in a table that user has review that album (user_to_release?)

// // CREATE TABLE review(
// //   review_id INT PRIMARY KEY,
// //   username VARCHAR(50) NOT NULL,
// //   release_id INT,
// //   title VARCHAR(50) NOT NULL,
// //   summary TEXT,
// //   rating INT CHECK (rating >= 1 and rating <= 5) NOT NULL,
// //   CONSTRAINT FK_review_user FOREIGN KEY (username) REFERENCES users(username),
// //   CONSTRAINT FK_review_release FOREIGN KEY (release_id) REFERENCES release(release_id),
// //   CONSTRAINT UQ_user_release_review UNIQUE (username, release_id) -- Ensures that each user can only make one review per release
// // );

//   res.status(200).json({message: 'Data updated successfully'});
// });







// *****************************************************
// <!-- Section 5 : Start Server -->
// *****************************************************
 module.exports = app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});