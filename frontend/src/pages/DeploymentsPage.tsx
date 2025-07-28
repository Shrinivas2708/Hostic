import { useEffect } from "react";
import { useDeploy } from "../hooks/useDeploy";
import DeploymentsCard from "../components/DeploymentsCard";
import type {  Deployments } from "../store/deployStore";
import { Input } from "../components/ui/input";

import rocket from "../assets/rocket.svg";



export default function DeploymentsPage() {
 const {deployments ,fetchDeployments} = useDeploy()
 useEffect(()=>{
  fetchDeployments()
   // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 console.log(deployments)
  return (
    <div className=" flex flex-col gap-5">
      <p className="text-5xl font-bold text-center mt-10">Deployments</p>
      <div className="flex justify-center items-center ">
        <Input placeholder="Enter github url" className="w-[250px]"/>
        <div className=" flex justify-center items-center w-[50px] h-[50px]">
          <img src={rocket} alt="" className="cursor-pointer" />
        </div>
      </div>
      <div className=" md:px-10 grid  lg:grid-cols-3 md:grid-cols-2 grid-cols-1  ">
        {deployments.map((v : Deployments)=>{
          return <DeploymentsCard  data={v} key={v._id}   />
        })}
      </div>
    </div>
  );
}
