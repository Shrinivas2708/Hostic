import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { formatDate } from "../exports";

function Dashboard() {
  const getInitials = (username: string) =>
    username
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const { user, logout } = useAuthStore();

  return (
    <PageContainer narrow>
      <PageHeader
        title="Account"
        description="Manage your profile and deployment quota."
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
            <dt className="text-sm text-muted">Member since</dt>
            <dd className="text-sm font-medium text-on-dark">
              {formatDate(user?.createdAt || "")}
            </dd>
          </div>
        </dl>

        <Button variant="danger" className="mt-8" onClick={() => logout()}>
          Sign out
        </Button>
      </Card>
    </PageContainer>
  );
}

export default Dashboard;
