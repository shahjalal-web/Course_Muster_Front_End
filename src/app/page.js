import AboutPage from "./components/about/page";
import ContactPage from "./components/contact/page";
import CoursesPageClient from "./components/courses/page";
import Hero from "./components/hero/page";


export default function Home() {
  return (
    <div>
      <Hero />
      <CoursesPageClient />
      <AboutPage />
      <ContactPage />
    </div>
  );
}
