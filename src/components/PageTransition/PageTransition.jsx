import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — itx.vn-inspired smooth page transitions
 * Uses clipPath curtain reveal + blur + scale for premium feel
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: 'blur(6px)',
    scale: 0.99
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1],
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(3px)',
    scale: 0.995,
    transition: {
      duration: 0.25,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
