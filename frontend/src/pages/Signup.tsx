import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer } from "../components/layout/PageContainer";

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
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    const isLongEnough = value.length > 6;
    if (!isLongEnough) return "Password must be at least 7 characters.";
    if (!hasNumber) return "Must contain at least one number.";
    if (!hasSpecialChar) return "Must contain at least one special character.";
    return "";
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Invalid email format.";
  };

  const handleSignup = (e: FormEvent) => {
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
      addToast({ title: "Error", description: error, color: "danger" });
    }
  }, [error]);

  return (
    <PageContainer narrow className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md" padding="lg">
        <h1 className="text-2xl font-bold text-on-dark">Create account</h1>
        <p className="mt-2 text-sm text-muted">
          Get started with Hostic and deploy your first app.
        </p>

        <form onSubmit={handleSignup} className="mt-8 flex flex-col gap-5">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="your-username"
              type="text"
              value={userName}
              autoComplete="username"
              className={`mt-2 ${usernameError ? "border-error" : ""}`}
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              autoComplete="email"
              className={`mt-2 ${emailError ? "border-error" : ""}`}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
              }}
            />
            {emailError && (
              <span className="mt-1 text-xs text-error">{emailError}</span>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              autoComplete="new-password"
              className={`mt-2 ${passwordError ? "border-error" : ""}`}
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
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-brand underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </Card>
    </PageContainer>
  );
}

export default Signup;
