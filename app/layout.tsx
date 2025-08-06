import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pill Counter',
  description: 'A website to count pills in an image using OpenCV.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="/opencv.js"
          type="text/javascript"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
