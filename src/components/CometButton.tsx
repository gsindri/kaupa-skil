import React from 'react';
import { motion } from 'framer-motion';

interface CometButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CometButton: React.FC<CometButtonProps> = ({ children, className = "", onClick }) => {
    return (
        <div className={`relative group inline-block ${className}`}>
            {/* 1. The Container for the Text */}
            <button
                onClick={onClick}
                className="relative z-10 px-8 py-3 bg-white rounded-full font-serif font-semibold text-lg text-stone-900 border border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
            >
                {children}
            </button>

            {/* 2. The Comet Track (Absolute SVG overlay) */}
            <div className="absolute inset-0 -m-[2px] rounded-full pointer-events-none overflow-visible">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* rx="50" makes it a pill shape (50% of height).
              pathLength="1" allows us to use percentages (0 to 1) for the dashes 
           */}
                    <motion.rect
                        x="0" y="0" width="100" height="100" rx="50"
                        fill="none"
                        strokeWidth="3" // Thickness of the comet
                        stroke="#10B981" // Deilda Green (Tailwind emerald-500)
                        strokeLinecap="round"

                        // The Magic Sauce:
                        pathLength={1}
                        initial={{ pathOffset: 0 }}
                        animate={{ pathOffset: 1 }}
                        transition={{
                            duration: 2,
                            ease: "linear",
                            repeat: Infinity
                        }}

                        // Dasharray: First number is length of comet (0.25 = 25%), second is the gap (1 = 100%)
                        style={{ strokeDasharray: "0.25 1" }}
                    />

                    {/* Optional: Add a subtle glow blur behind the comet */}
                    <motion.rect
                        x="0" y="0" width="100" height="100" rx="50"
                        fill="none"
                        strokeWidth="6"
                        stroke="#10B981"
                        strokeOpacity="0.3"
                        strokeLinecap="round"
                        pathLength={1}
                        initial={{ pathOffset: 0 }}
                        animate={{ pathOffset: 1 }}
                        transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                        style={{ strokeDasharray: "0.25 1", filter: "blur(4px)" }}
                    />
                </svg>
            </div>
        </div>
    );
};
