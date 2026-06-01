/**
 * Thin orchestrator: opens a session against the coordinator agent,
 * streams events to stdout, and writes any files the agent emits in
 * <FILE path="..."> ... </FILE> blocks to ./output/ on local disk.
 *
 * Run:  npm start -- "Build a Node.js calculator with tests"
 */
import "dotenv/config";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  defaultHeaders: { "anthropic-beta": "managed-agents-2026-04-01" },
});

const { COORDINATOR_AGENT_ID, ENVIRONMENT_ID, ATLASSIAN_VAULT_ID } = process.env;
if (!COORDINATOR_AGENT_ID || !ENVIRONMENT_ID) {
  console.error(
    "Missing IDs. Create the coordinator and environment in the Console " +
      "(see README.md), then paste their IDs into .env."
  );
  process.exit(1);
}
const vault_ids = ATLASSIAN_VAULT_ID ? [ATLASSIAN_VAULT_ID] : [];

// The user's task, plus a fixed footer that forces a machine-parseable
// final answer. Each file the agent wants to deliver is wrapped in:
//   <FILE path="relative/path.ext">...content...</FILE>
const FILE_DELIVERY_INSTRUCTIONS = `

---
IMPORTANT — Final delivery format:
When the work is done, output ALL final files using this exact format,
one block per file, with the file's full content between the tags:

<FILE path="relative/path.ext">
...file content here, no fences, no extra indentation...
</FILE>

Use forward slashes in paths. Do NOT wrap blocks in markdown code fences.
Include every file the user needs to run the project (source, tests,
package.json if relevant, README if relevant).
`;

const userTask =
  process.argv.slice(2).join(" ") ||
  "Build a TypeScript function `parseCSV(text)` that handles quoted commas and escaped quotes. Include tests.";
const task = userTask + FILE_DELIVERY_INSTRUCTIONS;

const OUTPUT_DIR = resolve("./output");

/** Parses <FILE path="..."> ... </FILE> blocks out of an accumulated transcript. */
function extractFiles(transcript: string): Array<{ path: string; content: string }> {
  const re = /<FILE\s+path="([^"]+)">\s*([\s\S]*?)\s*<\/FILE>/g;
  const out: Array<{ path: string; content: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(transcript))) {
    out.push({ path: m[1], content: m[2] });
  }
  return out;
}

async function main() {
  const session = await client.beta.sessions.create({
    agent: COORDINATOR_AGENT_ID,
    environment_id: ENVIRONMENT_ID,
    title: "dev-orchestrator",
    vault_ids,
  });
  console.log(`Session: ${session.id}\nTask: ${userTask}\n`);

  const stream = await client.beta.sessions.events.stream(session.id);

  await client.beta.sessions.events.send(session.id, {
    events: [{ type: "user.message", content: [{ type: "text", text: task }] }],
  });

  // Accumulate primary-thread text so we can parse files at the end.
  let transcript = "";

  for await (const event of stream) {
    switch (event.type) {
      case "session.thread_created":
        console.log(`\n[+] thread: ${event.agent_name}`);
        break;
      case "agent.thread_message_sent":
        console.log(`[->] coordinator → ${event.to_agent_name}`);
        break;
      case "agent.thread_message_received":
        console.log(`[<-] ${event.from_agent_name} → coordinator`);
        break;
      case "agent.message":
        // Only collect text from the primary (coordinator) thread.
        if (!(event as any).parent_session_thread_id) {
          for (const b of event.content) {
            if (b.type === "text") {
              transcript += b.text;
              process.stdout.write(b.text);
            }
          }
        }
        break;
      case "agent.tool_use":
        console.log(`\n  [tool: ${event.name}]`);
        break;
      case "session.error":
        console.error(`\n[!] session.error: ${(event as any).message ?? JSON.stringify(event)}`);
        break;
      case "session.status_idle":
        console.log("\n\nRun finished. Extracting files...");
        await writeFiles(transcript);
        return;
    }
  }
}

async function writeFiles(transcript: string) {
  const files = extractFiles(transcript);
  if (files.length === 0) {
    console.log("(no <FILE> blocks found — nothing to write)");
    return;
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const f of files) {
    const dest = join(OUTPUT_DIR, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
    console.log(`  ✓ ${dest}`);
  }
  console.log(`\n${files.length} file(s) written to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});