import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * ScrollReveal — itx.vn-inspired scroll-triggered animation wrapper
 * Uses Framer Motion useInView for performant intersection observer
 */

const directionVariants = {
  up: {
    hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
  },
  down: {
    hidden: { opacity: 0, y: -30, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
  },
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }
};

const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  once = true,
  className = '',
  threshold = 0.15,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const variants = directionVariants[direction] || directionVariants.up;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScrollRevealGroup — Stagger children with scroll trigger
 */
export const ScrollRevealGroup = ({
  children,
  staggerDelay = 0.08,
  className = '',
  threshold = 0.1,
  once = true,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.05
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScrollRevealItem = ({
  children,
  direction = 'up',
  className = '',
  ...props
}) => {
  const variants = directionVariants[direction] || directionVariants.up;

  return (
    <motion.div
      variants={{
        hidden: variants.hidden,
        visible: {
          ...variants.visible,
          transition: {
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1]
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
