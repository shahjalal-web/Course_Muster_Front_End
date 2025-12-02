import "./globals.css";
import Navbar from "./components/navber/page";
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="max-w-[1500px] mx-auto">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
