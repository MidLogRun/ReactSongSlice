import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DarkLogo from '../resources/img/DarkLogo.png';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();


const handleClick = async (e) =>
{
    e.preventDefault();

    try
    {
        window.location.href = 'http://localhost:3000/login';

    } catch (error)
    {
        console.error("Unexpected login btn error: ", error)
    }

}


const LoginPage = () =>
{


    const [spotifyToken, setSpotifyToken] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);


    return (
        <>
            <img src={DarkLogo} width="201.5" height="30" alt="Image not found" id="logo"></img>
            <div className="container">
                <h2 className="mt-5">Login with Spotify</h2>
                <div className='mt-4'>
                    {loggedIn ? (<h2>You are logged in</h2>) : (<button type="submit" onClick={handleClick} className="btn login-button" >Login</button>)}
                </div>

                <p id="register_button" className="mt-3" >
                    Don't have an account? <a href="/register">Register here.</a>
                </p>
            </div >
        </>
    )
}

export default LoginPage;
