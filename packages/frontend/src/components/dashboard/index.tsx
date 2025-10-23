import React, { useEffect, useState } from 'react'
import axios from 'axios';
export default function Dashboard() {
  const [hasGetAccess, setHasGetAccess] = useState(false)
  const query_String = window.location.search;
  const url_Params = new URLSearchParams(query_String);
  const code = url_Params.get('code');
  useEffect(() => {



    if (!code) {
      return;
    }



    const fetchAccessToken = async () => {
      if (hasGetAccess) {
        return;
      }
      setHasGetAccess(true)


      try {

        const response = await axios.post('http://localhost:5000/github/get_access_token', {
          code: code
        })
        if (response.data.status === 'success') {
          console.log(response.data);
          localStorage.setItem('access_token', response.data.access_token);

          type RepoFromApi = {
            id: number;
            name: string;
            full_name: string;
            private: boolean;
            html_url: string;
          };

          type Repo = {
            id: number;
            name: string;
            fullname: string;
            private: boolean;
            url: string;
          };
           const repos: Repo[] = []
          

           response.data.datRepo?.map((item: RepoFromApi) => {
             const data =  {
              id: item.id,
              name: item.name,
              fullname: item.full_name,
              private: item.private,
              url: item.html_url,
            };
            repos.push(data);
          });
          console.log("Repos:", repos);

          // optionally persist or set state with repos
          localStorage.setItem('repos', JSON.stringify(repos));

        } else {
          console.error("Error from server:", response.data);
        }







        window.history.replaceState({}, document.title, "/dashboard");

      } catch (error) {
        console.error("Error fetching access token:", error);
      }
      window.history.replaceState({}, document.title, "/dashboard");
    }
    fetchAccessToken();





  }, [code]);

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
