import React from 'react';

const Carousel = ({ playlists }) =>
{
    return (
        <main>
            <h1 className="text-center" id="homepage-title">Click on any playlist to view it.</h1>

            <div id="albumCarousel" className="carousel slide" data-bs-ride="carousel">
                {/* Carousel Indicators */}
                <ol className="carousel-indicators">
                    {playlists.map((_, index) => (
                        <li
                            key={index}
                            data-bs-target="#albumCarousel"
                            data-bs-slide-to={index}
                            className={index === 0 ? 'active' : ''}
                        ></li>
                    ))}
                </ol>

                {/* Carousel Inner */}
                <div className="carousel-inner">
                    {playlists.map((playlist, index) => (
                        <div
                            key={playlist.id}
                            className={`carousel-item ${index === 0 ? 'active' : ''}`}
                        >
                            <a href={`/playlist/${playlist.id}`}>
                                <img
                                    src={playlist.images[0].url}
                                    className="d-block w-100"
                                    alt={`${playlist.name} Image`}
                                />
                                <div className="carousel-caption d-none d-md-block">
                                    <h2 id="highlight">{playlist.name}</h2>
                                    <p id="highlight">{playlist.description}</p>
                                    <p>playlist ID: {playlist.id}</p>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>

                {/* Carousel Controls */}
                <a
                    className="carousel-control-prev"
                    href="#albumCarousel"
                    role="button"
                    data-bs-slide="prev"
                >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </a>
                <a
                    className="carousel-control-next"
                    href="#albumCarousel"
                    role="button"
                    data-bs-slide="next"
                >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </a>
            </div>
        </main>
    );
};

export default Carousel;