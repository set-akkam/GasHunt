/**
 * AnimatedBox Component
 * 
 * A reusable animated box component that demonstrates Framer Motion animations
 * with TypeScript integration. Uses the fadeIn animation variant for a smooth
 * entrance effect.
 */

// components/AnimatedBox.tsx
import { motion } from "framer-motion";
import { fadeIn } from "../animations/variants";

/**
 * A React functional component that renders an animated box with a fade-in effect.
 * 
 * @returns {JSX.Element} A motion.div element with fade-in animation
 */
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
