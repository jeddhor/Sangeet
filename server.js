const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;
let httpServer = null;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const session = {
  serverUrl: "",
  username: "",
  password: ""
};

const SUBSONIC_API_VERSION = "1.16.1";
const SUBSONIC_CLIENT_NAME = "node-navidrome-client";

function md5(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

function normalizeServerUrl(url) {
  if (!url) {
    return "";
  }
  return url.replace(/\/$/, "");
}

function validateSession() {
  return Boolean(session.serverUrl && session.username && session.password);
}

function subsonicAuthParams() {
  const salt = crypto.randomBytes(6).toString("hex");
  const token = md5(session.password + salt);
  return {
    u: session.username,
    t: token,
    s: salt,
    v: SUBSONIC_API_VERSION,
    c: SUBSONIC_CLIENT_NAME,
    f: "json"
  };
}

async function callSubsonic(method, extraParams = {}, options = {}) {
  if (!validateSession()) {
    throw new Error("Navidrome settings are missing");
  }

  const params = new URLSearchParams(subsonicAuthParams());
  if (extraParams instanceof URLSearchParams) {
    for (const [key, value] of extraParams.entries()) {
      params.append(key, value);
    }
  } else {
    for (const [key, value] of Object.entries(extraParams || {})) {
      params.append(key, value);
    }
  }

  const url = `${session.serverUrl}/rest/${method}.view?${params.toString()}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: options.headers || {}
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Navidrome request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const root = payload["subsonic-response"];

  if (!root || root.status !== "ok") {
    const message = root && root.error ? root.error.message : "Unknown Navidrome error";
    throw new Error(message);
  }

  return root;
}

function toTrackView(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist || "Unknown Artist",
    album: track.album || "Unknown Album",
    duration: track.duration || 0,
    track: track.track || 0,
    year: track.year || "",
    genre: track.genre || "",
    coverArt: track.coverArt || "",
    starred: Boolean(track.starred)
  };
}

function safeArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function toPlaylistView(playlist) {
  return {
    id: playlist.id,
    name: playlist.name || "Untitled Playlist",
    owner: playlist.owner || "",
    songCount: playlist.songCount || 0,
    duration: playlist.duration || 0,
    coverArt: playlist.coverArt || ""
  };
}

function normalizeLyricsText(value) {
  const raw = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!raw) {
    return "";
  }

  const lrcTokenRegex = /\[(?:\d{1,2}:\d{2}(?:\.\d{1,3})?|\d{1,2}:\d{2}|\d+)\]/g;
  const hasLrcTiming = lrcTokenRegex.test(raw);
  const lrcMetadataRegex = /^\[(?:ar|ti|al|by|offset|re|ve):.*\]$/i;

  if (!hasLrcTiming && !raw.includes("[")) {
    return raw;
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(lrcTokenRegex, "").trim())
    .filter((line) => line && !lrcMetadataRegex.test(line));

  return lines.join("\n").trim() || raw;
}

function extractLyricsText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return normalizeLyricsText(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => extractLyricsText(item))
      .filter(Boolean);
    return normalizeLyricsText(parts.join("\n"));
  }

  if (typeof value === "object") {
    const fields = ["value", "text", "lyrics", "content", "line", "data"];
    for (const field of fields) {
      if (field in value) {
        const extracted = extractLyricsText(value[field]);
        if (extracted) {
          return extracted;
        }
      }
    }
  }

  return "";
}

function extractLyricsFromRoot(root) {
  const list = root.lyricsList || {};
  const structured = safeArray(list.structuredLyrics);
  for (const entry of structured) {
    const lang = String(entry.lang || entry.language || "").toLowerCase();
    const text = extractLyricsText(entry.line || entry.lines || entry.lyrics || entry.text || entry.value || "");

    if (text && (lang === "eng" || lang === "en" || !lang)) {
      return text;
    }
  }

  const plain = safeArray(list.lyrics);
  for (const entry of plain) {
    if (typeof entry === "string" && entry.trim()) {
      return normalizeLyricsText(entry);
    }

    const lang = String(entry.lang || entry.language || "").toLowerCase();
    const value = extractLyricsText(entry.value || entry.text || entry.lyrics || entry.content || entry.data || "");
    if (value && (lang === "eng" || lang === "en" || !lang)) {
      return value;
    }
  }

  return "";
}

function extractTagLyrics(song) {
  function normalizeToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function isLyricsToken(value) {
    const token = normalizeToken(value);
    return token === "lyrics" || token === "lyricseng" || token === "syncedlyrics" || token === "unsyncedlyrics";
  }

  function extractText(value) {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return normalizeLyricsText(value);
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => extractText(item))
        .filter(Boolean);
      if (!parts.length) {
        return "";
      }
      return normalizeLyricsText(parts.join("\n"));
    }

    if (typeof value === "object") {
      const preferred = ["lyrics", "value", "text", "content", "data", "line"];
      for (const key of preferred) {
        if (key in value) {
          const text = extractText(value[key]);
          if (text) {
            return text;
          }
        }
      }
    }

    return "";
  }

  if (!song || typeof song !== "object") {
    return "";
  }

  const stack = [song];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (isLyricsToken(key)) {
        const text = extractText(value);
        if (text) {
          return text;
        }
      }

      if (value && typeof value === "object") {
        stack.push(value);
      }
    }

    // Handle tag-entry shapes like { name: "lyrics:eng", value: "..." }.
    const marker = current.key || current.name || current.tag || current.field || current.id;
    if (isLyricsToken(marker)) {
      const text = extractText(current.value || current.text || current.content || current.values || current.data || current.lyrics);
      if (text) {
        return text;
      }
    }
  }

  return "";
}

app.post("/api/session", async (req, res) => {
  try {
    const { serverUrl, username, password } = req.body;
    session.serverUrl = normalizeServerUrl(serverUrl);
    session.username = username || "";
    session.password = password || "";

    await callSubsonic("ping");
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
});

app.get("/api/session", (req, res) => {
  res.json({
    configured: validateSession(),
    serverUrl: session.serverUrl,
    username: session.username
  });
});

app.get("/api/library/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { query = "" } = req.query;

    if (category === "tracks") {
      const root = await callSubsonic("getRandomSongs", { size: "250" });
      const songs = safeArray(root.randomSongs && root.randomSongs.song).map(toTrackView);
      const filtered = query
        ? songs.filter((song) => song.title.toLowerCase().includes(String(query).toLowerCase()))
        : songs;
      res.json({ category, items: filtered });
      return;
    }

    if (category === "genres") {
      const root = await callSubsonic("getGenres");
      const genres = safeArray(root.genres && root.genres.genre).map((genre) => ({
        name: genre.value,
        songCount: genre.songCount || 0,
        albumCount: genre.albumCount || 0
      }));
      const filtered = query
        ? genres.filter((genre) => genre.name.toLowerCase().includes(String(query).toLowerCase()))
        : genres;
      res.json({ category, items: filtered });
      return;
    }

    if (category === "favorites") {
      const root = await callSubsonic("getStarred2");
      const songs = safeArray(root.starred2 && root.starred2.song).map(toTrackView);
      const filtered = query
        ? songs.filter((song) => song.title.toLowerCase().includes(String(query).toLowerCase()))
        : songs;
      res.json({ category, items: filtered });
      return;
    }

    if (category === "playlists") {
      const root = await callSubsonic("getPlaylists");
      const playlists = safeArray(root.playlists && root.playlists.playlist).map(toPlaylistView);
      const filtered = query
        ? playlists.filter((playlist) => playlist.name.toLowerCase().includes(String(query).toLowerCase()))
        : playlists;
      res.json({ category, items: filtered });
      return;
    }

    res.status(400).json({ message: `Unsupported category: ${category}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/list/:category/:id", async (req, res) => {
  try {
    const { category, id } = req.params;

    if (category === "genre") {
      const root = await callSubsonic("getSongsByGenre", { genre: id, count: "250" });
      const songs = safeArray(root.songsByGenre && root.songsByGenre.song).map(toTrackView);
      res.json({ title: id, subtitle: "Genre", tracks: songs });
      return;
    }

    if (category === "tracks") {
      const root = await callSubsonic("getRandomSongs", { size: "250" });
      const songs = safeArray(root.randomSongs && root.randomSongs.song).map(toTrackView);
      res.json({ title: "Tracks", subtitle: "Random", tracks: songs });
      return;
    }

    if (category === "playlist") {
      const root = await callSubsonic("getPlaylist", { id });
      const playlist = root.playlist || {};
      const entries = safeArray(playlist.entry).map(toTrackView);
      res.json({
        title: playlist.name || "Playlist",
        subtitle: `${entries.length} songs`,
        tracks: entries
      });
      return;
    }

    res.status(400).json({ message: `Unsupported list category: ${category}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      res.json({ tracks: [] });
      return;
    }

    const root = await callSubsonic("search3", {
      query: q,
      songCount: "250",
      albumCount: "20",
      artistCount: "20"
    });

    const tracks = safeArray(root.searchResult3 && root.searchResult3.song).map(toTrackView);
    res.json({ tracks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/star/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { starred } = req.body;

    if (starred) {
      await callSubsonic("star", { id });
    } else {
      await callSubsonic("unstar", { id });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.get("/api/lyrics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const root = await callSubsonic("getLyricsBySongId", { id });
    let lyrics = extractLyricsFromRoot(root);

    if (!lyrics) {
      const songRoot = await callSubsonic("getSong", { id });
      lyrics = extractTagLyrics(songRoot.song);
    }

    res.json({
      lyrics: lyrics || ""
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/cover/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const params = new URLSearchParams({
      ...subsonicAuthParams(),
      id,
      size: "600"
    });

    const url = `${session.serverUrl}/rest/getCoverArt.view?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      res.status(404).end();
      return;
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/stream/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const params = new URLSearchParams({
      ...subsonicAuthParams(),
      id,
      maxBitRate: "320"
    });

    const url = `${session.serverUrl}/rest/stream.view?${params.toString()}`;
    const headers = {};
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const response = await fetch(url, { headers });
    if (!response.ok || !response.body) {
      const text = await response.text();
      res.status(response.status).json({ message: text || "Stream failed" });
      return;
    }

    res.status(response.status);
    ["content-type", "content-length", "accept-ranges", "content-range"].forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/playlists", async (req, res) => {
  try {
    const root = await callSubsonic("getPlaylists");
    const playlists = safeArray(root.playlists && root.playlists.playlist).map(toPlaylistView);
    res.json({ items: playlists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/playlists", async (req, res) => {
  try {
    const { name, songIds = [] } = req.body;
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      res.status(400).json({ message: "Playlist name is required" });
      return;
    }

    const ids = safeArray(songIds).filter(Boolean);
    const params = new URLSearchParams();
    params.append("name", trimmedName);
    ids.forEach((id) => {
      params.append("songId", String(id));
    });

    const root = await callSubsonic("createPlaylist", params);
    res.json({
      ok: true,
      playlist: toPlaylistView(root.playlist || { name: trimmedName, songCount: ids.length })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/playlists/:id/songs", async (req, res) => {
  try {
    const { id } = req.params;
    const { songIds = [] } = req.body;
    const ids = safeArray(songIds).filter(Boolean);

    if (!ids.length) {
      res.status(400).json({ message: "At least one song id is required" });
      return;
    }

    const params = new URLSearchParams();
    params.append("playlistId", String(id));
    ids.forEach((songId) => {
      params.append("songIdToAdd", String(songId));
    });

    await callSubsonic("updatePlaylist", params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function startServer(options = {}) {
  const requestedPort = Number(options.port ?? process.env.PORT ?? PORT);
  const port = Number.isFinite(requestedPort) ? requestedPort : 3000;
  const host = options.host || process.env.HOST || "0.0.0.0";

  if (httpServer) {
    const address = httpServer.address();
    return Promise.resolve({
      server: httpServer,
      port: address && typeof address === "object" ? address.port : port,
      host
    });
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      httpServer = server;
      const address = server.address();
      resolve({
        server,
        port: address && typeof address === "object" ? address.port : port,
        host
      });
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

function stopServer() {
  if (!httpServer) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      httpServer = null;
      resolve();
    });
  });
}

if (require.main === module) {
  startServer({ port: PORT })
    .then(({ port }) => {
      console.log(`Sangeet running on http://localhost:${port}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  app,
  startServer,
  stopServer
};