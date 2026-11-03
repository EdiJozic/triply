import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triply — Travel smarter. Experience more.",
  description: "Your entire trip, thoughtfully planned in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
