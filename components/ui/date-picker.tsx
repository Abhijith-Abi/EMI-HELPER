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
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    id,
}: DatePickerProps) {
    const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

    return (
        <Popover>
            <PopoverTrigger
                id={id}
                className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    !value && "text-muted-foreground",
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
