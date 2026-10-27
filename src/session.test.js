import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSessionUrl,
  readSession,
  SESSION_STORAGE_KEY,
} from "./session.js";

test("preserves session paths, invitation tokens and fragments", () => {
  const url = "https://table.example/join/game?invite=abc%2F123#room";
  assert.equal(normalizeSessionUrl(url), url);
  assert.equal(
    normalizeSessionUrl(" table.example/join "),
    "https://table.example/join",
  );
  assert.equal(
    normalizeSessionUrl("http://localhost:30000/game"),
    "http://localhost:30000/game",
  );
});

test("rejects executable protocols, embedded credentials and invalid URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "ftp://table.example",
    "https://name:secret@table.example",
    "http://",
    "",
    null,
  ]) {
    assert.throws(() => normalizeSessionUrl(url));
  }
});

test("reads saved session without altering the link and ignores broken data", () => {
  const session = {
    name: "Venerdì",
    url: "https://table.example/join?token=abc",
  };
  const storage = {
    getItem: (key) => {
      assert.equal(key, SESSION_STORAGE_KEY);
      return JSON.stringify(session);
    },
  };
  assert.deepEqual(readSession(storage), session);
  assert.equal(readSession({ getItem: () => "{" }), null);
  assert.equal(
    readSession({
      getItem: () => JSON.stringify({ url: "javascript:alert(1)" }),
    }),
    null,
  );
  assert.equal(
    readSession({
      getItem: () => {
        throw Error("unavailable");
      },
    }),
    null,
  );
});

test("recognizes Roll20 hosts without accepting lookalike domains", async () => {
  const { isRoll20Url } = await import("./session.js");
  assert.equal(isRoll20Url("https://app.roll20.net/join/123/token"), true);
  assert.equal(isRoll20Url("https://roll20.net/"), true);
  for (const url of [
    "https://roll20.net.fake.example",
    "https://fakeroll20.net/",
    "https://roll20.net@fake.example/",
    "javascript:alert(1)",
  ])
    assert.equal(isRoll20Url(url), false);
});
