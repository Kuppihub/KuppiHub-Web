
import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="bg-gradient-href-r from-blue-300 via-purple-200 href-blue-00 text-gray-800 max-h-1/6">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          {/* Logo and Description */}
          <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <svg
                className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                Kuppi <span className="text-blue-600">Hub</span>
              </span>
            </Link>
          </div>
            <p className="text-sm text-gray-900 mt-1">Your trusted educational platform 🤝</p>
          </div>

        
         {/* Quick Links */}
<div className="flex flex-wrap justify-center gap-4 text-sm pr-4">
  <Link
    href="/"
    className="border border-white px-3 py-1 rounded hover:text-blue-400 hover:border-blue-400 transform hover:scale-105 transition duration-200"
  >
    Home
  </Link>
  {/* <Link
    href="/subjects"
    className="border border-white px-3 py-1 rounded hover:text-blue-400 hover:border-blue-400 transform hover:scale-105 transition duration-200"
  >
    Subjects
  </Link> */}
  <Link
    href="/about"
    className="border border-white px-3 py-1 rounded hover:text-blue-400 hover:border-blue-400 transform hover:scale-105 transition duration-200"
  >
    About
  </Link>
  <Link
    href="/contact"
    className="border border-white px-3 py-1 rounded hover:text-blue-400 hover:border-blue-400 transform hover:scale-105 transition duration-200"
  >
    Contact
  </Link>

    <Link
    href="/faq"
    className="border border-white px-3 py-1 rounded hover:text-blue-400 hover:border-blue-400 transform hover:scale-105 transition duration-200"
  >
    FAQ
  </Link>
  
</div>

        </div>

        {/* Social Media */}
        <div className="flex justify-center mt-4 gap-6">
          <a href="https://www.facebook.com/profile.php?id=61574212569091" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-300 transition">
            <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07c0 4.99 3.66 9.13 8.44 9.88v-7h-2.54v-2.88h2.54v-2.2c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.57v1.85h2.8l-.45 2.88h-2.35v7C18.34 21.2 22 17.06 22 12.07z" />
            </svg>
          </a>
      <a
  href="https://github.com/kuppihub"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="GitHub"
  className="hover:text-gray-700 transition"
>
  <svg
    fill="currentColor"
    className="w-5 h-5"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.112.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.76-1.604-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.235-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0112 5.797c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.243 2.874.119 3.176.77.84 1.233 1.912 1.233 3.222 0 4.61-2.807 5.624-5.48 5.92.43.37.815 1.096.815 2.21 0 1.595-.015 2.878-.015 3.269 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0z" />
  </svg>
</a>

          <a href="https://www.linkedin.com/company/cse-23/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-blue-300 transition">
            <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.2c-.97 0-1.5-.66-1.5-1.48 0-.83.54-1.49 1.53-1.49.98 0 1.5.66 1.5 1.49 0 .82-.52 1.48-1.5 1.48zm13.5 10.2h-3v-4.7c0-1.18-.42-1.99-1.47-1.99-.8 0-1.28.54-1.49 1.07-.08.19-.1.46-.1.73v4.89h-3s.04-7.94 0-9h3v1.28c.4-.62 1.11-1.51 2.7-1.51 1.97 0 3.45 1.29 3.45 4.06v5.17z" />
            </svg>
          </a>
          </div>

        {/* Copyright */}
        <div className="border-t mt-6 pt-4 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CSE 23. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}