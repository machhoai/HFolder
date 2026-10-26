import type { Metadata } from "next";
import { I18nProvider } from "@/i18n/provider";
import "@/styles/globals.css";
// Import each @apply stylesheet directly so Turbopack tracks edits even when
// a failed Tailwind compilation cannot report its nested CSS dependencies.
import "@/styles/base.css";
import "@/styles/components.css";

export const metadata: Metadata = {
  title: "HFolder",
  description: "Local project and folder workspace",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi-VN">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
