const social = [
  {
    name: "Github",
    link: "https://github.com/Shrinivas2708",
    icon: ""
  },
  {
    name: "LinkedIn",
    link: "https://www.linkedin.com/in/shrinivas-sherikar-a77980231/",
    icon: ""
  },
  {
    name: "Twitter",
    link: "https://twitter.com/Shrinivas2708",
    icon: ""
  },
  {
    name: "Gmail",
    link: "mailto:ssherikar2005@gmail.com",
    icon: ""
  },
  {
    name: "Instagram",
    link: "https://www.instagram.com/itzzz_shriii/",
    icon: ""
  }
];

function Footer() {
  return (
    <div className="p-5 border-t text-center text-[#666666] border-white/10 flex items-center justify-evenly md:flex-row flex-col">
      Made with {"<3"} by Shri
      <div className="flex justify-center items-center gap-4 mt-3">
        {social.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#666666] hover:text-[#246BFD] transition-colors duration-300"
          >
            <img
              src={`/icons/${item.name.toLowerCase()}.svg`}
              alt={item.name}
              className="w-6 h-6 grayscale hover:grayscale-0 transition-all duration-300"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export default Footer;
