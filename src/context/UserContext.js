import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);  // Added loading state
  const [error, setError] = useState(null);  // Added error state

  // Function to get the token from localStorage
  const getToken = () => {
    const token = localStorage.getItem('access_token'); // Retrieve token from localStorage
    return token;
  };

  // Wrap 'isAuthenticated' in useCallback to prevent it from changing on every render
  const isAuthenticated = useCallback(() => {
    return !!getToken();
  }, []); // This function doesn't depend on any props or state, so the dependency array is empty

  const fetchUserProfile = useCallback(async () => {
    const token = getToken();  // Get the token from localStorage
    if (isAuthenticated() && token) {
      setLoading(true);
      try {
        const response = await fetch('https://api.bittasker.xyz/profile/me/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.data); // Store the profile data (including avatar)
        } else {
          throw new Error(`Error fetching user data: ${response.status}`);
        }
      } catch (error) {
        setError(error.message);  // Store error message
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);  // Set loading to false after the request completes
      }
    } else {
      setLoading(false);  // Set loading to false if not authenticated
    }
  }, [isAuthenticated]); // Add 'isAuthenticated' as a dependency here

  // Call fetchUserProfile on mount or when token changes
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserProfile();
    } else {
      setLoading(false);  // Stop loading if no token is found
    }
  }, [isAuthenticated, fetchUserProfile]); // Add 'isAuthenticated' as a dependency here

  // Refresh the user data when called
  const refreshUserData = () => {
    fetchUserProfile();
  };

  return (
    <UserContext.Provider value={{ userData, isAuthenticated: isAuthenticated(), loading, error, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
