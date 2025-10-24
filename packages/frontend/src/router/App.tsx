import React from 'react';  
import { Route, Routes } from 'react-router-dom';
import LoginPage from '@/components/login/index';
import Dashboard from '@/components/dashboard/index';
import SignupPage from '@/components/signup';
import OTPPage from '@/components/otp';
 
function App() {
   return (
    <div className='App'>
      <Routes>
        <Route path="/dashboard" element={<Dashboard/>}  />
        <Route path="/login" element={<LoginPage/>}  />
        <Route path="/signup" element={<SignupPage/>}  />
        <Route path="/otp" element={<OTPPage/>}  />
      </Routes>
    </div>
  )
}

export default App
