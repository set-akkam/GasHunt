// components/AnimatedBox.tsx
import { motion } from "framer-motion";
import { fadeIn } from "../animations/variants";

const AnimatedBox: React.FC = () => {
  return (
    <motion.div
      className="bg-blue-500 p-6 rounded-lg text-white"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-xl font-bold">Hello, Framer Motion with TypeScript!</h1>
    </motion.div>
  );
};

export default AnimatedBox;
