import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { DataTable } from "@/components/dashboard/data-table"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { data } from './data';
export default function Projects() {
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

       
           
 

          // optionally persist or set state with repos
          localStorage.setItem('repos', JSON.stringify(response.data.dataRepo));

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

  // const loginWithGithub = () => {
  //   alert("Redirecting to GitHub for authentication");
  //   localStorage.removeItem('access_token');
  //   window.location.assign("https://github.com/login/oauth/authorize?client_id=Ov23lik3HiCw8svL1G5f")
  // }

  return (
    // <div className='w-full h-full  '>
    //   <h1 style={{ color: 'red' }}>Hello  World</h1>
    //   <button className='w-20 h-5 rounded-xl' onClick={loginWithGithub}>Login with GitHub</button>      
    // </div>
     <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
