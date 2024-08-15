import React, { createContext, useContext } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const SpotifyApiContext = createContext();

export const SpotifyApiProvider = ({ children }) =>
{
    const spotifyApi = new SpotifyWebApi();

    return (
        <SpotifyApiContext.Provider value={spotifyApi}>
            {children}
        </SpotifyApiContext.Provider>
    );
};

export const useSpotifyApi = () => useContext(SpotifyApiContext);
