import github from "/github.svg"
import build from "/settings.svg"
import docker from "/docker-icon.svg"
import s3 from "/amazon-s3.svg"
import deploy from "/rocket.png"
import redeploy from "/refresh.svg";
export const steps = [
  {
    title: "Paste GitHub Link",
    desc: "Connect your GitHub repo with a single click.",
    img: github,
  },
  {
    title: "Configure Build Settings",
    desc: "Set up build commands and pick your framework.",
    img: build
  },
  {
    title: "Spin Up Docker",
    desc: "Your code is containerized in a secure environment.",
    img: docker,
  },
 
  {
    title: "Store on AWS S3",
    desc: "Production files are stored safely on AWS.",
    img: s3,
  },
  {
    title: "Deploy to the World",
    desc: "Your app is deployed globally on our CDN.",
    img: deploy,
  },
  {
    title: "Redploy with Ease",
    desc: "Push updates to your repo and we handle the rest.",
    img: redeploy,
  }
 
];
export  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



