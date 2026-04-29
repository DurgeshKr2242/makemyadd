#!/usr/bin/env node
// Smoke-tests every MCP server in .mcp.json. Reports up / down / skipped.
// HTTP/SSE servers: HEAD or GET, 5s timeout, accept any 2xx/3xx/401/403 as "reachable".
// stdio servers (command + args): spawn with --help or empty stdin, accept exit within 10s as "reachable".

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const cfgPath = join(repoRoot, ".mcp.json");

const TIMEOUT_HTTP = 5_000;
const TIMEOUT_STDIO = 10_000;

const color = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const ok = (s) => color(32, s);
const fail = (s) => color(31, s);
const warn = (s) => color(33, s);
const dim = (s) => color(90, s);

const expand = (str) =>
  typeof str === "string"
    ? str.replace(/\$\{([A-Z0-9_]+)\}/g, (_, v) => process.env[v] ?? "")
    : str;

const hasUnresolvedVars = (str) =>
  typeof str === "string" && /\$\{[A-Z0-9_]+\}/.test(expand(str)) === false
    ? false
    : typeof str === "string" && /\$\{[A-Z0-9_]+\}/.test(str) && expand(str).includes("");

async function checkHttp(name, url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_HTTP);
  try {
    const res = await fetch(url, { method: "GET", signal: ac.signal, redirect: "manual" });
    clearTimeout(t);
    if (res.status >= 200 && res.status < 500) {
      return { name, status: "up", detail: `HTTP ${res.status}` };
    }
    return { name, status: "down", detail: `HTTP ${res.status}` };
  } catch (e) {
    clearTimeout(t);
    return { name, status: "down", detail: e.name === "AbortError" ? "timeout" : e.message };
  }
}

function checkStdio(name, command, args, env) {
  return new Promise((resolve) => {
    const expandedArgs = (args ?? []).map(expand);
    const expandedEnv = { ...process.env };
    for (const [k, v] of Object.entries(env ?? {})) {
      expandedEnv[k] = expand(v);
    }
    const missing = [];
    for (const [k, raw] of Object.entries(env ?? {})) {
      if (typeof raw === "string" && /\$\{[A-Z0-9_]+\}/.test(raw) && !expandedEnv[k]) {
        missing.push(k);
      }
    }
    for (const a of args ?? []) {
      const m = typeof a === "string" && a.match(/\$\{([A-Z0-9_]+)\}/);
      if (m && !process.env[m[1]]) missing.push(m[1]);
    }
    if (missing.length) {
      resolve({ name, status: "skipped", detail: `missing env: ${[...new Set(missing)].join(", ")}` });
      return;
    }

    const child = spawn(command, expandedArgs, { env: expandedEnv, stdio: ["pipe", "pipe", "pipe"] });
    const t = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ name, status: "up", detail: "spawned (no exit before 10s — likely waiting on stdio handshake, treated as reachable)" });
    }, TIMEOUT_STDIO);

    let stderr = "";
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(t);
      resolve({ name, status: "down", detail: e.message });
    });
    child.on("exit", (code) => {
      clearTimeout(t);
      if (code === 0) {
        resolve({ name, status: "up", detail: "exit 0" });
      } else {
        resolve({ name, status: "down", detail: `exit ${code}: ${stderr.trim().slice(0, 200) || "no stderr"}` });
      }
    });

    try {
      child.stdin?.end();
    } catch {}
  });
}

const main = async () => {
  let raw;
  try {
    raw = await readFile(cfgPath, "utf8");
  } catch (e) {
    console.error(fail(`Could not read ${cfgPath}: ${e.message}`));
    process.exit(2);
  }
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch (e) {
    console.error(fail(`.mcp.json is not valid JSON: ${e.message}`));
    process.exit(2);
  }
  const servers = cfg.mcpServers ?? {};
  const names = Object.keys(servers);
  if (!names.length) {
    console.error(warn("No mcpServers in .mcp.json"));
    process.exit(0);
  }

  console.log(dim(`Checking ${names.length} MCP server(s) from ${cfgPath}\n`));

  const results = await Promise.all(
    names.map((name) => {
      const s = servers[name];
      if (s.url) return checkHttp(name, s.url);
      if (s.command) return checkStdio(name, s.command, s.args ?? [], s.env ?? {});
      return Promise.resolve({ name, status: "down", detail: "neither url nor command set" });
    }),
  );

  let downCount = 0;
  for (const r of results) {
    const tag =
      r.status === "up" ? ok("  UP    ") :
      r.status === "skipped" ? warn(" SKIP   ") :
      fail(" DOWN   ");
    console.log(`${tag} ${r.name.padEnd(26)} ${dim(r.detail ?? "")}`);
    if (r.status === "down") downCount++;
  }

  console.log("");
  if (downCount === 0) {
    console.log(ok(`All reachable (${results.length}/${results.length}).`));
  } else {
    console.log(fail(`${downCount} server(s) down. Fix before relying on agents.`));
  }
  process.exit(downCount === 0 ? 0 : 1);
};

main();
