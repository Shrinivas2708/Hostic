import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { Spinner } from "@heroui/spinner";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Button } from "../components/ui/button";

function Deployed() {
  const { id } = useParams();
  const { getImg, deploy_img, loading, deployment, fetchDeployment } =
    useDeploy();

  useEffect(() => {
    if (!id) return;
    getImg(id);
    fetchDeployment(id);
  }, [id]);

  const siteUrl = `https://${deployment?.slug}.apps.shribuilds.in`;

  return (
    <PageContainer narrow>
      <PageHeader
        badge="Live"
        title="Deployment successful"
        description="Your site is published and ready to visit."
      />

      <Card
        padding="md"
        className="cursor-pointer transition-colors hover:border-hairline-strong"
        onClick={() => window.open(siteUrl)}
      >
        <div className="aspect-video w-full overflow-hidden rounded-md border border-hairline bg-surface-elevated">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner color="default" />
            </div>
          ) : deploy_img ? (
            <img
              src={deploy_img}
              alt="Site preview"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              Preview unavailable
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">Published at</p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-mono text-brand underline"
            onClick={(e) => e.stopPropagation()}
          >
            {deployment?.slug}.apps.shribuilds.in
          </a>
        </div>

        <Button
          className="mt-6 w-full"
          onClick={(e) => {
            e.stopPropagation();
            window.open(siteUrl);
          }}
        >
          Visit site
        </Button>
      </Card>
    </PageContainer>
  );
}

export default Deployed;
