import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "./ui/button";

export const Navbar = () => {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const getInitials = (username: string) =>
    username
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  return (
    <nav className="h-16 w-full border-0 bg-canvas">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-5 md:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-on-dark"
        >
          Hostic
        </Link>

        <div className="flex items-center gap-3">
          {token && user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">
                {user.username}
              </span>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-card text-xs font-semibold"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.username)
                )}
              </button>
              <Button onClick={() => navigate("/deployments")}>Deploy</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
