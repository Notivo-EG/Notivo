import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { GenerationProvider } from "@/context/GenerationContext";
import { ActivityIndicator } from "@/components/ui/ActivityIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notiva | AI Academic Architect",
  description: "Don't just take notes. Engineer your degree. AI-powered academic planning that adapts when life happens.",
  keywords: ["study planner", "academic architect", "AI learning", "course planning", "exam preparation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PreferencesProvider>
          <GenerationProvider>
            <div className="flex">
              <Navbar />
              <main className="flex-1 min-h-screen">{children}</main>
              <ActivityIndicator />
            </div>
          </GenerationProvider>
        </PreferencesProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
                }
              };
            `,
          }}
        />
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      </body>
    </html>
  );
}
