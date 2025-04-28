/**
 * Animation Variants Module
 * Defines reusable Framer Motion animation configurations for consistent
 * animations throughout the application.
 */

/**
 * Fade in animation from top to bottom
 * Used for dropdown menus and notifications
 * @param delay Optional delay before animation starts
 */
export const fadeInFromTop = {
  hidden: { opacity: 0, y: -20 },  // Initial state: invisible and above final position
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: delay,
    },
  }),
};

/**
 * Fade in animation from bottom to top
 * Used for content sections and cards
 * Features custom easing for smooth motion
 * @param custom Optional delay multiplier for staggered animations
 */
export const fadeInFromBottom = {
  hidden: { opacity: 0, y: 20 },  // Initial state: invisible and below final position
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: custom,
      ease: [0.22, 1, 0.36, 1],  // Custom easing curve for natural motion
    },
  }),
};

/**
 * Simple fade in animation
 * Used for overlays and background elements
 */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * Container animation for staggered children
 * Used to coordinate multiple animated elements
 * Children animate sequentially with 0.1s delay between each
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // Delay between each child animation
    },
  },
};

/**
 * Navbar-specific stagger container
 * Coordinates navigation items with 0.2s delay between each
 * Total animation duration: 1.2s (0.2s * 6 items)
 */
export const navbarStaggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0,      // Start immediately
      staggerChildren: 0.2,  // Delay between each navigation item
    },
  },
};

/**
 * Landing page stagger container
 * Coordinates content sections after navbar animation completes
 * Starts after navbar animation (1.2s delay) to create smooth sequence
 */
export const landingStaggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 1.2,    // Wait for navbar animation to complete
      staggerChildren: 0.2,  // Delay between each content section
    },
  },
}; 