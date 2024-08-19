import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;


const RecommendationPage = () =>
{
    const [tracks, setTracks] = useState([]);
    const [recommendations, setRecommendations] = useState(null);
    const [genres, setGenres] = useState([]);
    const [availableGenres, setAvailableGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);


    useEffect(() =>
    {

        const fetchGenres = async () =>
        {
            try
            {
                const response = await axios.get('http://localhost:3000/genres');
                setAvailableGenres(response.data.genres);
            } catch (error)
            {
                console.error("an error occurred fetching genre data: ", error);
            } finally
            {
                setLoading(false);
            }
        }

        fetchGenres();
        console.log('Fetched genres');
    }, []);

    const handleSubmit = async (e) =>
    {

        e.preventDefault();
        try
        {

            const tracksParam = tracks.join(',');
            const genresParam = genres.join(',');

            const response = await axios.get('http://localhost:3000/recommend', {
                params: {
                    seed_genres: genresParam,
                    tracks: tracksParam
                }
            });

            console.log("form submit response:", response);

            if (response.status === 200)
            {
                const recResponse = response.data.data.tracks;

                if (Array.isArray(recResponse))
                {
                    setRecommendations(recResponse);
                    console.log("recommendations set:", recResponse);
                } else
                {
                    console.error("Unexpected data structure", recResponse);
                }
            }
            else if (response.status === 400)
            {
                console.log("User must enter both tracks and genres");
                setErr("Please enter both tracks and genres");

            } else if (response.status === 503)
            {
                console.log("Service unavailable");
            }


        } catch (error)
        {
            console.error("Error fetching recommendations:", error);
        }

    }

    const handleGenreChange = (index, value) =>
    {
        const updatedGenres = [...genres];
        updatedGenres[index] = value;
        setGenres(updatedGenres);
    }

    const handleInput = (index, value) =>
    {
        const updatedTracks = [...tracks];
        updatedTracks[index] = value;
        setTracks(updatedTracks);
    }


    const clearGenreSelection = () =>
    {
        setGenres([]);
    }

    const clearTrackSelection = () =>
    {
        setTracks([]);
    }

    const testSearch = async () =>
    {

        let t = tracks.join(',');

        console.log("t:", t);
        try
        {
            const response = await axios.get('http://localhost:3000/track', {
                params: {
                    track: t
                }
            });
            console.log(response.data);

        } catch (err)
        {
            console.log("testSearch error:", err);
        }
    }

    if (loading)
    {
        return <div className='mt-3'><p>Loading... </p></div>
    }



    return (
        <div>
            {err && <div className='error-message'>{err}</div>}
            <div className='form-container'>
                <form onSubmit={handleSubmit}>
                    <div className='form-group'></div>

                    {Array.from({ length: 2 }).map((_, index) => ( //Dynamically render two select boxes
                        <div className='form-group' key={index}>
                            <label>Choose for genre{index + 1}</label>
                            <div className='form-select-container'>
                                <select
                                    value={genres[index] || ''}
                                    onChange={(e) => handleGenreChange(index, e.target.value)}
                                    className='form-select'
                                >
                                    {availableGenres.map((genre) => (
                                        <option key={genre} value={genre}>{genre}</option>
                                    ))}
                                </select>

                            </div>
                        </div>
                    ))}
                    {/* Button: */}
                    <div className='form-group'>
                        <label>Selected Genres:</label>
                        <ul className='selected-genres-list'>
                            {genres.length === 0 ? (
                                <li>No genres selected</li>
                            ) : (
                                genres.map((genre, index) => (
                                    <li key={index}>{genre}</li>
                                ))
                            )}
                        </ul>
                        <button onClick={clearGenreSelection} type='button'>Clear selection</button>
                    </div>
                    {/* Input: */}

                    {Array.from({ length: 3 }).map((_, index) => ( //Dynamically render three input boxes
                        <div className='form-group' key={index}>
                            <label>Track {index + 1}</label>
                            {(index == 0) ? (<input type='text' onChange={(e) => handleInput(index, e.target.value)} required />
                            ) : (<input type='text' onChange={(e) => handleInput(index, e.target.value)} />
                            )}
                            {/* <input type='text' onChange={(e) => handleInput(index, e.target.value)} required /> */}
                        </div>

                    ))}
                    <button onClick={testSearch} type='button'> Click me!</button>
                    <div className='form-group'>
                        <button onClick={clearTrackSelection} type='button'>Clear selection</button>
                    </div>


                    <button type="submit">Submit</button>
                </form>
            </div>

            <div>
                {recommendations ? (<div className='tracklist'>
                    {
                        recommendations.map((item, index) =>
                        (
                            <div className='track-item' key={index}>
                                <div className='track-image'>
                                    <img src={item.album.images[0].url} />
                                </div>

                                <a href={item.external_urls.spotify} className='track-link'>{item.name}</a>

                                <div className='artist-list'>
                                    {item.artists.map((artist, index) => (
                                        <span key={artist.id}>
                                            <a href={artist.external_urls.spotify}>
                                                <p>{artist.name}
                                                    {(index < item.artists.length - 1) ? (",") : (" ")}
                                                </p>
                                            </a>
                                        </span>


                                    ))}
                                </div>
                            </div>
                        ))
                    }
                </div>) : (<div>Nothing</div>)}
            </div>
        </div>



    )





}

export default RecommendationPage;
