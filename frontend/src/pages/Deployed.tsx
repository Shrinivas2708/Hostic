import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { BackgroundLines } from "../components/ui/background-lines";

function Deployed() {
  const { id } = useParams();
  const { getImg, deploy_img ,loading} = useDeploy();
  useEffect(() => {
    if (!id) return;
    getImg(id);
  }, [id]);

  return (
    <div>
     <BackgroundLines>
       {loading ? <div>Loading...</div>: <div className="flex justify-center items-center w-[500px] h-[500px]">
        <img src={deploy_img} alt="" />
        </div>}
     </BackgroundLines>
    </div>
  );
}

export default Deployed;
