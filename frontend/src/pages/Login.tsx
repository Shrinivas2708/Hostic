import { useNavigate } from "react-router-dom";
import { BottomGradient } from "../components/BottomGradient";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addToast } from "@heroui/toast";
import { Loader } from "../components/ui/Loader";

function Login() {
  const navigate = useNavigate();
  const [userName, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [usernameError, setUsernameError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const { error, loading, login } = useAuth();

  const validatePassword = (value: string) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    const isLongEnough = value.length > 6;
    if (!isLongEnough) {
      return "Password must be at least 7 characters.";
    }
    if (!hasUppercase) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!hasNumber) {
      return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character number.";
    }
    return "";
  };

  const handleLogin = (e : React.FormEvent) => {
    e.preventDefault()
    if (!userName) {
      setUsernameError("Username can't be empty")
      return;
    }

    if (!password) {
      setPasswordError("Password can't be empty")
      return;
    }

    login({ userName, password });
  };

  useEffect(() => {
    if (error) {
      addToast({
        title: "Error",
        description: error,
        color: "danger",
      });
    }
  }, [error]);

  return (
    <div className="p-10 max-h-screen flex justify-center items-center flex-col">
      <div className="md:p-10 py-10 px-10 text-5xl font-bold flex flex-col gap-3 w-[400px] border rounded-3xl border-[#262626]">
        <span className="text-center mb-5">Login</span>

        <form onSubmit={handleLogin} className=" flex flex-col gap-3">
          <Label htmlFor="username">User name</Label>
        <Input
          id="username"
          placeholder="User"
          type="text"
          className={usernameError ? "border-red-500 border ring-red-500 focus-visible:ring-red-500" : ""}
          value={userName}
          autoComplete="username"
          onChange={(e) => {
            const value = e.target.value;
            setUsername(value);
            if (value.trim()) setUsernameError("");
          }}
        />
        {usernameError && (
          <span className="text-xs text-red-500 font-extralight">{usernameError}</span>
        )}

        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="••••••••"
          type="password"
          className={passwordError ? "border-red-500  ring-red-500 focus-visible:ring-red-500" : ""}
          value={password}
          autoComplete="current-password"
          onChange={(e) => {
            const val = e.target.value;
            setPassword(val);
            const err = validatePassword(val);
            setPasswordError(err);
          }}
        />
        {passwordError && (
          <span className="text-xs text-red-500 font-extralight">{passwordError}</span>
        )}

        <button
          className={`group/btn relative block h-10 w-full rounded-md bg-gradient-to-br font-medium text-white bg-zinc-800 from-zinc-900 to-zinc-900 shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] text-base mt-4 ${
            loading
              ? "cursor-progress flex justify-center items-center"
              : "cursor-pointer"
          }`}
          disabled={loading}
           type="submit"
        >
          {loading ? <Loader /> : "Log in →"}
          <BottomGradient />
        </button>

        </form>
        <span className="text-xs font-light text-center mt-3">
          Don't have an account?{" "}
          <span
            className="underline hover:text-[#246BFD] cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </span>
      </div>
    </div>
  );
}

export default Login;
