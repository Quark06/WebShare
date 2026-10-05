// End-to-end checks for room persistence and the room list. Starts the real server on a spare port.
// Run with Node 24: node scripts/verify-rooms.mjs
// PostgreSQL checks run only when TEST_DATABASE_URL points to an empty, disposable database; the script
// creates the schema there and drops it afterwards. Media URLs are placeholders and are never fetched.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { io } from "socket.io-client";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = 18081;
const base = `http://127.0.0.1:${port}`;
const movie = "https://media.example/movie.mp4";
const databaseUrl = process.env.TEST_DATABASE_URL;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(env) {
  const child = spawn(process.execPath, ["server/server.ts"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "production", DATABASE_URL: "", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/ping")).ok) return { child, log: () => log };
    } catch {}
    await sleep(200);
  }
  child.kill();
  throw new Error("Server did not start.\n" + log);
}
async function stopServer(server) {
  if (server.child.exitCode !== null) return;
  const exited = new Promise((r) => server.child.once("exit", r));
  server.child.kill();
  await exited;
}
const nextEvent = (socket, name) => new Promise((resolve) => socket.once(name, resolve));
function enter(room) {
  return new Promise((resolve, reject) => {
    const socket = io(base + room, {
      transports: ["websocket"],
      reconnection: false,
      query: { clientId: crypto.randomUUID(), roomId: room.slice(1) },
      auth: { sessionId: crypto.randomUUID() },
    });
    socket.once("REC:host", (host) => resolve({ socket, host }));
    socket.once("connect_error", reject);
  });
}
async function leave(visitor) {
  visitor.socket.disconnect();
  await sleep(500);
}
async function hostMovie(visitor, position) {
  const hosted = nextEvent(visitor.socket, "REC:host");
  visitor.socket.emit("CMD:playlistAdd", movie);
  const host = await hosted;
  // The server ignores position reports for a second after the media changes
  await sleep(1100);
  visitor.socket.emit("CMD:ts", position);
  return host;
}
const listRooms = async () => (await fetch(base + "/rooms")).json();
const findRoom = async (room) => (await listRooms()).rooms.find((r) => r.roomId === room);
const createRoom = async (body = {}) =>
  (await (await fetch(base + "/createRoom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json()).name;
const position = (host) => [host.video, host.paused, host.videoTS];

let sql;
if (databaseUrl) {
  sql = new pg.Client({ connectionString: databaseUrl });
  await sql.connect();
  const existing = await sql.query(`SELECT to_regclass('public.room') AS room`);
  assert.equal(existing.rows[0].room, null, "TEST_DATABASE_URL must point to an empty database");
}

let server = await startServer({});
try {
  const room = await createRoom();
  const a = await enter(room);
  await hostMovie(a, 12);
  await sleep(1200);
  const live = await listRooms();
  assert.equal(live.archiveHours, 72);
  const { lastActive, ...listed } = live.rooms.find((r) => r.roomId === room);
  assert.ok(Date.now() - Date.parse(lastActive) < 5000);
  assert.deepEqual(listed, {
    roomId: room,
    locked: false,
    users: 1,
    video: movie,
    media: { name: movie, channel: "Video URL", duration: 0, url: movie, type: "file" },
  });
  await leave(a);
  const item = await findRoom(room);
  assert.equal(item.users, 0);
  assert.ok(Date.now() - Date.parse(item.lastActive) < 5000);
  const b = await enter(room);
  assert.deepEqual(position(b.host), [movie, true, 12]);
  await leave(b);
  console.log("PASS rooms in memory are listed and wait at their position once empty");

  const c = await enter(room);
  const sharing = nextEvent(c.socket, "REC:host");
  c.socket.emit("CMD:joinScreenShare", { file: false });
  assert.match((await sharing).video, /^screenshare:\/\//);
  await leave(c);
  assert.equal((await findRoom(room)).video, "");
  console.log("PASS screen shares end when their room empties");

  const queued = await createRoom({ playlist: [movie] });
  await sleep(500);
  const d = await enter(queued);
  assert.deepEqual(position(d.host).slice(0, 2), [movie, true]);
  await leave(d);
  console.log("PASS media started in an empty room waits for a viewer to press play");
} finally {
  await stopServer(server);
}

if (!sql) {
  console.log("SKIP PostgreSQL checks; set TEST_DATABASE_URL to an empty, disposable database to run them.");
} else {
  await sql.query(readFileSync(join(root, "sql/schema.sql"), "utf8"));
  const savedData = async (room) => (await sql.query(`SELECT data FROM room WHERE "roomId" = $1`, [room])).rows[0]?.data;
  server = await startServer({ DATABASE_URL: databaseUrl });
  try {
    const room = await createRoom();
    const a = await enter(room);
    await hostMovie(a, 42.5);
    await sleep(1500);
    assert.equal((await findRoom(room)).users, 1);
    await leave(a);
    let data = await savedData(room);
    assert.deepEqual([data.paused, data.videoTS, data.videoInfo.url], [true, 42.5, movie]);
    console.log("PASS a room stops at its position and is saved when the last viewer leaves");

    const b = await enter(room);
    assert.deepEqual(position(b.host), [movie, true, 42.5]);
    b.socket.emit("CMD:play");
    b.socket.emit("CMD:ts", 50);
    await sleep(1500);
    assert.equal((await savedData(room)).paused, false);
    // Stop the server while the room is still playing
    await stopServer(server);
    b.socket.close();
    server = await startServer({ DATABASE_URL: databaseUrl });
    const restarted = await findRoom(room);
    assert.deepEqual([restarted.users, restarted.media.name], [0, movie]);
    const c = await enter(room);
    assert.deepEqual(position(c.host), [movie, true, 50]);
    await leave(c);
    console.log("PASS rooms survive a restart, stay listed and wait at the saved position");

    await stopServer(server);
    await sql.query(`UPDATE room SET "lastUpdateTime" = NOW() - INTERVAL '73 hours' WHERE "roomId" = $1`, [room]);
    server = await startServer({ DATABASE_URL: databaseUrl });
    assert.equal(await findRoom(room), undefined);
    const d = await enter(room);
    assert.deepEqual(position(d.host), [movie, true, 50]);
    await sleep(1200);
    assert.equal((await findRoom(room)).users, 1);
    await leave(d);
    assert.equal((await findRoom(room)).users, 0);
    console.log("PASS archived rooms leave the list and their link restores them");

    await sql.query(`INSERT INTO room ("roomId", "creationTime", "lastUpdateTime") VALUES ('/never-used', NOW(), NOW())`);
    assert.equal(await findRoom("/never-used"), undefined);
    await sql.query(`UPDATE room SET password = 'secret', "roomTitle" = 'Movie night', vanity = 'movies' WHERE "roomId" = $1`, [room]);
    const titled = await findRoom(room);
    assert.deepEqual([titled.locked, titled.title, titled.vanity], [true, "Movie night", "movies"]);
    console.log("PASS unused rooms are hidden; titles, vanity links and passwords are reported");
  } finally {
    await stopServer(server);
    await sql.query("DROP TABLE IF EXISTS room, subscriber, link_account, active_user, vbrowser");
    await sql.end();
  }
}
console.log("All room checks passed.");
