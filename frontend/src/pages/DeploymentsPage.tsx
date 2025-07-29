import { useEffect, useState } from "react";
import { useDeploy } from "../hooks/useDeploy";
import DeploymentsCard from "../components/DeploymentsCard";
import type { Deployments } from "../store/deployStore";
import { Input } from "../components/ui/input";
import rocket from "../assets/rocket.svg";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

export default function DeploymentsPage() {
  const { deployments, fetchDeployments } = useDeploy();
  const [url, setUrl] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [clicked, setClicked] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateUrl(value: string) {
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(value.trim());
  }

  function handleInput(val: string) {
    setClicked(false);
    setUrl(val);
    setIsValid(true); // remove error instantly when typing again
  }

  function handleNavigate() {
    const valid = validateUrl(url);
    setClicked(true);
    setIsValid(valid);

    if (valid) {
      navigate(`/deploy?url=${encodeURIComponent(url)}`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-5xl font-bold text-center mt-10">Deployments</p>

      <div className="flex flex-col justify-center items-center gap-2">
        <div className="flex justify-center items-center">
          <Input
            placeholder="Enter GitHub repo URL"
            className={clsx(
              "w-[250px] transition-all duration-200",
              clicked && !isValid && "border-red-500 border"
            )}
            onChange={(e) => handleInput(e.target.value)}
            value={url}
          />
          <div className="flex justify-center items-center w-[50px] h-[50px]">
            <img
              src={rocket}
              alt="Deploy"
              className="cursor-pointer"
              onClick={handleNavigate}
            />
          </div>
        </div>
        {clicked && !isValid && (
          <p className="text-red-500 text-sm mt-1">
            Please enter a valid GitHub repo URL (e.g., https://github.com/user/repo)
          </p>
        )}
      </div>
{deployments.length === 0 ? <div className="text-center">No deployments</div> :<div className="px-4 md:px-10 grid gap-4 "
     style={{
       display: "grid",
       gridTemplateColumns: "repeat(auto-fit, minmax(384px, 1fr))",
     }}>
        { deployments.map((v: Deployments) => (
          <DeploymentsCard data={v} key={v._id} />
        ))}
      </div>}
      
    </div>
  );
}
