import React from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation from react-router-dom

const Footer = () => {
    const location = useLocation(); // Get the current location/path

    // Hide the footer on the '/client' page or any page starting with '/client'
    if (location.pathname.startsWith('/client')) {
        return null;
    }

    return (
        <div className="col-lg-8 mx-auto p-4 py-md-5">
            <footer className="pt-5 my-5 text-body-secondary border-top">
                Created by the Bootstrap team &middot; &copy; 2024
            </footer>
        </div>
    );
};

export default Footer;
