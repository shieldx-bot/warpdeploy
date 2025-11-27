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


import {

  HardDriveUpload,
  ArrowUpDown,
  Globe,
  Cpu,
  Download,
  CreditCard,
  Zap,
  Timer,
  MemoryStick,
  SquareActivity,


} from "lucide-react"
import {
  Command,

  CommandGroup,

  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"

import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';


export default function Dashboard() {
  const [hasGetAccess, setHasGetAccess] = useState(false)
  const query_String = window.location.search;
  const url_Params = new URLSearchParams(query_String);
  const code = url_Params.get('code');
 
  const [sk, setSk] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const [roomIDs, setRoomID] = useState<string>('D100')
  useEffect(() => {
   
    const socket = io("http://localhost:8080")
    socket.on("connect", () => {

      setSk(socket)
      if (socket.connected) {
        
        console.log("connnect socket io success ")
        // Join room after connection is established
        socket.emit('join_room', roomIDs)
       } else {
        console.log("Lỗi không tể kết nối server room")
      }
    })
    // Extra diagnostics
    socket.on('connect_error', (err) => {
      console.error('socket connect_error:', err)
    })
    socket.on('error', (err) => {
      console.error('socket error:', err)
    })
    socket.on('message', (msg :string) => { 
      console.log(msg)
    }  )

    socket.on('send_metrix', (data)=>  {
      console.log("data send_metrix :", data)
    })
      
    socket.emit('get_metrix', {
      hostname: 'ec2-52-195-194-9.ap-northeast-1.compute.amazonaws.com',
      username: 'ubuntu',
      roomID: roomIDs
    }, (ack: unknown) => {
      console.log('ack get_metrix:', ack)
    })
    
    

    return () => {
      socket.disconnect();
    }

  }, [])









  const realtime = () => {
    alert("Hello")
    sk?.emit('get_metrix', {
      hostname: 'ec2-13-230-222-83.ap-northeast-1.compute.amazonaws.com',
      username: 'ubuntu'
    })
    sk?.emit('metrix_data', (data: unknown) => {
      console.log("data: ", data)
    })
  }
  useEffect(() => {

    if (!code) {

      return;
    }
    const fetchAccessToken = async () => {
      if (hasGetAccess) {
        return;
      }
      setHasGetAccess(true);
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
              <div className='px-4 lg:px-6'>
                <Command className="rounded-lg border shadow-md md:min-w-[450px]">
                  <CommandList>
                    <CommandGroup heading="Usage ">
                      <CommandItem>
                        <ArrowUpDown />
                        <span onClick={realtime}>Fast Data Transfer</span>
                        <CommandShortcut>0 / 100GB</CommandShortcut>
                      </CommandItem>
                      <CommandItem>
                        <HardDriveUpload />
                        <span>Fast Origin Transfer</span>
                        <CommandShortcut>0 / 10GB</CommandShortcut>
                      </CommandItem>
                      <CommandItem>
                        <Globe />
                        <span>Edge Requests</span>
                        <CommandShortcut>0 / 1M</CommandShortcut>
                      </CommandItem>

                      <CommandItem>
                        <Cpu />
                        <span>Edge Request CPU Duration</span>
                        <CommandShortcut>0 / 1h</CommandShortcut>
                      </CommandItem>

                      <CommandItem>
                        <Download />
                        <span>ISR Reads</span>
                        <CommandShortcut>0 / 1M</CommandShortcut>
                      </CommandItem>



                      <CommandItem>
                        <CreditCard />
                        <span>ISR Writes</span>
                        <CommandShortcut>0 / 200k</CommandShortcut>
                      </CommandItem>



                      <CommandItem>
                        <Zap />
                        <span>Function Invocations</span>
                        <CommandShortcut>0 / 1M</CommandShortcut>
                      </CommandItem>


                      <CommandItem>
                        <Timer />
                        <span>Function Duration</span>
                        <CommandShortcut>0 / 100GB-Hrs</CommandShortcut>
                      </CommandItem>

                      <CommandItem>
                        <MemoryStick />
                        <span>Fluid Provisioned Memory</span>
                        <CommandShortcut>0 / 300GB-Hrs</CommandShortcut>
                      </CommandItem>

                      <CommandItem>
                        <SquareActivity />
                        <span>Fluid Active CPU</span>
                        <CommandShortcut>0 / 4h</CommandShortcut>
                      </CommandItem>



                    </CommandGroup>
                  </CommandList>
                </Command>

              </div>
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
