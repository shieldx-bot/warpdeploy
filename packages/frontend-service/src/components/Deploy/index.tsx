import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios';
import { AppSidebar } from "@/components/app-sidebar"


 
/*
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6"></div>
          </div>
*/
import { io, Socket } from 'socket.io-client';
 

 
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardAction, CardDescription, CardFooter, CardHeader } from "../ui/card"
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
import { Input } from "@/components/ui/input"
type LogLevel = 'ALL' | 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN'
interface LogItem {
  id: string
  ts: string
  level: Exclude<LogLevel, 'ALL'>
  message: string
}

interface Repo {
  name: string
  full_name: string
  html_url: string
}
interface GitlabRepo {
  name: string
  path_with_namespace: string
  web_url: string
}

export default function Deploy() {
  const [hasGetAccess, setHasGetAccess] = useState(false)
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoDeploy, setRepoDeploy] = useState<Repo | null>(null)

  const [logs, setLogs] = useState<LogItem[]>([
    { id: '1', ts: '[17:23:14]', level: 'INFO', message: 'Nội dung log sẽ hiển thị ở đây. ' },
    { id: '2', ts: '[17:23:15]', level: 'SUCCESS', message: 'Thao tác thành công.' },
    { id: '3', ts: '[17:23:16]', level: 'ERROR', message: 'Có lỗi xảy ra.' },
    
  ])
  const [filter, setFilter] = useState<LogLevel>('ALL')
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logListRef = useRef<HTMLUListElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const deploy   =  async() => { 
     if(repoDeploy == null){ 
      return;
     }
     const response = await axios.post('http://localhost:3002/deploy-orchestrator', { 
      owner: repoDeploy.name,
      repo: repoDeploy.full_name, 
      cloneUrl: repoDeploy.html_url
     })
     if(response.status == 200){
       alert("Deploy success ");
      }
     

  }

  const levelStyles = (level: Exclude<LogLevel, 'ALL'>) => {
    switch (level) {
      case 'SUCCESS':
        return { li: 'bg-green-500/10 text-green-500 border-green-500', icon: 'text-green-400', label: 'SUCCESS' } as const
      case 'ERROR':
        return { li: 'bg-red-500/10 text-red-500 border-red-500', icon: 'text-red-400', label: 'ERROR' } as const
      case 'WARN':
        return { li: 'bg-yellow-500/10 text-yellow-500 border-yellow-500', icon: 'text-yellow-400', label: 'WARN' } as const
      case 'INFO':
      default:
        return { li: 'bg-blue-500/10 text-blue-500 border-blue-500', icon: 'text-blue-400', label: 'INFO' } as const
    }
  }

  const filteredLogs = logs.filter((l) => {
    const passLevel = filter === 'ALL' ? true : l.level === filter
    const passQuery = query.trim() ? `${l.ts} ${l.level} ${l.message}`.toLowerCase().includes(query.trim().toLowerCase()) : true
    return passLevel && passQuery
  })

  useEffect(() => {
    const s = io('http://localhost:8080', { withCredentials: true })
    socketRef.current = s

    // Optionally test a greeting once connected
    s.emit('chat message', 'Hello from frontend!')

    const handleChat = (msg: string) => {
      alert('Message from orchestrator: ' + msg)
    }
    // Ensure event names match server: "chat message"
    s.on('chat message', handleChat)

    return () => {
      s.off('chat message', handleChat)
      s.disconnect()
      socketRef.current = null
    }
  }, [])


  const testSocket = () => {
    alert("Testing socket connection to orchestrator")
    socketRef.current?.emit('chat message', 'Hello from frontend test function!')
  }

  useEffect(() => {
    if (!logListRef.current || !autoScroll) return
    logListRef.current.scrollTop = logListRef.current.scrollHeight
  }, [logs.length, autoScroll])

  useEffect(() => {
    setRepos([
      { name: 'repo1', full_name: 'user/repo1', html_url: 'https://github.com/shieldx-bot/backend_exemple.git' },
      { name: 'repo2', full_name: 'user/repo2', html_url: '' },
      { name: 'repo3', full_name: 'user/repo3', html_url: '' },
    ])
    return () => {
      window.localStorage.removeItem('login_provider')
    }
  }, [])

  const query_String = window.location.search
  const url_Params = new URLSearchParams(query_String)
  const code = url_Params.get('code')
  useEffect(() => {
    const login = window.localStorage.getItem('login_provider')
    if (!login) return

    if (login === 'gitlab') {
      if (!code || hasGetAccess) return
      setHasGetAccess(true)
      ;(async () => {
        try {
          const response = await axios.post('http://localhost:5000/gitlab/get_access_token', { code })
          if (response.data.status === 'success') {
            const access_token = response.data.data.access_token
            const get_repos = await axios.get('http://localhost:5000/gitlab/get_repositories', {
              headers: { Authorization: `Bearer ${access_token}` },
            })
            const fetchedRepos: Repo[] = get_repos.data.map((repo: GitlabRepo) => ({
              name: repo.name,
              full_name: repo.path_with_namespace,
              html_url: repo.web_url,
            }))
            setRepos((prev) => [...prev, ...fetchedRepos])
            localStorage.setItem('repos_lab', JSON.stringify(get_repos.data))
          }
        } catch (error) {
          console.error('Error fetching GitLab access token:', error)
        } finally {
          window.history.replaceState({}, document.title, '/import-repos')
        }
      })()
    }

    if (login === 'github') {
      if (!code || hasGetAccess) return
      setHasGetAccess(true)
      ;(async () => {
        try {
          const response = await axios.post('http://localhost:5000/github/get_access_token', { code })
          if (response.data.status === 'success') {
            localStorage.setItem('access_token', response.data.access_token)
            localStorage.setItem('repos', JSON.stringify(response.data.dataRepo))
            const fetchedRepos: Repo[] = response.data.dataRepo.map((repo: Repo) => ({
              name: repo.name,
              full_name: repo.full_name,
              html_url: repo.html_url,
            }))
            setRepos((prev) => [...prev, ...fetchedRepos])
          }
        } catch (error) {
          console.error('Error fetching GitHub access token:', error)
        } finally {
          window.history.replaceState({}, document.title, '/import-repos')
        }
      })()
    }
  }, [code, hasGetAccess])

  const clearLogs = () => setLogs([])

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6" />
          </div>

          <div className="grid grid-cols-12 gap-4 py-4 md:gap-6 md:py-6 w-full justify-center">
            <div className="col-span-12 md:col-span-6 px-4 lg:px-6 text-2xl font-semibol">
              <h1 className="text-2xl font-medium p-6 text-black/70 font-sans">Logs Deployment</h1>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardDescription className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                      </span>
                      <span className="text-gray-400">Live deployment logs</span>
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block">
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search logs..."
                          className="h-8 w-56    text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.target.checked)}
                          className="accent-emerald-500"
                        />
                        Auto scroll
                      </label>
                      
                    </div>
                  </div>
                  <Button className="h-8" onClick={clearLogs}>
                        Clear
                      </Button>
                </CardHeader>
                <CardAction className="mt-4 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'] as LogLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setFilter(lvl)}
                        className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
                          filter === lvl ? 'bg-gray-800 text-white' : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800/80'
                        }`}
                        title={lvl}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <ul
                    ref={logListRef}
                    className="rounded-lg p-4 h-96 overflow-y-auto space-y-2    border-gray-900 shadow-inner"
                  >
                    {filteredLogs.map((log) => {
                      const s = levelStyles(log.level)
                      return (
                        <li key={log.id} className={`flex items-start gap-3 p-3 rounded-md border-l-4 ${s.li} animate-appear`}>
                          <span className={`shrink-0 ${s.icon}`}>
                            {log.level === 'SUCCESS' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path
                                  fillRule="evenodd"
                                  d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm3.53 7.28a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 1 1 1.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 0 1 1.06 0Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {log.level === 'ERROR' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path
                                  fillRule="evenodd"
                                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3.28 6.97a.75.75 0 0 1 0 1.06L13.06 12l2.22 2.22a.75.75 0 1 1-1.06 1.06L12 13.06l-2.22 2.22a.75.75 0 1 1-1.06-1.06L10.94 12 8.72 9.78a.75.75 0 1 1 1.06-1.06L12 10.94l2.22-2.22a.75.75 0 0 1 1.06 0Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {log.level === 'WARN' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                              </svg>
                            )}
                            {log.level === 'INFO' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.25 11.25l.041-.02a.75.75 0 0 1 .668 0l.041.02m-.75 0v3m0-6h.008v.008H11.25V8.25Zm10.5 3.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            )}
                          </span>

                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-mono text-gray-900 text-xs">{log.ts}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                              {levelStyles(log.level).label}
                            </span>
                            <span className=" text-sm break-words">{log.message}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </CardAction>
                <CardFooter className="flex justify-center hover:text-cyan-700 ">
                  <CardDescription onClick={testSocket}>Manage Login Connections</CardDescription>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
                      />
                    </svg>
                  </span>
                </CardFooter>
              </Card>
            </div>

            <div className="col-span-12 md:col-span-6 px-4 lg:px-6 text-2xl font-semibold ">
              <h1 className="text-2xl font-medium p-6 text-black/70 font-sans">Manage Project Repos</h1>
              <Card className="flex flex-col gap-4 p-4">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Choose & Deploy</SelectLabel>
                      {repos.map((repo) => (
                        <SelectItem onClick={() => setRepoDeploy(repo)} key={repo.full_name} value={repo.full_name}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button variant={`default`} onClick={deploy} className="w-32">
                  Deploy Repository
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
 

