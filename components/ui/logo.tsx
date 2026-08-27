import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    iconSize?: number;
    showText?: boolean;
    textSize?: string;
    variant?: "default" | "light" | "dark";
}

export function Logo({
    iconSize = 32,
    showText = false,
    textSize = "text-xl",
    variant = "default",
    className,
    ...props
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5 select-none", className)} {...props}>
            <div
                className="relative flex items-center justify-center shrink-0"
                style={{ width: iconSize, height: iconSize }}
            >
                {/* Visual Glassmorphic Aura behind the icon */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 blur-[10px] rounded-full" />
                
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10 drop-shadow-[0_2px_12px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform duration-300"
                >
                    <defs>
                        <linearGradient id="logo-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" /> {/* Purple */}
                            <stop offset="50%" stopColor="#818cf8" /> {/* Indigo */}
                            <stop offset="100%" stopColor="#22d3ee" /> {/* Cyan */}
                        </linearGradient>
                        <linearGradient id="logo-arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
                            <stop offset="100%" stopColor="#38bdf8" /> {/* Sky */}
                        </linearGradient>
                    </defs>
                    
                    {/* Glassmorphic backdrop element inside the logo */}
                    <circle cx="50" cy="50" r="42" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
                    
                    {/* The sleek modern "C" container path */}
                    <path
                        d="M72 32C67 22 56 16 43 16C24 16 10 31 10 50C10 69 24 84 43 84C56 84 67 78 72 68"
                        stroke="url(#logo-c-grad)"
                        strokeWidth="11"
                        strokeLinecap="round"
                    />
                    
                    {/* The rising financial trend line passing through and pointing up-right */}
                    <path
                        d="M30 56L46 40L58 52L83 23"
                        stroke="url(#logo-arrow-grad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* The dynamic arrow tip pointing up-right */}
                    <path
                        d="M71 23H83V35"
                        stroke="url(#logo-arrow-grad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {showText && (
                <span
                    className={cn(
                        "font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-white",
                        textSize
                    )}
                >
                    Cash <span className="text-indigo-400 font-extrabold drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">ERP</span>
                </span>
            )}
        </div>
    );
}
