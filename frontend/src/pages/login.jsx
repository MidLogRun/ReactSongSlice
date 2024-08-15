import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DarkLogo from '../resources/img/DarkLogo.png';



const LoginPage = () =>
{

    const handleClick = () =>
    {
        alert("Pressed the button!");
        //TODO set up login backend here
    }

    return (
        <>
            <img src={DarkLogo} width="201.5" height="30" alt="Image not found" id="logo"></img>

            <div className="container">
                <h2 className="mt-5">Login with Spotify</h2>
                <div className='mt-4'>
                    <button type="submit" onClick={handleClick} className="btn login-button" >Login</button>
                </div>

                <p id="register_button" className="mt-3" >
                    Don't have an account? <a href="/register">Register here.</a>
                </p>
            </div>
        </>
    )
}

export default LoginPage;
