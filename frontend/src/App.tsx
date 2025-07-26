import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Footer from './components/Footer';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/authStore';
import { useEffect, useRef } from 'react';
import {ToastProvider} from "@heroui/toast";
import { HeroUIProvider } from '@heroui/system';
import Deploy from './pages/Deploy';
function App() {
  const { token, user, fetchUser } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (token && !user && !hasFetched.current) {
      fetchUser();
      hasFetched.current = true;
    }
  }, [token, user, fetchUser]);

  return (
    <div className="relative min-h-screen bg-[#040B10] text-white overflow-hidden">
      {/* 💡 Background Glow Circles */}
      <div className="absolute -top-72 -left-72 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#246BFD] opacity-40 rounded-full blur-[200px] z-0 pointer-events-none
" />
      <div className="absolute -bottom-72 -right-72 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#246BFD] opacity-20 rounded-full blur-[200px] z-0 pointer-events-none
" />

      {/* 🔒 Main App */}
     
     <HeroUIProvider>
      
      <BrowserRouter>
        <Navbar />
        <main className="relative z-10 flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deploy"
              element={
                <ProtectedRoute>
                  <Deploy />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      <ToastProvider placement='top-center'/>
      </HeroUIProvider>
    </div>
  );
}

export default App;
