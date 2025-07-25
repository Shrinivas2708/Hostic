// import { Button } from '@heroui/react';
import lightSvg from "../assets/light.svg";
import { ContainerScroll } from "../components/ui/container-scroll-animation";
import { Cover } from "../components/ui/cover";
import video from "/6548176-hd_1920_1080_24fps.mp4";
import github from "/github.svg"
import build from "/settings.svg"
import docker from "/docker-icon.svg"
import s3 from "/amazon-s3.svg"
import deploy from "/rocket.png"
// import redeploy from "/cdn.svg";
import redeploy from "/refresh.svg";
import StepCard from "../components/Card";
const steps = [
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
const Landing = () => {
  return (
    <>
      <div className="relative min-h-screen  text-white overflow-hidden">
        {/* Main Content */}

        <ContainerScroll
          titleComponent={
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 gap-5">
              <h1 className="text-center text-6xl md:text-6xl font-bold leading-tight">
                <span className="bg-[radial-gradient(ellipse_at_center,_#ffffff_30%,_#c5dcff_85%)] bg-clip-text text-transparent">
                  Deploy your Frontend
                  <br />
                  <Cover>Faster</Cover> than ever
                </span>
              </h1>

              <p className="text-[#AFBCD5] max-w-xl mb-4 text-lg">
                Build, preview, and ship modern frontend apps with lightning
                speed. Just push your code and let us handle the rest.
              </p>
              <div className="px-6 py-3 rounded-full bg-[#246BFD] text-white font-semibold shadow-[0_0_20px_rgba(36,107,253,0.4)] hover:shadow-[0_0_25px_rgba(36,107,253,0.8)] transition duration-300 flex gap-3">
                <img src={lightSvg} alt="" />
                Get Started for Free
              </div>
            </div>
          }
        >
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover rounded-2xl"
          />
        </ContainerScroll>
      </div>
      <section className="max-w mx-auto px-4 py-24">
        <h2 className="md:text-6xl text-5xl font-bold text-center md:mb-12 text-white">
          How It <span className="text-[#246BFD]">Works!?</span>
        </h2>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1  p-14 gap-6   ">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={index + 1}
              title={step.title}
              desc={step.desc}
              img={step.img}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default Landing;
