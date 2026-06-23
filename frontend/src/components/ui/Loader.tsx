import { motion, easeInOut } from "motion/react";

export const Loader = () => {
  const transition = (x: number) => ({
    duration: 1,
    repeat: Infinity,
    repeatType: "loop" as const,
    delay: x * 0.2,
    ease: easeInOut,
  });

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ y: 0 }}
          animate={{ y: [0, 6, 0] }}
          transition={transition(i)}
          className="h-1.5 w-1.5 rounded-full bg-brand"
        />
      ))}
    </div>
  );
};
