/* eslint-disable @next/next/no-html-link-for-pages */
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white">CourseMaster</h2>
          <p className="mt-3 text-sm text-gray-400">
            Your gateway to modern learning.  
            Learn skills, grow faster, achieve more.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="/components/courses" className="hover:text-white">Courses</a></li>
            <li><a href="/components/login" className="hover:text-white">Student Login</a></li>
            <li><a href="/components/login/admin" className="hover:text-white">Admin Login</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Stay Updated</h3>
          <p className="text-sm text-gray-400 mb-3">Subscribe for new courses & offers.</p>

          <div className="flex items-center">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-3 py-2 rounded-l-md bg-gray-800 text-gray-200 outline-none"
            />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700">
              Subscribe
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Line */}
      <div className="border-t border-gray-700 mt-10 pt-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} CourseMaster — All rights reserved.
      </div>
    </footer>
  );
}
