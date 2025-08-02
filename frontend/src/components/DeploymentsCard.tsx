import { useNavigate } from "react-router-dom";
import type {  Deployments } from "../store/deployStore";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";

function DeploymentsCard({ data }: { data: Deployments }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/deployments/${data._id}`)}
      className="w-full cursor-pointer"
    >
      <CardContainer>
        <CardBody className=" max-w-sm h-auto ">
          <CardItem
            as={"div"}
            className="border border-[#31425F] rounded-xl w-full flex flex-col "
          >
            <CardItem as={"div"} className="w-full" translateZ="100">
              <img
                src={data.img_url}
                className="h-[200px] w-full object-cover rounded-t-xl border-b text-center border-white/10"
                alt="No img found"
              />
            </CardItem>

            <CardItem as={"div"} className="p-4" translateZ="60">
              <p className="text-sm text-slate-400">Website name:</p>
              <p className="text-md font-semibold text-white break-words">
                {data.slug}
              </p>
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
