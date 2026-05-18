"use client"

import { useId } from "react"
import { motion, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number // size of the icon in pixels
  animate?: boolean
}

export function Logo({ className, showText = true, size = 36, animate = true }: LogoProps) {
  const reactId = useId()
  const id = reactId.replace(/:/g, "")

  // Needle hover animation config
  const needleVariants: Variants = {
    rest: { rotate: 45, transition: { type: "spring", stiffness: 200, damping: 10 } },
    hover: { 
      rotate: [45, 60, 30, 45], 
      transition: { 
        duration: 1.2, 
        ease: "easeInOut",
        times: [0, 0.3, 0.7, 1],
        repeat: 0
      } 
    }
  }

  return (
    <motion.div 
      className={cn("flex items-center gap-3 select-none", className)}
      initial="rest"
      whileHover={animate ? "hover" : "rest"}
    >
      {/* 🧭 Compass Logo SVG Icon */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          {/* Ring Gradient - Indigo to Violet */}
          <linearGradient id={`${id}-ringGradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
            <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet-500 */}
          </linearGradient>

          {/* Right Needle Gradient - Solid Dark Purple */}
          <linearGradient id={`${id}-needleRight`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo-600 */}
            <stop offset="100%" stopColor="#7c3aed" /> {/* Violet-600 */}
          </linearGradient>

          {/* Left Needle Gradient - Metallic Light Purple */}
          <linearGradient id={`${id}-needleLeft`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" /> {/* Violet-300 */}
            <stop offset="100%" stopColor="#c084fc" /> {/* Violet-400 */}
          </linearGradient>

          {/* Center Orange Pivot Gradient */}
          <linearGradient id={`${id}-pivotGradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" /> {/* Orange-400 */}
            <stop offset="100%" stopColor="#ea580c" /> {/* Orange-600 */}
          </linearGradient>
        </defs>

        {/* 1. Outer Ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          stroke={`url(#${id}-ringGradient)`} 
          strokeWidth="3" 
          fill="none" 
        />

        {/* 2. Middle Ring (Dashed Arc style) */}
        <circle 
          cx="50" 
          cy="50" 
          r="30" 
          stroke={`url(#${id}-ringGradient)`} 
          strokeWidth="4" 
          strokeDasharray="18 6" 
          fill="none" 
          opacity="0.85"
        />

        {/* 3. Inner Ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="20" 
          stroke={`url(#${id}-ringGradient)`} 
          strokeWidth="1.5" 
          fill="none" 
          opacity="0.7"
        />

        {/* 4. Crosshairs / Axes */}
        {/* Horizontal Line with Tapered Ends */}
        <line x1="14" y1="50" x2="86" y2="50" stroke={`url(#${id}-ringGradient)`} strokeWidth="2" strokeLinecap="round" />
        <polygon points="10,50 16,47 18,50 16,53" fill={`url(#${id}-ringGradient)`} />
        <polygon points="90,50 84,47 82,50 84,53" fill={`url(#${id}-ringGradient)`} />

        {/* Vertical Line with Tapered Ends */}
        <line x1="50" y1="14" x2="50" y2="86" stroke={`url(#${id}-ringGradient)`} strokeWidth="2" strokeLinecap="round" />
        <polygon points="50,10 47,16 50,18 53,16" fill={`url(#${id}-ringGradient)`} />
        <polygon points="50,90 47,84 50,82 53,84" fill={`url(#${id}-ringGradient)`} />

        {/* 5. Tilted Compass Needle (Animated Group) */}
        <motion.g 
          style={{ transformOrigin: "50px 50px" }}
          variants={needleVariants}
        >
          {/* Left Taper (Silver/Light Purple) */}
          <polygon 
            points="50,16 43,50 50,84" 
            fill={`url(#${id}-needleLeft)`} 
          />
          {/* Right Taper (Vibrant Indigo/Violet) */}
          <polygon 
            points="50,16 57,50 50,84" 
            fill={`url(#${id}-needleRight)`} 
          />
        </motion.g>

        {/* 6. Orange Highlight Pivot Center */}
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill={`url(#${id}-pivotGradient)`} 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="3" 
          fill="#ffffff" 
          opacity="0.9"
        />
      </svg>

      {/* 📝 Brand Text Layout */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline leading-none">
            <span className="font-extrabold text-[21px] tracking-tight text-slate-900">
              MY
            </span>
            <span className="font-extrabold text-[21px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Goals
            </span>
          </div>
          <span className="text-[9.5px] font-medium tracking-normal text-slate-500 uppercase mt-0.5 whitespace-nowrap">
            Goal Setting & Tracking Portal
          </span>
        </div>
      )}
    </motion.div>
  )
}
