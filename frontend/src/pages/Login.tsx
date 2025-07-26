
import { useNavigate } from "react-router-dom"
import { BottomGradient } from "../components/BottomGradient"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"


function Login() {
  const navigate = useNavigate()
  return (
    <div className=" p-10 max-h-screen flex justify-center items-center flex-col ">
      <div className=" p-10 text-5xl font-bold  flex flex-col gap-3 w-[400px] border rounded-3xl border-[#262626] ">
        
       <span className="text-center mb-5"> Login</span>
        <Label htmlFor="firstname">User name</Label>
        <Input id="firstname" placeholder="User" type="text" />
        <Label htmlFor="password">Password</Label>
        <Input id="password" placeholder="••••••••" type="password" />
        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br   font-medium text-white bg-zinc-800 from-zinc-900 to-zinc-900 shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] text-base mt-4"
          type="submit"
         
        >
          Log in &rarr;
          <BottomGradient />
        </button>
        <span className="text-xs font-light text-center mt-3">Don't have an account? <span className=" underline hover:text-[#246BFD] cursor-pointer" onClick={()=>{
          navigate("/signup")

        }}>Signin</span> </span>
      </div>
    </div>
  )
}


export default Login