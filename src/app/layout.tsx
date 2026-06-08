import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MS Choudhary Travels - Premium Gangoh ↔ Delhi Cab & Bus Service",
  description: "Book your seat with MS Choudhary Travels. Premium Maruti Suzuki Ertiga fleet & Luxury Coach bus. Daily intercity service between Gangoh and Delhi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased bg-white overflow-x-hidden`}>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        {children}
      </body>
    </html>
  );
}
