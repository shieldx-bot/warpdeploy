import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { AppSidebar } from "@/components/app-sidebar"

import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"



import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  
} from '../ui/card';


import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


import { Button } from "@/components/ui/button"
import {
  Field,

} from "@/components/ui/field"
import { Github, Gitlab } from 'lucide-react';




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
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className='px-4 lg:px-6'>
              <InputGroup>
                <InputGroupInput placeholder="Enter a Git repository URL to deploy..." />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton variant="secondary">Continue</InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className='grid grid-cols-12 gap-4 py-4 md:gap-6 md:py-6 w-full justify-center'>
            <div className='col-span-6 px-4 lg:px-6 text-2xl font-semibol'>
              <h1 className="text-2xl font-medium  p-6 text-black/70 font-sans">Import Git Repository</h1>
              <Card>
                <CardHeader>
                  <CardDescription> Select a Git provider to import an existing project from a Git Repository. </CardDescription>
                </CardHeader>
                <CardAction className="mt-4 p-4">
                  <Field className="grid gap-4 sm:grid-cols-2">
                    <Button variant="outline" type="button">
                      <Github />
                      Continue with Github
                    </Button>
                    <Button variant="outline" type="button">
                      <Gitlab />
                      Continue with GitLab
                    </Button>

                    <Button variant="outline" type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Continue with BitBucket
                    </Button>


                  </Field>
                </CardAction>
                <CardFooter className='flex justify-center hover:text-cyan-700 '>
                  <CardDescription>Manage Login Connections  </CardDescription>
                  <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
                  </svg>
                  </span>
                </CardFooter>

              </Card>
            </div>
            <div className='col-span-6  px-4 lg:px-6 text-2xl font-semibold '>
              <h1 className="text-2xl font-medium  p-6 text-black/70 font-sans">Manage Project Repos</h1>
              <Card className='flex flex-col gap-4 p-4'>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fruits</SelectLabel>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button variant={`default`} className='w-32'>Add Repository</Button>
              </Card>

              


            </div>

          </div>
        </div>



      </SidebarInset>
    </SidebarProvider>
  )
}
