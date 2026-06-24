import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const StaggerContainer = ({ children, className = '', staggerDelay = 0.08, ...props }) => {
  return (
    <motion.div
      variants={{
        ...containerVariants,
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1
          }
        }
      }}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;
