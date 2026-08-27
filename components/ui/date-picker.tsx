"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value?: string;
    onChange: (date: string) => void;
    placeholder?: string;
    id?: string;
    className?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    id,
    className,
}: DatePickerProps) {
    const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

    return (
        <Popover>
            <PopoverTrigger
                id={id}
                className={cn(
                    "flex h-10 w-full items-center justify-start rounded-xl border border-white/10 bg-slate-900/60 px-3.5 text-xs text-white shadow-sm transition-all cursor-pointer hover:bg-slate-800/80 hover:border-indigo-500/40 whitespace-nowrap overflow-hidden focus:outline-none focus:ring-1 focus:ring-indigo-500/50",
                    !value && "text-slate-500",
                    className,
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-indigo-400" />
                <span className="truncate font-medium">
                    {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
                </span>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-2 bg-[#0c101d] border border-white/[0.12] rounded-2xl shadow-2xl z-50 text-white"
                align="start"
            >
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date) {
                            onChange(format(date, "yyyy-MM-dd"));
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
