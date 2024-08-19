const axios = require('axios');


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

module.exports = { getPlaylistData };