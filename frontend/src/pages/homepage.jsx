import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DarkLogo from '../resources/img/DarkLogo.png';
import { useSpotifyApi } from '../Provider/SpotifyApiProvider';
import Carousel from './components/carousel';



const HomePage = ({ token, id }) =>
{
    const [playlists, setPlaylists] = useState([]);

    const fetchAlbums = async () =>
    {
        try
        {
            const response = await axios.post('http://localhost:3000/playlist_data',
                {
                    user_id: id,
                    token: token,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                },

            );

            console.log("playlists:", response.data.data.items);
            setPlaylists(response.data.data.items);


        } catch (error)
        {
            console.error("an error occurred fetching album data: ", error);
        }
    }


    // console.log("Spotify token in homepage: ", token); //Since we have the spotify token, now we can display data from spotify
    console.log("user id in homepage: ", id);
    const spotifyApi = useSpotifyApi();

    return (
        <div>
            <Carousel playlists={playlists} />
            <div className='container'>
                <button onClick={fetchAlbums} className='btn'> hello I am a button.</button>
            </div>

        </div>
    )
}

export default HomePage;
