import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "GoRan OS",
  description: "AI-powered agency operating system"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
