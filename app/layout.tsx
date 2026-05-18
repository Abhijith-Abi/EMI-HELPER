import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Cash ERP | Personal Finance Dashboard",
    description: "Modern full-stack Personal Finance ERP Web Application",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Cash ERP",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} font-sans min-h-screen flex flex-col antialiased`}
                suppressHydrationWarning
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    forcedTheme="light"
                    disableTransitionOnChange
                >
                    <PWARegister />
                    {children}
                    <Toaster position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
