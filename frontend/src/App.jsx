import NavBar from './navbar';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/login';
import HomePage from './pages/homepage';
import Test from './pages/test';
import LibraryPage from './pages/userlibrary';
import SpotifyWebApi from 'spotify-web-api-js';
import { useSpotifyApi } from './Provider/SpotifyApiProvider';
import PlaylistPage from './pages/playlist';
import RecommendationPage from './pages/recommendation';
const spotifyApi = new SpotifyWebApi();

const getTokenFromUrl = () =>
{
  return window.location.hash.substring(1).split('&').reduce((initial, item) =>
  {
    let parts = item.split("=");
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial;
  }, {});
};

const refreshAccessToken = async () =>
{
  try
  {
    const refreshResponse = await fetch('http://localhost:3000/refresh-token');
    const data = await refreshResponse.json();

    if (data.accessToken)
    {
      const newToken = data.accessToken;

      // Update token and expiration time
      setSpotifyToken(newToken);
      localStorage.setItem('spotifyToken', newToken);

      const expiresIn = 3600; // Typically provided by Spotify in seconds
      const newExpiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem('spotifyTokenExpiresAt', newExpiresAt);

      spotifyApi.setAccessToken(newToken);

      // Fetch user data with the new token
      const user = await spotifyApi.getMe();
      setUserId(user.id);
      console.log(user.id);
    } else
    {
      console.error("No access token returned from the refresh endpoint.");
    }
  } catch (error)
  {
    console.error("Failed to refresh access token:", error);
  }
}

function App()
{
  const [spotifyToken, setSpotifyToken] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() =>
  {
    const storedToken = localStorage.getItem('spotifyToken');
    const expiresAt = localStorage.getItem('spotifyTokenExpiresAt');
    const refreshToken = localStorage.getItem('spotifyRefreshToken');

    // Check if the token is expired
    if (storedToken && expiresAt && Date.now() < expiresAt)
    {
      // Token is still valid, use it
      console.log("Using stored Spotify token: ", storedToken);
      setSpotifyToken(storedToken);
      spotifyApi.setAccessToken(storedToken);

      spotifyApi.getMe().then((user) =>
      {
        setUserId(user.id);
        setUser(user);
      }).catch(error =>
      {
        console.error("An error occurred getting user details: ", error);
      });

      setLoggedIn(true);
    } else if (refreshToken)
    {
      refreshAccessToken();
    } else
    {
      // accessToken is missing or expired, refreshToken is missing, start the authentication flow
      const tokenFromUrl = getTokenFromUrl().access_token;
      if (tokenFromUrl)
      {
        console.log("This is our Spotify token: ", tokenFromUrl);
        setSpotifyToken(tokenFromUrl);
        localStorage.setItem('spotifyToken', tokenFromUrl);

        // Store the expiration time
        const expiresIn = 3600; // Typically provided by Spotify in seconds
        const expiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem('spotifyTokenExpiresAt', expiresAt);

        spotifyApi.setAccessToken(tokenFromUrl);
        spotifyApi.getMe().then((user) =>
        {
          console.log(user);
          setUser(user);
          setUserId(user.id);
        });

        setLoggedIn(true);
        navigate('/homepage');
      } else
      {
        console.log("No Spotify token found");
      }
    }

    // Clear URL hash after processing the token
    window.location.hash = "";
  }, [navigate, spotifyToken]);


  return (
    <>
      <NavBar />
      <Routes>
        <Route path='/' element={<Test />} /> {/* Set a default route */}
        <Route path='/test' element={<Test />} /> {/* Set a default route */}
        <Route path='/login' element={<LoginPage />} />
        <Route path='/homepage' element={<HomePage token={spotifyToken} id={userId} />} />
        <Route path='/playlist/:id' element={<PlaylistPage />} />
        <Route path='/library' element={<LibraryPage user={user} token={spotifyToken} />} />
        <Route path='/recommendations' element={<RecommendationPage />} />
        {/* Add any additional routes as needed */}
      </Routes>
    </>
  );
}

export default App;