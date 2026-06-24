import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.97
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: delay * 0.1,
      ease: [0.23, 1, 0.32, 1]
    }
  })
};

const AnimatedCard = ({ children, delay = 0, className = '', onClick, ...props }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ 
        y: -4, 
        scale: 1.01,
        boxShadow: '0 16px 40px -12px rgba(59, 130, 246, 0.12)',
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.985 }}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
