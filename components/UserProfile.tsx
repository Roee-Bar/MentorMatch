import { User } from '@/types/user';

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'supervisor':
        return 'Supervisor';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'supervisor':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section with Background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
        
        {/* Profile Content */}
        <div className="relative px-6 pb-8">
          {/* Profile Image */}
          <div className="flex justify-center -mt-16 mb-4">
            <div className="relative">
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>

          {/* User Name and Role */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {user.name}
            </h2>
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>

          {/* Information Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Student ID Card - Only for students */}
            {user.studentId && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M21 10H3M21 6H3M21 14H3M21 18H3"></path>
                      <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Student ID</p>
                    <p className="text-lg font-semibold text-gray-900">{user.studentId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Card */}
            <div className={`bg-gray-50 rounded-lg p-6 border border-gray-200 ${!user.studentId && !user.department ? 'md:col-span-2' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-blue-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 font-medium">Email Address</p>
                  <p className="text-lg font-semibold text-gray-900 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Department Card - For supervisors/admins */}
            {user.department && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Department</p>
                    <p className="text-lg font-semibold text-gray-900">{user.department}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Degree Card - Only for students */}
            {user.degree && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Degree Program</p>
                    <p className="text-lg font-semibold text-gray-900">{user.degree}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Expertise Card - For supervisors */}
            {user.expertise && user.expertise.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 md:col-span-2">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-2">Areas of Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {user.expertise.map((area, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

