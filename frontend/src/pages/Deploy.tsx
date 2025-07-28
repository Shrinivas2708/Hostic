import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeploy } from '../hooks/useDeploy';

function Deploy() {
    const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const { createDeployment,deployed} = useDeploy()
  // const navigate = useNavigate()
  console.log(deployed)
  const data = {
    repo_url : url!,
    project_type: "vite",
    buildCommands:"npm run build",
    installCommands:"npm i"
  }
  
  return (
    <div>
      <p>{url}</p>
    <button onClick={
      ()=>{
        createDeployment(data)
        
      }
    }>Deploy</button>
    </div>
  )
}

export default Deploy