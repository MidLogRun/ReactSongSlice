import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';


axios.defaults.withCredentials = true;

const PlaylistPage = () =>
{

    const { id } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTracks, setSelectedTracks] = useState(new Set());
    const [recommendations, setRecommendations] = useState(null);

    useEffect(() =>
    {
        const fetchPlaylist = async () =>
        {
            try
            {
                const response = await axios.get(`http://localhost:3000/playlist/${id}`);

                const data = response.data.playlist;
                console.log("response: ", data);
                console.log(data);
                setPlaylist(data);

            } catch (error)
            {
                setError(error);
            } finally
            {
                setLoading(false);
            }
        }

        fetchPlaylist();
    }, [id]);

    const handleRecommendations = async () =>
    {
        var ids = Array.from(selectedTracks).join(',');

        const response = await axios.get('http://localhost:3000/playlistRecommendations', {
            params:
            {
                trackIds: ids
            }
        });
        const data = response.data;
        console.log(data.data.tracks);

        setRecommendations(data.data.tracks);
    }

    if (loading)
    {
        return <div className='mt-4'> <p>Loading...</p></div>; // Show loading indicator while fetching data
    }

    if (error)
    {
        return <div>Error: {error}</div>; // Show error message if there's an error
    }

    if (!playlist)
    {
        return <div>No playlist data available</div>; // Show a message if playlist is still null
    } else
    {
        // console.log(playlist);
        // console.log(playlist.tracks.items[0].track.name);
    }

    const playlistImageUrl = playlist.images[0].url;
    const tracksList = playlist.tracks.items;

    const handleCheck = (index, event, id) =>
    {


        if (selectedTracks.has(id))
        {
            //remove it:
            selectedTracks.delete(id);
        }
        else if (selectedTracks.size < 5)
        {
            selectedTracks.add(id);
        }
        else
        {
            event.preventDefault();
            alert("You can only add 5 items");
        }
        setSelectedTracks(new Set(selectedTracks));
        console.log("selected Tracks", selectedTracks);
    }




    return (
        <div className='vertical-container'>
            <div className="playlist-details">
                <div className='playlist-image'>
                    <img src={playlistImageUrl} className="d-block w-100" />

                    <div className="caption">
                        <h1 id='highlight' >{playlist.name}</h1>
                        <p id='highlight'>{playlist.owner.display_name}</p>
                    </div>

                </div>



            </div>
            <div className='recommendation-form'>
                <button type='submit' onClick={handleRecommendations}>
                    Recommendations
                </button>
            </div>

            <div className='tracklist'>
                {tracksList.map((item, index) => (
                    <div className='track-item' key={index}>

                        <div className='tracklist-checkbox'>
                            <label>
                                <input type='checkbox' onChange={(e) => handleCheck(index, e, item.track.id)} />
                            </label>
                        </div>

                        <div className='track-image'>
                            <img src={item.track.album.images[1].url} />
                        </div>

                        <a href={item.track.external_urls.spotify} className='track-link'>{item.track.name}</a>


                        <div className='artist-list'>
                            {item.track.artists.map((artist, index) => (
                                <span key={artist.id}>
                                    <a href={artist.external_urls.spotify}>
                                        <p>{artist.name}
                                            {(index < item.track.artists.length - 1) ? (",") : (" ")}
                                        </p>

                                    </a>
                                    {/* {index < item.track.artists.length - 1 && <span>,</span>} */}
                                </span>


                            ))}
                        </div>

                    </div>
                ))}
            </div>
            <div>
                {recommendations ? (<div className='tracklist-recommendations'>
                    <h1>Recommendations:</h1>
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
        </div >
    )

}

export default PlaylistPage;