import React, { useState } from 'react'

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

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'


import { addServer } from '@/api/backend'

import BasicFlow from './Flow/Flow'
import { DataAddServer } from '@/api/insertface'
export default function ManageServers() {
  const [serverAddress, setServerAddress] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'sshkey'>('password');
  const [showPasswordField, setShowPasswordField] = useState('');
  const [sshPrimaryKey, setSshPrimaryKey] = useState<File | undefined>(undefined);
  const [serverName, setServerName] = useState('');



  const RequestAddServer = async () => {
    const serverData: DataAddServer = {
      ipAddress: serverAddress,
      port: port,
      username: username,
      authMethod: authMethod,
      password: showPasswordField,
      sshKey: sshPrimaryKey ? await sshPrimaryKey.text() : '',
      serverName: serverName

    }

    const response = await addServer(serverData);
    if (response.status === 'success') {
      alert('Server added successfully!');
    } else {
      alert('Failed to add server: ' + response.message);
    }





  }


  return (

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


          {/* Main content area add server form */}
          <div className='flex flex-col md:flex-row p-4     gap-4 py-4 md:gap-6 md:py-6 border-b-slate-400/30 w-full h-auto'>

            {/* Left here */}
            <div className='w-full md:w-1/2   bg-white rounded-lg shadow-md border border-slate-200 '>
              <div className='grid grid-cols-12 gap-4 py-4 md:gap-6 md:py-6 w-full justify-center'>
                <div className='col-span-6 px-4 lg:px-6 text-2xl font-semibol'>
                  <h1 className="text-2xl font-medium  p-6 text-black/70 font-sans"> ADD SERVER/VPS</h1>
                </div>
              </div>
              <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6 w-full justify-center px-4 lg:px-6 '>
                <div className="grid w-full max-w-sm items-center gap-3">
                  <Label htmlFor="email"> Cluster Server *
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IP  Server - Example : 192.168.1.1</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} type="text" id="serverAddress" placeholder="192.168.1.1" />
                </div>


                <div className="grid w-full max-w-sm items-center gap-3">
                  {/* Server IP/Hostname */}
                  <Label htmlFor="serverAddress">
                    Server Address
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IP or hostname of the VPS - Example: 192.168.1.1 or vps.example.com</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} id="serverAddress" type="text" placeholder="192.168.1.1" />

                  {/* Port */}
                  <Label htmlFor="port">
                    Port
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Connection port - Default SSH: 22</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={port} onChange={(e) => setPort(Number(e.target.value))} id="port" type="number" placeholder="22" />

                  {/* Username */}
                  <Label htmlFor="username">
                    Username
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Username to login - Example: root, admin, ubuntu</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} id="username" type="text" placeholder="root" />

                  {/* Authentication Method */}
                  <Label htmlFor="authMethod">
                    Authentication Method
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Authentication method: Password or SSH Key</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select onValueChange={(value: 'password' | 'sshkey') => setAuthMethod(value)} value={authMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="sshkey">SSH Key</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Password (displayed when password is selected) */}
                  <Label htmlFor="password">
                    Password
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Password to login to the VPS</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={showPasswordField} onChange={(e) => setShowPasswordField(e.target.value)} id="password" type="password" placeholder="Enter password" />

                  {/* SSH Private Key (displayed when sshkey is selected) */}
                  <Label htmlFor="sshKey">
                    SSH Private Key
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>File private key to authenticate SSH (.pem or .key)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input onChange={(e) => setSshPrimaryKey(e.target.files ? e.target.files[0] : undefined)} id="sshKey" type="file" accept=".pem,.key" />

                  {/* Server Name (optional) */}
                  <Label htmlFor="serverName">
                    Server Name (Optional)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Display name for the server - Example: Production Server, Staging VPS</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input value={serverName} onChange={(e) => setServerName(e.target.value)} id="serverName" type="text" placeholder="Production Server" />




                  <Button onClick={RequestAddServer} type="button" className="mt-4 w-full">Add Server</Button>
                </div>



              </div>
            </div>


            {/* Right here */}
            <div className='w-full md:w-1/2 min-h-64   bg-white rounded-lg shadow-md border border-slate-200 '>

              <BasicFlow />


            </div>


          </div>
        </div>



      </SidebarInset>
    </SidebarProvider>
  )
}
