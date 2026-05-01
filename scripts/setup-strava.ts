import "dotenv/config";
import { Composio } from "@composio/core";

async function main() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const userId = process.env.COMPOSIO_USER_ID ?? "default";
  if (!apiKey) {
    console.error("COMPOSIO_API_KEY not set in .env.local");
    process.exit(1);
  }
  const c = new Composio({ apiKey });
  const accounts = await c.connectedAccounts.list({ userIds: [userId], toolkitSlugs: ["strava"] });
  if (accounts.items && accounts.items.length > 0) {
    const a = accounts.items[0];
    console.log(`Strava already connected for user "${userId}"`);
    console.log(`  account id: ${a.id}`);
    console.log(`  status: ${a.status}`);
    return;
  }
  console.log("No Strava connection found. Initiating OAuth...");
  const req = await c.connectedAccounts.initiate({
    userId,
    toolkit: "strava" as never,
  } as never);
  console.log("Open this URL in your browser to authorize:");
  console.log(req.redirectUrl);
  console.log("Waiting for connection to become active...");
  const acc = await c.connectedAccounts.waitForConnection(req.id);
  console.log(`Connected: account ${acc.id} (status ${acc.status})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
