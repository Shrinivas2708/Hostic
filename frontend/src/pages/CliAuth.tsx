import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import axios from "../lib/axios";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer } from "../components/layout/PageContainer";
import { addToast } from "@heroui/toast";
import { Terminal } from "lucide-react";

export default function CliAuth() {
  const [searchParams] = useSearchParams();
  const session = searchParams.get("session");
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [authorizing, setAuthorizing] = useState(false);
  const [done, setDone] = useState(false);

  if (!session) {
    return (
      <PageContainer narrow className="py-16 text-center">
        <p className="text-error">Missing CLI session. Run `hostic login` again.</p>
      </PageContainer>
    );
  }

  const handleAuthorize = async () => {
    setAuthorizing(true);
    try {
      await axios.post("/auth/cli/authorize", { session_id: session });
      setDone(true);
    } catch {
      addToast({
        title: "Authorization failed",
        description: "Session may have expired. Run `hostic login` again.",
        color: "danger",
      });
    } finally {
      setAuthorizing(false);
    }
  };

  if (done) {
    return (
      <PageContainer narrow className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
        <Card className="w-full max-w-md text-center" padding="lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/15">
            <Terminal className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-on-dark">CLI authorized</h1>
          <p className="mt-3 text-sm text-copy">
            You can close this tab and return to your terminal.
          </p>
        </Card>
      </PageContainer>
    );
  }

  if (!token) {
    return (
      <PageContainer narrow className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
        <Card className="w-full max-w-md" padding="lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/15">
            <Terminal className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-on-dark">Authorize Hostic CLI</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to link the CLI running on your machine to your account.
          </p>
          <Button
            className="mt-8 w-full"
            onClick={() =>
              navigate(`/login?cli_session=${encodeURIComponent(session)}`)
            }
          >
            Sign in to continue
          </Button>
          <p className="mt-4 text-center text-sm text-muted">
            No account?{" "}
            <Link to="/signup" className="text-brand underline">
              Sign up
            </Link>
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/15">
          <Terminal className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-on-dark">Authorize Hostic CLI</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as{" "}
          <span className="font-medium text-on-dark">{user?.username}</span>.
          Allow the CLI on your computer to deploy on your behalf?
        </p>
        <Button
          className="mt-8 w-full"
          loading={authorizing}
          onClick={handleAuthorize}
        >
          Authorize CLI
        </Button>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted underline"
          onClick={() => navigate("/dashboard")}
        >
          Cancel
        </button>
      </Card>
    </PageContainer>
  );
}
