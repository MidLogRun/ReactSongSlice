import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';



const NavBar = () =>
{

    const navItems = [
        { to: '/', label: 'test' },
        { to: '/homepage', label: 'Home' },
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
        { to: '/library', label: 'Library' },
        { to: '/recommendations', label: 'Recommend me something!' },

    ];

    return (
        <nav>
            <ul>
                {navItems.map((item, index) => (
                    <li key={item.to}>
                        <Link to={item.to}> {item.label}</Link>
                    </li>))}
            </ul>
        </nav>
    )
}

export default NavBar;