"use client";
import type { Variants } from "motion/react";

const EASE_OUT_EMPHASIZED = [0.16, 1, 0.3, 1] as const;

/** Single element fade-up. Apple-cadence — fast, brief, intentional. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT_EMPHASIZED },
  },
};

/** Container that staggers its children's entrance. Wrap the children
 *  in `<motion.div variants={fadeUp}>` for them to participate. */
export const staggerChildren = (delayBetween = 0.06): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: delayBetween,
      delayChildren: 0.04,
    },
  },
});

/** Hero card entrance — slightly larger displacement, slower duration. */
export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: EASE_OUT_EMPHASIZED },
  },
};
