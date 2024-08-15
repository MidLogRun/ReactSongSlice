
import NavBar from './navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import LoginPage from './pages/login';



function App()
{
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path='/' />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/library' />
        <Route path='/home' />
        <Route path='/release' />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
