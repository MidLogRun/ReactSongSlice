import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DarkLogo from '../resources/img/DarkLogo.png';
import { useSpotifyApi } from '../Provider/SpotifyApiProvider';
import Carousel from './components/carousel';

axios.defaults.withCredentials = true;


const HomePage = ({ token, id }) =>
{

    console.log("user id in homepage:", id);
    console.log("token in homepage:", token);

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() =>
    {
        if (id && token)
        {
            const fetchAlbums = async () =>
            {
                try
                {
                    const response = await axios.get('http://localhost:3000/playlist_data', {
                        params: {
                            user_id: id
                        }

                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log("response: ", response);
                    console.log("playlists:", response.data.data.items);
                    setPlaylists(response.data.data.items);
                } catch (error)
                {
                    console.error("an error occurred fetching album data: ", error);
                } finally
                {
                    setLoading(false);
                }
            };

            fetchAlbums();
        } else
        {
            console.log("id or token is null.");
        }
    }, [id, token]);

    if (loading)
    {
        return <div className='mt-4'><p>Loading... </p></div>
    }

    return (
        <div>
            <Carousel playlists={playlists} />
            <div className='container'>
                {/* <button onClick={fetchAlbums} className='btn'> hello I am a button.</button> */}
            </div>

        </div>
    )





}

export default HomePage;
