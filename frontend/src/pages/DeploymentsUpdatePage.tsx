import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { formatDate } from "../exports";
const statusStyles: Record<string, string> = {
  queued: " text-yellow-300 border border-yellow-300",
  building: "text-blue-300 border border-blue-300",
  failed: " text-red-500 border border-red-500",
  success: " text-green-300 border border-green-300",
};

export default function DeploymentDetailsPage() {
  const { id } = useParams();
  const { fetchDeployment, fetchBuilds, deployment, builds, error, loading , redeploy} =
    useDeploy();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) {
      fetchDeployment(id);
      fetchBuilds(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const currentBuildName = builds.find(
    (v) => v._id === deployment?.current_build_id
  );
  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-10">
        <div className="text-red-500 text-center mt-10">
          Error: while fetching blogs
        </div>
        <span
          className="p-2 border-[#246BFD] border w-[100px] text-center rounded-lg hover:bg-[#246BFD] cursor-pointer text-sm transition duration-300 text-[#246BFD] hover:text-white "
          onClick={() => navigate("/deployments")}
        >
          Go back
        </span>
      </div>
    );
  }

  if (!deployment)
    return <div className="text-center mt-10">Deployment not found.</div>;

  return (
    <div className=" py-5  flex justify-evenly md:flex-row flex-col">
      <div className=" flex flex-col gap-3 p-3 text-lg font-medium">
        <p className="text-xl text-center font-bold ">{deployment.slug}</p>
        <p>
          <span className=" text-[#918f8f]">Github repo: </span>
          <a href={deployment.repo_url} target="_blank">
            {deployment.repo_url.split("/")[4]}
          </a>
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">Deployment branch: </span>
          {deployment.branch}
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">Project type: </span>
          {deployment.projectType}
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">Install commands: </span>
          {deployment.installCommands}
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">Build command: </span>
          {deployment.buildCommands}
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">
            Current successful build:{" "}
          </span>
          {currentBuildName?.build_name}
        </p>
        <p>
          <span className="text-lg text-[#918f8f]">Deployed on: </span>
          {formatDate(deployment.createdAt)}
        </p>
        <div className="py-3 flex gap-3  items-center ">
          <span
            className="p-2 border-white border w-[100px] text-center rounded-lg hover:bg-white cursor-pointer text-sm transition duration-300 text-white hover:text-black"
            onClick={() => window.open(`http://${deployment.slug}.localhost:8080`)}
          >
            Visit
          </span>
          <span className="p-2 border-[#246BFD] border w-[100px] text-center rounded-lg hover:bg-[#246BFD] cursor-pointer text-sm transition duration-300 text-[#246BFD] hover:text-white">
            Update
          </span>
          <span className="p-2 border-red-500 border w-[100px] text-center rounded-lg hover:bg-red-500 cursor-pointer text-sm transition duration-300 text-red-500 hover:text-white">
            Delete
          </span>
        </div>
        <div className=" py-3 pr-10">
             <p
            className="p-2  w-full text-center rounded-lg  cursor-pointer text-sm transition duration-300 text-white bg-[#246BFD]"
            onClick={() => redeploy(deployment._id)}
          >
            Re-deploy
          </p>
        </div>
      </div>

      <div >
        <h2 className="text-3xl font-semibold mt-6">Builds</h2>
        {builds.length === 0 ? (
          <p>No builds found.</p>
        ) : (
          <ul className="mt-2 space-y-2  ">
            {builds.reverse().map((build) => (
              <li key={build._id} className="cursor-pointer" onClick={()=>{
                navigate(`/deployments/${deployment._id}/${build.build_name}`)
              }}>
                <div className="p-4 rounded-lg border border-white/10 ">
                  <div className="flex items-center gap-2">
                    <strong>{build.build_name}</strong>
                    <span
                      className={`text-xs px-2 py-1 rounded-full capitalize ${
                        statusStyles[build.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {build.status}
                    </span>
                  </div>
                  <p>
                    Started: {formatDate(build.startedAt!) || "N/A"} | Finished:{" "}
                    {formatDate(build.finishedAt!) || "N/A"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
