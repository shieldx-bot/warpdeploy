import React, { useEffect } from 'react'
import axios from 'axios';
export default function Dashboard() {
   useEffect(() => {
    const query_String = window.location.search;
    const url_Params = new URLSearchParams(query_String);
    const code = url_Params.get('code');
    if(!code){ 
      return;
    }
    

  
    const fetchAccessToken = async() =>{ 
      try {
        const response  = await axios.post('http://localhost:5000/github/get_access_token', {
          code: code
        })
        if(response.data.access_token){ 
          localStorage.setItem('access_token', response.data.access_token);
        } else { 
          console.error("Error retrieving access token:", response.data);
         }

        window.history.replaceState({}, document.title, "/dashboard");

      } catch (error) {
        console.error("Error fetching access token:", error);
      }
    }
    fetchAccessToken();





  }, []);

  const loginWithGithub = () => {
    alert("Redirecting to GitHub for authentication");
    localStorage.removeItem('access_token');
    window.location.assign("https://github.com/login/oauth/authorize?client_id=Ov23lik3HiCw8svL1G5f")
  }

  return (
    <div className='w-full h-full  '>
      <h1 style={{ color: 'red' }}>Hello  World</h1>
      <button className='w-20 h-5 rounded-xl' onClick={loginWithGithub}>Login with GitHub</button>
    </div>
  )
}
