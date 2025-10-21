import React from 'react';  
import Dashboard from '../components/dashboard/index';
import { Route, Routes } from 'react-router-dom';

function App() {
   return (
    <div className='App'>
      <Routes>
        <Route path="/dashboard" element={<Dashboard/>}  />
      </Routes>
    </div>
  )
}

export default App
