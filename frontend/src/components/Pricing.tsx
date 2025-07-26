import { BackgroundGradient } from "./ui/background-gradient";

interface PricingProps {
  title: string;
  price: string;
  features: string[];
  best: boolean;
}

const pricingData: PricingProps[] = [
  {
    title: "Free Plan",
    price: "Free",
    features: ["3 hosting/user", "SSL", "CDN"],
    best: false,
  },
  {
    title: "Basic Plan",
    price: "$10/month",
    features: ["3 hosting/user", "SSL", "CDN", "Custom Domains", "10GB Storage"],
    best: false,
  },
  {
    title: "Pro Plan",
    price: "$20/month",
    features: [
      "3 hosting/user",
      "SSL",
      "CDN",
      "Custom Domains",
      "10GB Storage",
      "Priority Support",
      "Advanced Analytics",
    ],
    best: true,
  },
];

function Pricing() {
  return (
    <div className="md:p-10">
      <div className="md:text-6xl text-5xl font-bold text-center mb-10 text-white">
        Pricing
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6 md:px-10 px-5 py-5">
        {pricingData.map((d, i) => {
          const CardContent = (
            <div className="border border-[#1E293B] rounded-3xl flex flex-col gap-4 bg-[#040B10] p-6 h-full">
              <div className="text-3xl font-bold text-white">{d.title}</div>
              <span className="text-2xl font-semibold text-[#246BFD]">{d.price}</span>
              <ul className="text-white list-inside list-decimal space-y-2">
                {d.features.map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
            </div>
          );

          return (
            <div key={i} className="h-full">
              {d.best ? (
                <BackgroundGradient className="h-full">{CardContent}</BackgroundGradient>
              ) : (
                CardContent
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;
