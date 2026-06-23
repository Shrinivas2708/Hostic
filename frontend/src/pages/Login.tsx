import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addToast } from "@heroui/toast";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer } from "../components/layout/PageContainer";

function Login() {
  const navigate = useNavigate();
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { error, loading, login } = useAuth();

  const validatePassword = (value: string) => {
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    const isLongEnough = value.length > 6;
    if (!isLongEnough) return "Password must be at least 7 characters.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecialChar)
      return "Password must contain at least one special character.";
    return "";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!userName.trim()) {
      setUsernameError("Username can't be empty");
      hasError = true;
    }

    const passwordValidationError = validatePassword(password);
    if (!password.trim()) {
      setPasswordError("Password can't be empty");
      hasError = true;
    } else if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      hasError = true;
    }

    if (hasError) return;
    login({ userName, password });
  };

  useEffect(() => {
    if (error) {
      addToast({ title: "Error", description: error, color: "danger" });
    }
  }, [error]);

  return (
    <PageContainer narrow className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md" padding="lg">
        <h1 className="text-2xl font-bold text-on-dark">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Welcome back. Enter your credentials to continue.
        </p>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="your-username"
              type="text"
              className={`mt-2 ${usernameError ? "border-error ring-error" : ""}`}
              value={userName}
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value);
                if (e.target.value.trim()) setUsernameError("");
              }}
            />
            {usernameError && (
              <span className="mt-1 text-xs text-error">{usernameError}</span>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              className={`mt-2 ${passwordError ? "border-error ring-error" : ""}`}
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value));
              }}
            />
            {passwordError && (
              <span className="mt-1 text-xs text-error">{passwordError}</span>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-medium text-brand underline"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </p>
      </Card>
    </PageContainer>
  );
}

export default Login;
