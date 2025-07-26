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
    <nav className="bg-transparent text-white md:px-24 px-5 py-4 flex items-center justify-between border-b border-white/10  w-full z-50">
     <Link
  to="/"
  className="md:text-2xl text-lg font-bold tracking-wide flex items-center gap-2 text-[#E7DEFE] hover:opacity-90 transition"
>
  <img src={rocket} alt="logo" className="w-6 h-6" />
  <span>Hostic</span>
</Link>


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
            <Link to="/login"><CTAButton variant='ghost'>
              Login
              </CTAButton></Link>
            <Link to="/signup" ><CTAButton variant='outline'>Get Started</CTAButton></Link>
          </>
        )}
      </div>
    </nav>
  );
};
