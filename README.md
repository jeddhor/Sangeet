# ✦ Sangeet ✦

<p align="center">
  <strong>A colorful, responsive Navidrome web client built with Node.js + Express.</strong><br/>
  Browse fast, play smoothly, and keep your listening flow in one elegant UI.
</p>

<p align="center">
  <img alt="Node 18+" src="https://img.shields.io/badge/Node.js-18%2B-3c873a?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-111827?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-0b7285?style=for-the-badge" />
</p>

## ✨ Highlights

- 🎛 Desktop-friendly 3-pane layout: Library, Playlist, and Now Playing.
- 📱 Mobile-ready views with quick section switching.
- 🎵 Playback controls: play/pause, previous/next, stop, seek, volume, random, repeat.
- 🔎 Fast search for songs, artists, and albums.
- ❤️ Favorites with local state and Navidrome star/unstar sync.
- 🗂 Library categories: Tracks, Genres, Favorites, Playlists.
- 📜 Lyrics support with fallback handling for raw tags and timed lyric formats.
- 🎨 Multiple built-in themes with visual swatches.
- ➕ Playlist creation and add-to-playlist flows.

## 🧱 Stack

- Backend: Node.js, Express
- Frontend: Vanilla HTML, CSS, JavaScript
- API: Navidrome Subsonic-compatible REST endpoints

## 🚀 Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm start
```

3. Open in browser:

```text
http://localhost:3000
```

4. Open Settings (⚙) and enter:

- Navidrome Server URL
- Username
- Password
- Theme

## ⚙ Development

Run in watch mode:

```bash
npm run dev
```

If port 3000 is already in use (common when multiple sessions are open), run with a custom port:

```powershell
$env:PORT=3003; npm start
```

## 🧭 App Behavior

- Click the app title ✦ Sangeet ✦ to open the About screen.
- On desktop, the top-right hamburger toggles library collapse/expand.
- On mobile Now Playing, you can switch between Art and Lyrics views.

## 🔐 Security Notes

- Credentials are sent to the backend session route and used for Subsonic token auth (`u`, `t`, `s`, `v`, `c`, `f=json`).
- Playback and artwork are proxied through the backend, so the browser does not need direct Navidrome API auth.

## 📝 License

This project is licensed under the MIT License.