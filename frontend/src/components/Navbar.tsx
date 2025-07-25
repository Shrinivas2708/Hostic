// import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from "../store/authStore";
import rocket from '../assets/rocket.svg';
import { CTAButton } from './CTAButton';
// import { Button } from './ui/button';
export const Navbar = () => {
  const { token, user,  logout } = useAuthStore();
  const navigate = useNavigate();


  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-transparent text-white px-24 py-4 flex items-center justify-between border-b border-white/10  w-full z-50">
      <Link to="/" className="text-2xl font-bold tracking-wide flex gap-2 cursor-pointer text-[#E7DEFE]"><img src={rocket} alt="" /> Host It</Link>

      <div className="flex items-center gap-4">
        {token && user ? (
          <>
            <span className="text-sm">{user.name}</span>
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#040B10] font-bold text-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-sm underline underline-offset-2"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline"><CTAButton variant='ghost'>
              Login
              </CTAButton></Link>
            <Link to="/signup" ><CTAButton variant='outline'>Get Started</CTAButton></Link>
          </>
        )}
      </div>
    </nav>
  );
};
