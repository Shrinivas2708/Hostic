interface StepCardSVGProps {
  step: number;
  title: string;
  desc: string;
  img: string;
}

const StepCard = ({ step, title, desc, img }: StepCardSVGProps) => {
  return (
    <>
     <div className="flex items-center gap-3 border border-[#31425F] rounded-3xl md:py-6 p-5 justify-center relative" >
      <span className="absolute top-3 left-5 flex justify-center items-center w-5 h-5 rounded-full bg-[#246BFD] ">{step}</span>
        <img
          src={img}
          alt={title}
          style={{
            
            borderRadius: "6px",
            objectFit: "contain",
         
          }}
          className = "text-white md:w-[60px] md:h-[60px] w-[50px]  h-[50px]"
        />
        <div className="flex flex-col gap-2 ">
          <h4 className="md:text-lg text-basic font-semibold ">
            {title}
          </h4>
          <p
          
            className="text-[#AFBCD5] max-w-xl text-xs"
          >
            {desc}
          </p>
        </div>
      </div>
    </>
  );
};

export default StepCard;
