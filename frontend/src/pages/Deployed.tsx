import  { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { BackgroundLines } from "../components/ui/background-lines";
import {Spinner} from "@heroui/spinner";
function Deployed() {
  const { id } = useParams();
  const { getImg, deploy_img, loading, deployment, fetchDeployment } =
    useDeploy();
  useEffect(() => {
    if (!id) return;
    getImg(id);
    fetchDeployment(id);
  }, [id]);
  
  console.log(deployment);
  return (
    <div >
      <BackgroundLines>
       
          <div className="flex flex-col justify-center items-center border border-white/10 rounded-lg space-y-3 md:p-5 p-3 relative z-10 hover:cursor-pointer" onClick={()=>{
            // window.open(`http://${deployment?.slug}.localhost:8080`)
            window.open(`https://${deployment?.slug}.apps.shriii.xyz`)
          }}>
            {loading ? <Spinner color="default" /> : <img
              src={deploy_img!}
              alt=""
              className=" lg:w-[500px] lg:h-[300px] rounded-md "
            />}
            
            <div className="text-xs md:text-base">
              <p >
                Website successfully published at{" "}
                <a
                  // href={`http://${deployment?.slug}.localhost:8080`}
                  href={`https://${deployment?.slug}.apps.shriii.xyz`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-500 "
                >
                  {deployment?.slug}
                </a>
              </p>
            </div>
          </div>
     
      </BackgroundLines>
    </div>
  );
}

export default Deployed;
