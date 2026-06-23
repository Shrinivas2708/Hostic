import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGitHubStore } from "../store/githubStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { formatDate } from "../exports";
import { Github } from "lucide-react";

function Dashboard() {
  const getInitials = (username: string) =>
    username
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const { user, logout } = useAuthStore();
  const { status, fetchStatus, connect } = useGitHubStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <PageContainer narrow>
      <PageHeader
        title="Account"
        description="Manage your profile, GitHub connection, and deployment quota."
      />

      <Card padding="lg">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline bg-surface-elevated text-xl font-bold">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.username || "")
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-on-dark">{user?.username}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-8 space-y-4 border-t border-hairline pt-8">
          <div className="flex justify-between">
            <dt className="text-sm text-muted">Deployments used</dt>
            <dd className="text-sm font-medium text-brand">
              {user?.deployments_count ?? 0} / 3
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted">GitHub</dt>
            <dd className="text-sm font-medium text-on-dark">
              {status?.connected || user?.githubConnected
                ? `@${status?.username || user?.githubUsername}`
                : "Not connected"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted">Member since</dt>
            <dd className="text-sm font-medium text-on-dark">
              {formatDate(user?.createdAt || "")}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {status?.connected || user?.githubConnected ? (
            <Button variant="secondary" onClick={() => navigate("/deployments")}>
              <Github className="h-4 w-4" />
              Browse repos
            </Button>
          ) : (
            <Button
              onClick={() =>
                connect().catch(() => {
                  /* redirecting */
                })
              }
            >
              <Github className="h-4 w-4" />
              Connect GitHub
            </Button>
          )}
          <Button variant="danger" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}

export default Dashboard;
