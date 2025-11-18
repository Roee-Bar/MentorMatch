import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-12 text-center">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-5 leading-tight">
            Find Your Perfect Project Supervisor
          </h1>
          
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Connect with experienced supervisors, browse project topics, and streamline your capstone project matching process.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-9 py-4 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-bold text-base shadow-[0_4px_6px_rgba(37,99,235,0.2)] transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(37,99,235,0.3)]"
            >
              Sign Up as Student
            </Link>
            
            <Link
              href="/login"
              className="px-9 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg cursor-pointer font-bold text-base transition-all duration-200 hover:bg-blue-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

