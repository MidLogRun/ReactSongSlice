import { useSpotifyApi } from "../Provider/SpotifyApiProvider";
import { useEffect, useState } from "react";


const LibraryPage = ({ user, token }) =>
{

    const spotifyApi = useSpotifyApi(); // too clever

    console.log("userLibrary Token: ", token);

    const [topTracks, setTopTracks] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() =>
    {
        const fetchTopTracks = async () =>
        {
            try
            {
                const response = await fetch('http://localhost:3000/library/toptracks');
                if (!response.ok)
                {
                    console.log('Failed to fetch top tracks.');
                }
                const data = await response.json();

                console.log("data from backend! ", data.topTracks)
                setTopTracks(data.topTracks);

            } catch (error)
            {
                setErr(error);
                console.error("error with fetching top tracks", error);
            } finally
            {
                setLoading(false);
            }
        }
        fetchTopTracks();

    }, []);



    if (!user || loading)
    {
        return <div className="mt-3">Loading...</div>
    }

    const items = topTracks.items;
    console.log("topTracks.items: ", items);

    return (
        <div>


            <div className='library-container'>

                <div className='profile-details'>
                    <div className='profile-image'>
                        <img src={user.images[1].url} alt="This is the image"></img>
                    </div>
                    <div className="profile-bio">
                        <h1>
                            {user.display_name}
                        </h1>
                        <a href={user.external_urls.spotify}>{user.email}</a>
                    </div>

                </div>



                <h1> 20 recently liked songs:</h1>

                <div className='tracklist'>
                    {items.map((item, index) =>
                    (
                        <div className="track-item" key={index}>

                            {/* <a href={track.track.external_urls.spotify} className='track-link'>{item.track.name}</a> */}
                            <div className='track-image'>
                                <img src={item.track.album.images[1].url} />
                            </div>

                            <a href={item.track.external_urls.spotify} className='track-link'>{item.track.name}</a>

                            {/* <h1>{item.track.name}</h1> */}

                        </div>


                    ))}
                </div>




            </div>
        </div>
    )
}


export default LibraryPage;