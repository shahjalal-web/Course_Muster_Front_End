import "./globals.css";
import Navbar from "./components/navber/page";
import Providers from "./providers";
import Footer from "./components/footer/page";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="max-w-[1500px] mx-auto">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
