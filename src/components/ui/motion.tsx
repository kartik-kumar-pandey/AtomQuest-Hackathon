"use client"

import { motion, useInView, type Variants } from "framer-motion"
import { useRef, type ReactNode } from "react"

const ease = [0.22, 1, 0.36, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  variant?: "fadeUp" | "fadeIn" | "scaleIn"
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: "-60px 0px -40px 0px" })
  const variants = variant === "fadeIn" ? fadeIn : variant === "scaleIn" ? scaleIn : fadeUp

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: variants.hidden,
        visible: {
          ...variants.visible,
          transition: {
            ...(typeof variants.visible === "object" && "transition" in variants.visible
              ? variants.visible.transition
              : {}),
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  )
}

export function PageEnter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
    </motion.div>
  )
}
