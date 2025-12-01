import Image from 'next/image';
import { User } from '@/types/database';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const getRoleBadge = () => {
    const roleConfig = {
      student: {
        label: 'Student',
        className: 'bg-blue-100 text-blue-800',
      },
      supervisor: {
        label: 'Supervisor',
        className: 'bg-purple-100 text-purple-800',
      },
      admin: {
        label: 'Administrator',
        className: 'bg-green-100 text-green-800',
      },
    };

    const config = roleConfig[user.role];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative w-20 h-20">
          <Image
            src={user.profileImage || user.photoURL || '/default-avatar.png'}
            alt={user.name}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <div className="mt-2">{getRoleBadge()}</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email - Always shown */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
          <p className="mt-1 text-gray-900">{user.email}</p>
        </div>

        {/* Student-specific fields */}
        {user.role === 'student' && user.studentId && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
            <p className="mt-1 text-gray-900">{user.studentId}</p>
          </div>
        )}

        {user.role === 'student' && user.degree && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Degree Program</h3>
            <p className="mt-1 text-gray-900">{user.degree}</p>
          </div>
        )}

        {/* Supervisor and Admin - Department */}
        {(user.role === 'supervisor' || user.role === 'admin') && user.department && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="mt-1 text-gray-900">{user.department}</p>
          </div>
        )}

        {/* Supervisor - Expertise */}
        {user.role === 'supervisor' && user.expertise && user.expertise.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Areas of Expertise</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.expertise.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

