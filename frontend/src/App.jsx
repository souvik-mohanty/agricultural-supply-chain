import React from 'react';
import RouterComponent from './routes/RouterComponent'; // Assuming this is the file where you handle routes


const App = () => {
  const isAuthenticated = !!localStorage.getItem('token'); // Example check
  return (
  
    <RouterComponent />
  );
};

export default App;
