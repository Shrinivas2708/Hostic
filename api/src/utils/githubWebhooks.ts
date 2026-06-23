import { IDeployment } from "../model/Deployments.model";
import { User } from "../model/User.model";
import { Deployments } from "../model/Deployments.model";
import {
  createRepoWebhook,
  deleteRepoWebhook,
  parseOwnerRepo,
  updateRepoWebhook,
} from "./github";

function getApiPublicUrl(): string {
  return (process.env.API_PUBLIC_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  );
}

export async function setupGitHubWebhookForDeployment(
  deployment: IDeployment,
  userId: string
): Promise<void> {
  const user = await User.findById(userId).select("+githubAccessToken");
  if (!user?.githubAccessToken || !deployment.webhookSecret) return;

  const parsed = parseOwnerRepo(deployment.repo_url);
  if (!parsed) return;

  const webhookUrl = `${getApiPublicUrl()}/api/webhooks/github/${deployment.webhookSecret}`;

  try {
    const hookId = await createRepoWebhook(
      user.githubAccessToken,
      parsed.owner,
      parsed.repo,
      webhookUrl,
      deployment.webhookSecret
    );

    await Deployments.updateOne(
      { _id: deployment._id },
      {
        githubWebhookId: hookId,
        githubRepoFullName: `${parsed.owner}/${parsed.repo}`,
        githubWebhookManaged: true,
      }
    );
  } catch (err) {
    console.error(
      `[GitHub] Failed to create webhook for ${deployment.slug}:`,
      err
    );
  }
}

export async function removeGitHubWebhookForDeployment(
  deployment: IDeployment,
  userId: string
): Promise<void> {
  if (!deployment.githubWebhookId) return;

  const user = await User.findById(userId).select("+githubAccessToken");
  if (!user?.githubAccessToken) return;

  const parsed =
    parseOwnerRepo(deployment.repo_url) ||
    (deployment.githubRepoFullName
      ? {
          owner: deployment.githubRepoFullName.split("/")[0],
          repo: deployment.githubRepoFullName.split("/")[1],
        }
      : null);

  if (!parsed) return;

  try {
    await deleteRepoWebhook(
      user.githubAccessToken,
      parsed.owner,
      parsed.repo,
      deployment.githubWebhookId
    );
  } catch (err) {
    console.error(
      `[GitHub] Failed to delete webhook for ${deployment.slug}:`,
      err
    );
  }
}

export async function setGitHubWebhookActive(
  deployment: IDeployment,
  userId: string,
  active: boolean
): Promise<void> {
  if (!deployment.githubWebhookId) return;

  const user = await User.findById(userId).select("+githubAccessToken");
  if (!user?.githubAccessToken) return;

  const parsed = parseOwnerRepo(deployment.repo_url);
  if (!parsed) return;

  try {
    await updateRepoWebhook(
      user.githubAccessToken,
      parsed.owner,
      parsed.repo,
      deployment.githubWebhookId,
      { active }
    );
  } catch (err) {
    console.error(
      `[GitHub] Failed to update webhook for ${deployment.slug}:`,
      err
    );
  }
}

export async function refreshGitHubWebhookSecret(
  deployment: IDeployment,
  userId: string,
  newSecret: string
): Promise<void> {
  const user = await User.findById(userId).select("+githubAccessToken");
  if (!user?.githubAccessToken) return;

  const parsed = parseOwnerRepo(deployment.repo_url);
  if (!parsed) return;

  const webhookUrl = `${getApiPublicUrl()}/api/webhooks/github/${newSecret}`;

  try {
    if (deployment.githubWebhookId) {
      await updateRepoWebhook(
        user.githubAccessToken,
        parsed.owner,
        parsed.repo,
        deployment.githubWebhookId,
        { secret: newSecret, url: webhookUrl, active: true }
      );
      return;
    }

    const hookId = await createRepoWebhook(
      user.githubAccessToken,
      parsed.owner,
      parsed.repo,
      webhookUrl,
      newSecret
    );

    await Deployments.updateOne(
      { _id: deployment._id },
      {
        githubWebhookId: hookId,
        githubRepoFullName: `${parsed.owner}/${parsed.repo}`,
        githubWebhookManaged: true,
      }
    );
  } catch (err) {
    console.error(
      `[GitHub] Failed to refresh webhook secret for ${deployment.slug}:`,
      err
    );
  }
}
