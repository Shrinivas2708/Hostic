import { useNavigate } from "react-router-dom";
import type { Deployments } from "../store/deployStore";
import { Card } from "./ui/card";

function DeploymentsCard({ data }: { data: Deployments }) {
  const navigate = useNavigate();

  return (
    <Card
      padding="sm"
      className="cursor-pointer transition-colors hover:border-hairline-strong"
      onClick={() => navigate(`/deployments/${data._id}`)}
    >
      <div className="aspect-video w-full overflow-hidden rounded-md border border-hairline bg-surface-elevated">
        {data.img_url ? (
          <img
            src={data.img_url}
            className="h-full w-full object-cover"
            alt={data.slug}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No preview
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Deployment
        </p>
        <p className="mt-1 font-semibold text-on-dark break-all">{data.slug}</p>
      </div>
    </Card>
  );
}

export default DeploymentsCard;
