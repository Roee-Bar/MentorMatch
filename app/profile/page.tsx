//import UserProfile from '@/components/UserProfile';
import { User } from '@/types/user';
import Link from 'next/link';

export default function ProfilePage() {
  // Mock user data - In a real application, this would come from authentication
  // and would be dynamically loaded based on the logged-in user
  const currentUser: User = {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@student.braude.ac.il',
    role: 'student',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    studentId: 'STU-2024-001',
    degree: 'B.Sc. in Software Engineering',
  };

  // Example of other user types that could be loaded:
  // 
  // Supervisor example:
  // const currentUser: User = {
  //   id: '2',
  //   name: 'Dr. Michael Cohen',
  //   email: 'michael.cohen@braude.ac.il',
  //   role: 'supervisor',
  //   profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  //   department: 'Software Engineering',
  //   expertise: ['Machine Learning', 'Computer Vision', 'Deep Learning', 'AI Systems'],
  // };
  //
  // Admin example:
  // const currentUser: User = {
  //   id: '3',
  //   name: 'Prof. David Miller',
  //   email: 'david.miller@braude.ac.il',
  //   role: 'admin',
  //   profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  //   department: 'Administration',
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <svg 
                  className="w-10 h-10 text-blue-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h1 className="text-3xl font-bold text-gray-900">MentorMatch</h1>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <span className="text-blue-600 font-medium">Profile</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">My Profile</span>
        </div>
      </div>

      {/* Main Content
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Profile</h2>
          <p className="text-gray-600">View your personal information and account details</p>
        </div>

        <UserProfile user={currentUser} />
      </main> */}

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            MentorMatch - Braude College of Engineering © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

