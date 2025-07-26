// import { Button } from '@heroui/react';
import lightSvg from "../assets/light.svg";
import { ContainerScroll } from "../components/ui/container-scroll-animation";
import { Cover } from "../components/ui/cover";
import video from "/6548176-hd_1920_1080_24fps.mp4";
import StepCard from "../components/Card";
import { Features } from "../components/Feature";
import { steps } from "../exports";
import Contact from "../components/Contact";
import Pricing from "../components/Pricing";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const {token} = useAuthStore()
  const navigate = useNavigate()
  return (
    <>
      <div className="relative min-h-screen  text-white overflow-hidden">
        {/* Main Content */}

        <ContainerScroll
          titleComponent={
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 gap-5">
              <h1 className="text-center text-5xl md:text-6xl font-bold leading-tight">
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
              {token ? <div className="px-6 py-3 rounded-full bg-[#246BFD] text-white font-semibold shadow-[0_0_20px_rgba(36,107,253,0.4)] hover:shadow-[0_0_25px_rgba(36,107,253,0.8)] transition duration-300 flex gap-3 cursor-pointer" onClick={()=>navigate("/deploy")}>
                
                Start deploying
              </div>: <div className="px-6 py-3 rounded-full bg-[#246BFD] text-white font-semibold shadow-[0_0_20px_rgba(36,107,253,0.4)] hover:shadow-[0_0_25px_rgba(36,107,253,0.8)] transition duration-300 flex gap-3 cursor-pointer" onClick={()=>navigate("/dashboard")}>
                <img src={lightSvg} alt="" />
                Get Started for Free
              </div> }
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
      <section className="max-w mx-auto px-4 pt-24 pb-10">
        <h2 className="md:text-6xl text-5xl font-bold text-center md:mb-12 text-white">
          How It <span className="text-[#246BFD]">Works!?</span>
        </h2>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1  md:p-14 py-10 gap-6   ">
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
      <Features />
      <Pricing />
      <Contact />
      
    </>
  );
};





export default Landing;
