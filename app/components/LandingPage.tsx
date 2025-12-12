import Link from 'next/link'
import { btnPrimary, btnSecondary } from '@/lib/styles/shared-styles';

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-12 text-center dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-form mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-5 leading-tight text-balance dark:text-slate-100">
            Find Your Perfect Project Supervisor
          </h1>
          
          <p className="text-xl text-gray-500 mb-10 leading-relaxed text-balance dark:text-slate-400">
            Connect with experienced supervisors, browse project topics, and streamline your capstone project matching process.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className={`${btnPrimary} px-9 py-4 shadow-button hover:shadow-button-hover hover:-translate-y-0.5`}
            >
              Sign Up as Student
            </Link>
            
            <Link
              href="/login"
              className={`${btnSecondary} px-9 py-4`}
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
