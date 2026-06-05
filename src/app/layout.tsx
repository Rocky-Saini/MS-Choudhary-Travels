import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MS Choudhary Travels - Premium Gangoh ↔ Delhi Cab & Bus Service",
  description: "Book your seat with MS Choudhary Travels. Premium Maruti Suzuki Ertiga fleet & Luxury Coach bus. Daily intercity service between Gangoh and Delhi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className={`${poppins.className} antialiased bg-white`}>
        {children}
      </body>
    </html>
  );
}
