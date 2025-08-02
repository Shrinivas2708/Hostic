// src/store/deployStore.ts
import { create } from 'zustand';
import axios from '../lib/axios';
export type Deployments = {
  _id : string;
  slug : string;
  img_url:string
}
export enum BuildStatus {
  Queued = "queued",
  Building = "building",
  Failed = "failed",
  Success = "success",
}
export type Deployed = {
   deployment_id: string,
      build_id: string,
      build_name: string,
      slug:string,
      status: BuildStatus.Queued,
}
export type Deployment = {
  _id: string;
  slug: string;
  repo_url: string;
  branch: string;
  projectType: string;
  buildCommands?: string;
  installCommands?:string
  createdAt: string;
  current_build_id: string;
  img_url:string
};

export type Data = {
  repo_url: string;
      project_type: string;
      buildCommands: string;
      installCommands: string;
      buildDir:string
}
export type Build = {
  _id: string;
  build_name: string;
  status: string;
  artifact_path?: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  deployment_id: string;
};
type Redeployed = {
  deployment_id: string,
      build_name: string,
      status: BuildStatus.Queued,
}
type DeployStore = {
  deployments: Deployments[];
  builds: Build[];
  selectedDeployment: Deployment | null;
  deployment: Deployment | null;
  build: Build | null;
  deployed : Deployed | null ;
  redeployed : Redeployed | null;
  deploy_img : string | null;
  fetchDeployments: () => Promise<void>;
  fetchBuilds: (deployment_id: string) => Promise<void>;
  selectDeployment: (d: Deployment) => void;
  createDeployment: (data: Data) => Promise<Deployed>;
  redeploy: (slug: string) => Promise<Redeployed>;
  deleteDeployment: (slug: string) => Promise<void>;
  fetchDeployment: (deployment_id: string) => Promise<void>;
  fetchBuild : (slug:string) => Promise<void>;
  getImg:(deployment_id:string) => Promise<void>;
};

export const useDeployStore = create<DeployStore>((set) => ({
  deployments: [],
  builds: [],
  selectedDeployment: null,
  deployment : null ,
  build : null,
  deployed : null,
  redeployed:null,
  deploy_img:null,
  getImg: async (deployment_id:string)=>{
    const res = await axios.post(`/host/getimg`,{deployment_id});
    set({deploy_img:res.data.url})
  },
  fetchDeployments: async () => {
    const res = await axios.get('/host/');
    set({ deployments: res.data.deployments });
  }, 
fetchDeployment: async (deployment_id: string) => {
  const res = await axios.get(`/host/deployment?deployment_id=${deployment_id}`);
   if (!res.data.deployment) throw new Error("Deployment not found");
  set({ deployment: res.data.deployment });
},
  fetchBuilds: async (deployment_id) => {
    const res = await axios.get(`/host/builds?deployment_id=${deployment_id}`);
    set({ builds: res.data.builds });
  },
  fetchBuild: async (build_name : string) => {
    const res = await axios.get(`/host/build?build_name=${build_name}`)
    set({build : res.data.build})
  },
  selectDeployment: (deployment) => {
    set({ selectedDeployment: deployment });
  },

  createDeployment: async (data) => {
    console.log(data)
  const res = await axios.post("/host/", data);
  set({ deployed: res.data }); // you were probably doing this already
  return res.data as Deployed; // ← this is the key fix!
},

  redeploy: async (deployment_id) => {
  const res = await axios.post('/host/redeploy', { deployment_id });
  set({redeployed : res.data})
  return res.data as Redeployed;
},


  deleteDeployment: async (deployment_id: string) => {
  await axios.delete('/host/delete', {
    data: { deployment_id },
  });
  set((state) => ({
    deployments: state.deployments.filter((d) => d._id !== deployment_id),
  }));
}

}));
