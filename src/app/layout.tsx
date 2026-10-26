import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "PropStackly CRM | Real Estate Lead & Property Management",
  description:
    "Modern Real Estate Lead Management & Property Inventory CRM for Pakistani Real Estate Agencies and Developers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/propstackly-logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/propstackly-logo.png",
  },
};

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('propstackly_theme') || localStorage.getItem('veltrivo_theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full bg-[#FAF8F5] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 dark:text-slate-100 bg-[#FAF8F5] dark:bg-[#0B0F19] font-sans transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
