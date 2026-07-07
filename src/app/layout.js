import "./globals.css";

export const metadata = {
  title: "e-Faktur Scanner",
  description: "Scanner QR e-Faktur berbasis web",
  manifest: "/efs/manifest.json",
  icons: {
    icon: "/efs/icon.svg",
    apple: "/efs/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
