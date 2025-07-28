import { useNavigate } from "react-router-dom";
import type {  Deployments } from "../store/deployStore";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";

function DeploymentsCard({ data  }: { data: Deployments }) {
 
  const navigate = useNavigate()
  return (
    <div onClick={()=> navigate(`/deployments/${data._id}`)}>
      <CardContainer  >
      <CardBody>
        <CardItem as={"div"} className="border p-5 border-[#31425F] rounded-xl cursor-pointer  w-full flex flex-col" >
          <CardItem as={"div"} className="w-[100%]" translateZ="100">
            <img
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className=" h-[200px] w-full object-cover border rounded-xl border-white/10 mb-5 bg-white/10"
              alt=""
            />
          </CardItem>
          <CardItem as={"div"}>
            <CardItem as="p" translateZ="60" className="text-base ">
              <CardItem
                as={"span"}
                translateZ="60"
                className="text-lg text-[#918f8f]"
              >
                Website name:{" "}
              </CardItem>
              {data.slug}
            </CardItem>
          </CardItem>
        </CardItem>
      </CardBody>
    </CardContainer>
    </div>
  );
}

export default DeploymentsCard;
/*<p className="text-base ">
          <span className="text-lg text-[#918f8f]">Github repo: </span>
          <a href={data.repo_url} target="_blank">{data.repo_url.split("/")[4]}</a>
        </p>
        <p className="text-base ">
          <span className="text-lg text-[#918f8f]">Deployment branch: </span>
          {data.branch}
        </p>
        <p className="text-base ">
          <span className="text-lg text-[#918f8f]">Project type: </span>
          {data.projectType}
        </p>
        <p className="text-base ">
          <span className="text-lg text-[#918f8f]">Install commands: </span>
          {data.installCommands}
        </p>
        <p className="text-base ">
          <span className="text-lg text-[#918f8f]">Build command: </span>
          {data.buildCommands}
        </p>
        <p className="text-base ">
          <span className="text-lg text-[#918f8f]">Deployed on: </span>
          {formatDate(data.createdAt)}
        </p>
      </div>
      <div className=" py-3 flex justify-end gap-3">
         <span className="p-2 border-white border w-[100px] text-center rounded-lg hover:bg-white cursor-pointer text-sm transition duration-300 text-white hover:text-black" onClick={()=> window.open(`${data.slug}.apps.shriii.xyz`)}>
          Visit
        </span>
        <span className="p-2 border-[#246BFD] border w-[100px] text-center rounded-lg hover:bg-[#246BFD] cursor-pointer text-sm transition duration-300 text-[#246BFD] hover:text-white">
          Update
        </span>
        <span className="p-2 border-red-500 border w-[100px] text-center rounded-lg hover:bg-red-500 cursor-pointer text-sm transition duration-300 text-red-500 hover:text-white">
          Delete
        </span>
*/
