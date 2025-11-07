import { GalleryVerticalEnd } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import axios from "axios"
 

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OTPForm({ className, ...props }: React.ComponentProps<"div">) {
const [timeResend, setTimeResend] = useState<number>(10);
const [otp , setOtp] = useState('')
const [isUpdate, setIsUpdate]  = useState<boolean>(true)
const [email, setEmail] = useState<string | null>('')
const [username, setUsername] = useState<string>('')
const [password, setPassword] = useState<string>('')
  useEffect(()=> {
 ResendTime()
  setEmail(window.localStorage.getItem('sign-email'))

},[])

 
const ResendTime = async() => {
     
      for(let i = 10 ; i >= 0; i--){
         await new Promise(resolve => setTimeout(resolve, 2000));
         setTimeResend(i)
      }
  

  }
  
const Resend  =  async() => {
    const email = window.localStorage.getItem('signup-email')
    if(!email){ 
      window.location.href='/signup'
    }
    const response = await axios.post('http://localhost:5000/user/Signup', { 
      email: email,
    })
    if(response.status === 200){ 
      console.log("OTP Sent Successfully")
      window.localStorage.setItem('signup-email', email as string);
     
    }
}

const VerifyOTP = async() => {
  if(otp.length < 6){ 
    return
  } 
  const email = window.localStorage.getItem('signup-email')
  if(!email){ 
    window.location.href='/signup'
  }
  const response = await axios.post('http://localhost:5000/user/verify-otp', { 
    otp: otp, 
    email: email    
  })
  if(response.data.status === 'success'){ 
    setIsUpdate(true)
  }
} 


const signup = async() => {
  if(!email || !username || !password) {
    alert('Information not found')
    return;
  }
  if(password.length < 6){ 
    alert('Password  not < 6 keyword')
  }
  const response = await axios.post('http://localhost:5000/sign-up', {
    email: email,
    username: username, 
    password: password
  })
  if(response.data.signup === 'success'){ 
    alert("Sign Up SuccessFully!")
    window.location.href='/login'
  }
}


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {isUpdate === false ? <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Enter verification code</h1>
            <FieldDescription>
              We sent a 6-digit code to your email address
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <InputOTP
              maxLength={6}
              id="otp"
              required
              containerClassName="gap-4"
              value={otp} 
              onChange={setOtp}
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription className="text-center">
              Didn&apos;t receive the code?  {timeResend <=   0 ?  <a href="#" onClick={Resend} >Send</a> :  <a href="#" >Resend {timeResend}</a>}
            </FieldDescription>
          </Field>
          <Field>
            <Button onClick={VerifyOTP} type="button">Verify {otp.length}</Button>
          </Field>
        </FieldGroup>
      </form>:  <Dialog>
      <form>
        <DialogTrigger asChild className='w-full flex justify-center'>  
          <Button >Update Infomation</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Email</Label>
              <Input  disabled id="name-1" name="name" defaultValue={`${email}`} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input value={username} onChange={(e) => {setUsername(e.target.value)}} id="username-1" name="username" defaultValue="@peduarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Password</Label>
              <Input  value={password} onChange={(e)=>{setPassword(e.target.value)}} id="username-1" name="password" defaultValue="******" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={signup} type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>}
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>


      
    </div>
  )
}
 

