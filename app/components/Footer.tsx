export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-12 py-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Three columns */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 mb-5">
          
          {/* Column 1: About */}
          <div>
            <h3 className="text-base font-bold mb-2.5 text-gray-800">
              MentorMatch
            </h3>
            <p className="text-sm text-gray-500 m-0">
              Streamlining the supervisor-student matching process for capstone projects.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-2.5 text-gray-800">
              Quick Links
            </h3>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <a href="/" className="text-sm text-blue-600 no-underline hover:underline">
                  Home
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-sm text-blue-600 no-underline hover:underline">
                  About
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-sm text-blue-600 no-underline hover:underline">
                  Help
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-base font-bold mb-2.5 text-gray-800">
              Contact
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-2">
              Braude College of Engineering
            </p>
            <p className="text-sm text-gray-500 m-0 mb-2">
              Snunit St 51, Karmiel
            </p>
            <p className="text-sm text-blue-600 m-0">
              support@mentormatch.ac.il
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-5 text-center">
          <p className="text-sm text-gray-500 m-0">
            © 2024 MentorMatch - Braude College of Engineering. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}