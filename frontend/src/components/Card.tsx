interface StepCardProps {
  step: number;
  title: string;
  desc: string;
  img: string;
}

const StepCard = ({ step, title, desc, img }: StepCardProps) => {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-hairline bg-surface-card p-6">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-on-primary">
        {step}
      </div>
      <div className="flex gap-4">
        <img
          src={img}
          alt={title}
          className="h-10 w-10 shrink-0 object-contain opacity-80"
        />
        <div>
          <h4 className="text-base font-semibold text-on-dark">{title}</h4>
          <p className="mt-1 text-sm text-copy">{desc}</p>
        </div>
      </div>
    </div>
  );
};

export default StepCard;
