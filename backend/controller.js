const axios = require('axios');
const genres = require('./genres');

const getPlaylistData = async (req, res) =>
{
    const user_id = req.query.user_id;
    const token = req.session.spotifyAccessToken;

    console.log("userid: ", user_id);
    console.log("token:", token);

    const url = 'https://api.spotify.com/v1/me/playlists';

    if (!user_id || !token)
    {
        console.log("/playlist_data token or user_id missing");
        return res.status(400).send({ user_id: null, message: "No user id or token" });
    }

    try
    {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("response gotten");

        return res.status(200).send({ user_id: user_id, data: response.data });
    } catch (error)
    {
        console.error("Error fetching playlists:", error.message);
        return res.status(400).send({ user_id: null, message: "No user id" })
    }
}

const getTrack = async (req, res) =>
{
    const token = req.session.spotifyAccessToken;
    const track = req.query.track;
    const url = 'https://api.spotify.com/v1/search';

    console.log('Track: ', track);

    if (!token)
    {
        return res.status(400).json({ error: 'No token provided' });
    } else
    {
        try
        {
            const response = await axios.get(url, {
                headers:
                {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    'q': track,
                    'type': 'track',
                    'limit': 1
                }

            });
            console.log("Hello I am a response code: ", response.status);

            return res.status(200).json({ data: response.data });

        } catch (error)
        {
            console.error("Internal error getting genres", error);
            return res.status(400).send({ error: error });
        }
    }

}

const makeCall = async (item, token) =>
{
    // make a call to https://api.spotify.com/v1/search

    const url = 'https://api.spotify.com/v1/search';

    try
    {
        const response = await axios.get(url, {
            headers:
            {
                'Authorization': `Bearer ${token}`
            },
            params: {
                'q': item,
                'type': 'track'
            }

        });
        console.log("makeCall response: ", response.data);

        return response.data.tracks.items[0].id;

    } catch (error)
    {
        console.error("Internal error in makeCall", error);
        return null;
    }

}

const getRecommendation = async (req, res) =>
{
    const { seed_genres, tracks } = req.query
    const token = req.session.spotifyAccessToken;
    const url = 'https://api.spotify.com/v1/recommendations';

    const params = {
        'limit': 5
    }

    if (seed_genres)
    {
        params['seed_genres'] = seed_genres;
    }
    else
    {
        //set seed_genres to alternative by default:
        params['seed_genres'] = 'alternative';
    }

    if (tracks)
    {
        var seed_tracks = [];

        try
        {
            const trackQueries = tracks.split(',');
            for (const query of trackQueries)
            {
                seed_tracks.push(await makeCall(query, token));
            }
            seed_tracks.join(',');

            console.log("seed_tracks: ", seed_tracks);
        } catch (error)
        {
            console.log("Error Converting tracks to their ids", error);
            return res.status(503).json({ error: 'Error converting tracks to their associated ids.' });
        }
        params['seed_tracks'] = seed_tracks;
    }

    if (!seed_genres && !tracks)
    {
        console.log("No genres or tracks ")
        return res.status(400).json({ message: 'No seed genres or seed tracks provided' });
    }
    else
    {


        try
        {

            console.log("Getting recommendations from", url, "with params: ", params);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: params
                // {
                //     'seed_genres': seed_genres,
                //     'seed_tracks': seed_tracks,
                //     'limit': 5
                // }
            });

            console.log("Recommended Tracks: ", response.data.tracks);
            return res.status(200).send({ data: response.data });

        } catch (error)
        {
            console.error('Internal error getting recommendations', error);
            return res.status(400).send({ error: error });
        }
    }
}

const getPlaylistRecommendations = async (req, res) =>
{
    const { trackIds } = req.query;
    const token = req.session.spotifyAccessToken;
    const url = 'https://api.spotify.com/v1/recommendations';

    const params = {
        'limit': 5
    }

    console.log("trackIds: ", trackIds);
    console.log("token:", token);

    if (trackIds)
    {
        params['seed_tracks'] = trackIds;

        console.log("params:", params);

        try
        {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: params
            });

            if (response.status == 200)
            {
                console.log("success getting recommendations");
                return res.status(200).send({ data: response.data });
            }
            else
            {
                return res.status(response.status).send({ error: "error making request" });
            }

        } catch (error)
        {
            console.log("Error getting recommendations:", error);
            return res.status(400).send({ error: 'Internal server error' });
        }

    } else
    {
        console.log("Please select 5 tracks Ids");
        return res.status(400).send({ error: "User did not select tracks." });

    }
}

const getGenres = async (req, res) =>
{
    console.log("getting /genres");
    try
    {
        return res.status(200).json({ genres: genres });
    } catch (error)
    {
        console.error("Internal error getting genres", error);
        return res.status(400).send({ error: "Error /genres" });
    }
}


module.exports = { getPlaylistData, getTrack, getRecommendation, getGenres, getPlaylistRecommendations };