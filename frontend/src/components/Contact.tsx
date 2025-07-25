import { Phone } from "lucide-react";

function Contact() {
  return (
    <div className="border mx-4 md:mx-10 p-6 md:p-10 rounded-2xl my-24 border-[#1E293B] bg-[#0F172A]">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* Left Section */}
        <div className="flex flex-col gap-4 md:w-1/2">
          <div className="w-fit rounded-lg border border-[#1E293B] p-2 bg-[#1E293B]">
            <Phone className="h-10 w-10 text-[#246BFD]" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl md:text-5xl font-semibold text-white">
              Contact Us
            </h3>
            <p className="text-sm md:text-base text-[#AFBCD5]">
              Have questions or need support? Reach out to us anytime.
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <form className="flex flex-col gap-4 md:w-1/2">
          <input
            type="text"
            placeholder="Your Name"
            className="bg-[#1E293B] text-white placeholder-[#94A3B8] border border-[#334155] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className="bg-[#1E293B] text-white placeholder-[#94A3B8] border border-[#334155] px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
          ></textarea>
          <button
            type="submit"
            className=" w-fit"
          >
           <div className="px-6 py-3 rounded-full bg-[#246BFD] text-white font-semibold shadow-[0_0_20px_rgba(36,107,253,0.4)] hover:shadow-[0_0_25px_rgba(36,107,253,0.8)] transition duration-300 flex gap-3">
            Send Message
           </div>
            
          </button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
