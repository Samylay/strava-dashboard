import "dotenv/config";
import { syncActivities } from "../lib/sync";

async function main() {
  console.log("Starting initial sync from Composio Strava...");
  const result = await syncActivities({ initial: true });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
