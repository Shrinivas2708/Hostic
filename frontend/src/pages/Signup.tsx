import { Label } from "@radix-ui/react-label";
import { Input } from "../components/ui/input";
import { BottomGradient } from "../components/BottomGradient";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Loader } from "../components/ui/Loader";

function Signup() {
  const navigate = useNavigate();
  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { error, loading, signup } = useAuth();

  const validatePassword = (value: string) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    const isLongEnough = value.length > 6;

    if (!isLongEnough) return "Password must be at least 7 characters.";
    if (!hasUppercase) return "Must contain at least one uppercase letter.";
    if (!hasNumber) return "Must contain at least one number.";
    if (!hasSpecialChar) return "Must contain at least one special character.";
    return "";
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Invalid email format.";
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!userName.trim()) {
      setUsernameError("Username can't be empty");
      hasError = true;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      hasError = true;
    }

    const passwordErr = validatePassword(password);
    if (passwordErr) {
      setPasswordError(passwordErr);
      hasError = true;
    }

    if (hasError) return;

    signup({ userName, password, email });
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
      <div className="md:p-10 py-10 px-10 flex flex-col gap-3 w-[400px] border rounded-3xl border-[#262626]">
        <span className="text-center mb-5 md:text-5xl text-4xl font-bold">
          Signup
        </span>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <Label htmlFor="username">User name</Label>
          <Input
            id="username"
            placeholder="User"
            type="text"
            value={userName}
            autoComplete="username"
            className={usernameError ? "border-red-500  ring-red-500 focus-visible:ring-red-500" : ""}
            onChange={(e) => {
              setUsername(e.target.value);
              if (e.target.value.trim()) setUsernameError("");
            }}
          />
          {usernameError && (
            <span className="text-xs text-red-500 font-extralight">{usernameError}</span>
          )}

          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="user@gmail.com"
            type="email"
            value={email}
            autoComplete="email"
            className={emailError ? "border-red-500  ring-red-500 focus-visible:ring-red-500" : ""}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(validateEmail(e.target.value));
            }}
          />
          {emailError && (
            <span className="text-xs text-red-500 font-extralight" >{emailError}</span>
          )}

          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            autoComplete="new-password"
            className={passwordError ? " border-red-500  ring-red-500 focus-visible:ring-red-500" : ""}
            onChange={(e) => {
              setPassword(e.target.value);
              const err = validatePassword(e.target.value);
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
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader /> : "Sign up →"}
            <BottomGradient />
          </button>
        </form>

        <span className="text-xs font-light text-center mt-3">
          Already have an account?{" "}
          <span
            className="underline hover:text-[#246BFD] cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </span>
      </div>
    </div>
  );
}

export default Signup;
