import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/Motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineShieldCheck, HiOutlineCalendar } from 'react-icons/hi';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <PageTransition>
      <div className="page-container max-w-2xl">
        <h1 className="text-3xl font-display font-bold mb-8">Profile</h1>

        <div className="glass-card p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/30 mb-4">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            {user.role === 'admin' && <span className="badge-primary mt-2">Admin</span>}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <HiOutlineUser className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <HiOutlineMail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <HiOutlineShieldCheck className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Role</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>

            {user.createdAt && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={logout} className="btn-danger w-full">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
