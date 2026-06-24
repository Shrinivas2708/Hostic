import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import Footer from "./components/Footer";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CliAuth from "./pages/CliAuth";
import Dashboard from "./pages/Dashboard";
import { useAuthStore } from "./store/authStore";
import { useEffect, useRef } from "react";
import { ToastHost } from "./components/ToastHost";
import DeploymentsPage from "./pages/DeploymentsPage";
import DeploymentDetailsPage from "./pages/DeploymentsUpdatePage";
import BuildPage from "./pages/BuildPage";
import Deploy from "./pages/Deploy";
import Deployed from "./pages/Deployed";

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
    <div className="relative flex min-h-screen flex-col bg-canvas text-on-dark">
      <BrowserRouter>
        <header className="sticky top-0 z-50 bg-canvas">
          <Navbar />
        </header>
        <main className="relative z-0 flex-grow bg-canvas">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cli-auth" element={<CliAuth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployments"
              element={
                <ProtectedRoute>
                  <DeploymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployments/:id"
              element={
                <ProtectedRoute>
                  <DeploymentDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deployments/:id/:buildName"
              element={
                <ProtectedRoute>
                  <BuildPage />
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
            <Route
              path="/deployed/:id/:buildName"
              element={
                <ProtectedRoute>
                  <Deployed />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>

      <ToastHost />
    </div>
  );
}

export default App;
