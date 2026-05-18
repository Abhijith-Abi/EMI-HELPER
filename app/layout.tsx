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
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Cash ERP",
    },
    openGraph: {
        title: "Cash ERP | Personal Finance Dashboard",
        description: "Modern full-stack Personal Finance ERP Web Application",
        siteName: "Cash ERP",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Cash ERP - Personal Finance Dashboard",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Cash ERP | Personal Finance Dashboard",
        description: "Modern full-stack Personal Finance ERP Web Application",
        images: ["/og-image.png"],
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
