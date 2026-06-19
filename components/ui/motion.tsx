"use client";

import { HTMLMotionProps, motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";

// ----------------------------------------------------------------------
// Section Reveal
// ----------------------------------------------------------------------
export const SectionReveal = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SectionReveal.displayName = "SectionReveal";

// ----------------------------------------------------------------------
// Stagger Container & Item
// ----------------------------------------------------------------------
export const StaggerContainer = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// ----------------------------------------------------------------------
// Subtle Hover & Interactions
// ----------------------------------------------------------------------
export const SubtleButton = forwardRef<HTMLButtonElement, HTMLMotionProps<"button">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
SubtleButton.displayName = "SubtleButton";

export const SubtleButtonLink = forwardRef<HTMLAnchorElement, HTMLMotionProps<"a">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.a
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {children}
      </motion.a>
    );
  }
);
SubtleButtonLink.displayName = "SubtleButtonLink";

export const CardHover = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
CardHover.displayName = "CardHover";

export const UpdateItemHover = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { x: 4 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
UpdateItemHover.displayName = "UpdateItemHover";

// ----------------------------------------------------------------------
// Generic FadeIn (e.g. ASCII preview)
// ----------------------------------------------------------------------
export const FadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";
