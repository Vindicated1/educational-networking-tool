import type { Metadata } from "next";
import { Lato } from "next/font/google";
import AppHeader from "@/components/app-header";
import "./globals.css";

const portalFont = Lato({
  variable: "--font-ui-portal",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "University of Ibadan Educational Networking Tool",
  description: "Academic networking, forum, project matching, and resource sharing for students and faculty.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${portalFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
