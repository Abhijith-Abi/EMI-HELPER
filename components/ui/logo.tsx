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
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 blur-[8px] rounded-full" />
                
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10 drop-shadow-[0_2px_8px_rgba(99,102,241,0.18)] hover:scale-105 transition-transform duration-300"
                >
                    <defs>
                        <linearGradient id="logo-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" /> {/* Purple */}
                            <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
                            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
                        </linearGradient>
                        <linearGradient id="logo-arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo */}
                            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
                        </linearGradient>
                    </defs>
                    
                    {/* Glassmorphic backdrop element inside the logo */}
                    <circle cx="50" cy="50" r="42" fill="rgba(255, 255, 255, 0.12)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" />
                    
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
                        "font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white",
                        textSize
                    )}
                >
                    Cash <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">ERP</span>
                </span>
            )}
        </div>
    );
}
