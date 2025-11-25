import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            MentorMatch
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="btn-primary px-4 py-2"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-12 text-center">
        <div className="max-w-form mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-5 leading-tight">
            Find Your Perfect Project Supervisor
          </h1>
          
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Connect with experienced supervisors, browse project topics, and streamline your capstone project matching process.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="btn-primary px-9 py-4 shadow-button hover:shadow-button-hover hover:-translate-y-0.5"
            >
              Sign Up as Student
            </Link>
            
            <Link
              href="/login"
              className="btn-secondary px-9 py-4"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            © 2024 MentorMatch. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Braude College of Engineering
          </p>
        </div>
      </footer>
    </div>
  )
}

