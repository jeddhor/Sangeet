const state = {
  category: "tracks",
  mobileView: "playlist",
  nowView: "art",
  sidebarCollapsed: false,
  selectedPlaylistId: null,
  playlists: [],
  pendingTrackForPlaylist: null,
  categoryItems: [],
  tracks: [],
  currentTrackIndex: -1,
  repeatMode: "off",
  shuffle: false,
  sortField: "title",
  sortDir: "asc",
  favorites: JSON.parse(localStorage.getItem("favorites") || "[]"),
  settings: JSON.parse(localStorage.getItem("settings") || "{}")
};

const themePalette = [
  { id: "graphite-light", label: "Graphite Light", colors: ["#f5f7fa", "#005fcc", "#2c89ff"] },
  { id: "graphite-dark", label: "Graphite Dark", colors: ["#12161d", "#4d9dff", "#73b4ff"] },
  { id: "ocean-light", label: "Ocean Light", colors: ["#eaf5fb", "#0077a7", "#0098c9"] },
  { id: "ember-dark", label: "Ember Dark", colors: ["#18110f", "#e67832", "#ff964f"] },
  { id: "neon-hacker", label: "Neon Hacker", colors: ["#070c08", "#39ff72", "#0dc34d"] },
  { id: "bubblegum-light", label: "Bubblegum Cute", colors: ["#fff1f8", "#ff4f95", "#ff8ec4"] },
  { id: "synthwave-dark", label: "Synthwave Dark", colors: ["#190f2d", "#ff4fd8", "#57d7ff"] },
  { id: "mint-light", label: "Mint Light", colors: ["#e9fff8", "#0c9f7a", "#48c8a4"] }
];

const els = {
  aboutBtn: document.getElementById("aboutBtn"),
  mobileTabs: document.getElementById("mobileTabs"),
  layout: document.querySelector(".layout"),
  categoryNav: document.getElementById("categoryNav"),
  categoryItems: document.getElementById("categoryItems"),
  newPlaylistBtn: document.getElementById("newPlaylistBtn"),
  trackColumns: document.getElementById("trackColumns"),
  tracksList: document.getElementById("tracksList"),
  listTitle: document.getElementById("listTitle"),
  listSubtitle: document.getElementById("listSubtitle"),
  categoryContent: document.querySelector(".category-content"),
  sortFieldSelect: document.getElementById("sortFieldSelect"),
  sortDirBtn: document.getElementById("sortDirBtn"),
  toggleSidebarBtnMobile: document.getElementById("toggleSidebarBtnMobile"),
  sidebar: document.getElementById("sidebar"),
  searchInput: document.getElementById("searchInput"),
  settingsBtn: document.getElementById("settingsBtn"),
  playlistModal: document.getElementById("playlistModal"),
  playlistForm: document.getElementById("playlistForm"),
  playlistModalTitle: document.getElementById("playlistModalTitle"),
  playlistSelect: document.getElementById("playlistSelect"),
  newPlaylistNameInput: document.getElementById("newPlaylistNameInput"),
  playlistModalStatus: document.getElementById("playlistModalStatus"),
  cancelPlaylistBtn: document.getElementById("cancelPlaylistBtn"),
  clearNowPlayingBtn: document.getElementById("clearNowPlayingBtn"),
  settingsModal: document.getElementById("settingsModal"),
  aboutModal: document.getElementById("aboutModal"),
  settingsForm: document.getElementById("settingsForm"),
  cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
  serverUrlInput: document.getElementById("serverUrlInput"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  themeSelect: document.getElementById("themeSelect"),
  settingsStatus: document.getElementById("settingsStatus"),
  themeSwatches: document.getElementById("themeSwatches"),
  nowCoverWrap: document.getElementById("nowCoverWrap"),
  nowMobileToggle: document.getElementById("nowMobileToggle"),
  nowViewArtBtn: document.getElementById("nowViewArtBtn"),
  nowViewLyricsBtn: document.getElementById("nowViewLyricsBtn"),
  nowCover: document.getElementById("nowCover"),
  nowTitle: document.getElementById("nowTitle"),
  nowArtist: document.getElementById("nowArtist"),
  nowAlbum: document.getElementById("nowAlbum"),
  lyricsText: document.getElementById("lyricsText"),
  audioPlayer: document.getElementById("audioPlayer"),
  backBtn: document.getElementById("backBtn"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  nextBtn: document.getElementById("nextBtn"),
  stopBtn: document.getElementById("stopBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  progressSlider: document.getElementById("progressSlider"),
  currentTime: document.getElementById("currentTime"),
  duration: document.getElementById("duration"),
  volumeSlider: document.getElementById("volumeSlider")
};

function isMobileViewport() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function setMobileView(view) {
  state.mobileView = view;
  document.body.dataset.mobileView = view;
  if (els.mobileTabs) {
    els.mobileTabs.querySelectorAll(".mobile-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mobileView === view);
    });
  }
}

function setNowView(view) {
  state.nowView = view === "lyrics" ? "lyrics" : "art";
  document.body.dataset.nowView = state.nowView;

  if (els.nowViewArtBtn) {
    const artActive = state.nowView === "art";
    els.nowViewArtBtn.classList.toggle("active", artActive);
    els.nowViewArtBtn.setAttribute("aria-selected", artActive ? "true" : "false");
  }

  if (els.nowViewLyricsBtn) {
    const lyricsActive = state.nowView === "lyrics";
    els.nowViewLyricsBtn.classList.toggle("active", lyricsActive);
    els.nowViewLyricsBtn.setAttribute("aria-selected", lyricsActive ? "true" : "false");
  }
}

function setSidebarCollapsed(collapsed) {
  state.sidebarCollapsed = Boolean(collapsed);
  if (els.layout) {
    els.layout.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  }

  if (els.toggleSidebarBtnMobile && !isMobileViewport()) {
    els.toggleSidebarBtnMobile.setAttribute("aria-pressed", state.sidebarCollapsed ? "true" : "false");
    els.toggleSidebarBtnMobile.title = state.sidebarCollapsed ? "Show Library" : "Hide Library";
  }

  state.settings.sidebarCollapsed = state.sidebarCollapsed;
  localStorage.setItem("settings", JSON.stringify(state.settings));
}

function setTheme(theme) {
  document.body.dataset.theme = theme || "graphite-light";
  state.settings.theme = theme;
  localStorage.setItem("settings", JSON.stringify(state.settings));
  updateThemeSwatchState(theme);
}

function updateThemeSwatchState(theme) {
  if (!els.themeSwatches) {
    return;
  }
  const selected = theme || "graphite-light";
  els.themeSwatches.querySelectorAll(".theme-swatch").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === selected);
  });
}

function buildThemeSwatches() {
  if (!els.themeSwatches) {
    return;
  }

  els.themeSwatches.innerHTML = "";
  themePalette.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-swatch";
    button.dataset.theme = theme.id;

    const dots = theme.colors
      .map((color) => `<span class="swatch-dot" style="background:${color}"></span>`)
      .join("");

    button.innerHTML = `<span class="swatch-dots">${dots}</span><span>${theme.label}</span>`;
    button.addEventListener("click", () => {
      els.themeSelect.value = theme.id;
      setTheme(theme.id);
    });
    els.themeSwatches.appendChild(button);
  });

  updateThemeSwatchState(state.settings.theme || "graphite-light");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }

  return response.json();
}

function isFavorite(trackId) {
  return state.favorites.some((fav) => fav.id === trackId);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function sortValue(track, field) {
  if (field === "favorite") {
    return isFavorite(track.id) ? 1 : 0;
  }

  if (field === "duration") {
    const value = Number(track[field] || 0);
    return Number.isFinite(value) ? value : 0;
  }
  return normalizeText(track[field]);
}

function sortTracks(tracks) {
  const factor = state.sortDir === "desc" ? -1 : 1;
  const primary = state.sortField;

  return tracks
    .map((track, index) => ({ track, index }))
    .sort((a, b) => {
      const aPrimary = sortValue(a.track, primary);
      const bPrimary = sortValue(b.track, primary);

      if (aPrimary < bPrimary) {
        return -1 * factor;
      }
      if (aPrimary > bPrimary) {
        return 1 * factor;
      }

      const aTitle = normalizeText(a.track.title);
      const bTitle = normalizeText(b.track.title);
      if (aTitle < bTitle) {
        return -1;
      }
      if (aTitle > bTitle) {
        return 1;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.track);
}

function applySortingAndRender() {
  const currentTrack = state.currentTrackIndex >= 0 ? state.tracks[state.currentTrackIndex] : null;
  state.tracks = sortTracks(state.tracks);

  if (currentTrack) {
    state.currentTrackIndex = state.tracks.findIndex((track) => track.id === currentTrack.id);
  }

  renderTracks();
}

function updateSortUi() {
  els.sortFieldSelect.value = state.sortField;
  els.sortDirBtn.textContent = state.sortDir === "asc" ? "Asc" : "Desc";
  renderTrackHeaderState();
}

function renderTrackHeaderState() {
  const buttons = els.trackColumns ? els.trackColumns.querySelectorAll(".track-col-btn") : [];
  buttons.forEach((btn) => {
    const field = btn.dataset.sortField;
    const isActive = field === state.sortField;
    const direction = isActive ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
    btn.classList.toggle("active", isActive);
    btn.textContent = `${field.charAt(0).toUpperCase()}${field.slice(1)}${direction}`;
  });
}

function setCategoryLayout(category) {
  const showCategoryColumn = category === "genres" || category === "playlists";
  els.categoryContent.classList.toggle("no-category", !showCategoryColumn);
  els.newPlaylistBtn.classList.toggle("hidden", category !== "playlists");
}

async function refreshPlaylistsCache() {
  const payload = await api("/api/playlists");
  state.playlists = payload.items || [];
  return state.playlists;
}

function fillPlaylistSelect(preferredId = "") {
  els.playlistSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = state.playlists.length ? "Select a playlist" : "No playlists yet";
  els.playlistSelect.appendChild(emptyOption);

  state.playlists.forEach((playlist) => {
    const option = document.createElement("option");
    option.value = playlist.id;
    option.textContent = `${playlist.name} (${playlist.songCount || 0})`;
    els.playlistSelect.appendChild(option);
  });

  if (preferredId) {
    els.playlistSelect.value = preferredId;
  }
}

async function openPlaylistModal(track = null) {
  state.pendingTrackForPlaylist = track;
  els.newPlaylistNameInput.value = "";
  els.playlistModalStatus.textContent = "";
  els.playlistModalTitle.textContent = track ? `Add "${track.title}" To Playlist` : "Create Playlist";

  await refreshPlaylistsCache();
  fillPlaylistSelect(state.selectedPlaylistId || "");

  els.playlistModal.showModal();
}

function renderCategoryItems() {
  els.categoryItems.innerHTML = "";

  if (state.category !== "genres" && state.category !== "playlists") {
    return;
  }

  if (state.category === "playlists") {
    if (!state.categoryItems.length) {
      els.categoryItems.innerHTML = '<div class="list-item">No playlists yet. Use + New to create one.</div>';
      return;
    }

    for (const item of state.categoryItems) {
      const node = document.createElement("div");
      node.className = "list-item";
      node.innerHTML = `<div class="item-title"><b>${escapeHtml(item.name)}</b><span>${item.songCount || 0} songs</span></div>`;
      node.addEventListener("click", () => selectPlaylist(item));
      els.categoryItems.appendChild(node);
    }
    return;
  }

  if (!state.categoryItems.length) {
    els.categoryItems.innerHTML = '<div class="list-item">No genres found.</div>';
    return;
  }

  for (const item of state.categoryItems) {
    const node = document.createElement("div");
    node.className = "list-item";

    node.innerHTML = `<div class="item-title"><b>${escapeHtml(item.name)}</b><span>${item.songCount || 0} songs</span></div>`;
    node.addEventListener("click", () => selectGenre(item.name));
    els.categoryItems.appendChild(node);
  }
}

function favoriteSnapshot(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration || 0,
    coverArt: track.coverArt || ""
  };
}

function renderTracks() {
  els.tracksList.innerHTML = "";

  if (!state.tracks.length) {
    els.tracksList.innerHTML = '<div class="track-item">No tracks found for this selection.</div>';
    return;
  }

  state.tracks.forEach((track, index) => {
    const node = document.createElement("div");
    node.className = `track-item ${index === state.currentTrackIndex ? "active" : ""}`;

    const thumb = track.coverArt
      ? `<img class="track-thumb" src="/api/cover/${encodeURIComponent(track.coverArt)}" alt="Album art" />`
      : '<span class="track-thumb placeholder">Art</span>';

    node.innerHTML = `
      <div class="track-main">
        ${thumb}
        <div class="item-title">
          <b>${escapeHtml(track.title)}</b>
          <span>${escapeHtml(`${track.artist || "Unknown Artist"} - ${track.album || "Unknown Album"}`)}</span>
        </div>
      </div>
      <div class="genre-cell">${escapeHtml(track.genre || "-")}</div>
      <div class="duration-cell">${formatTime(track.duration || 0)}</div>
      <div class="track-actions">
        <button class="pill icon-pill playlist-add-btn" title="Add to playlist" aria-label="Add to playlist">+</button>
        <button class="pill icon-pill fav-btn" title="${isFavorite(track.id) ? "Unfavorite" : "Favorite"}" aria-label="${isFavorite(track.id) ? "Unfavorite" : "Favorite"}">${isFavorite(track.id) ? "★" : "☆"}</button>
      </div>
    `;

    const addBtn = node.querySelector(".playlist-add-btn");
    addBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await openPlaylistModal(track);
    });

    const favBtn = node.querySelector(".fav-btn");
    favBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await toggleFavorite(track);
      applySortingAndRender();
    });

    node.addEventListener("click", () => playTrack(index));
    els.tracksList.appendChild(node);
  });
}

async function toggleFavorite(track, sync = true) {
  const idx = state.favorites.findIndex((item) => item.id === track.id);
  let starred = true;

  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    starred = false;
  } else {
    state.favorites.unshift(favoriteSnapshot(track));
  }

  localStorage.setItem("favorites", JSON.stringify(state.favorites));

  if (state.category === "favorites" && !starred) {
    state.tracks = state.tracks.filter((item) => item.id !== track.id);
    if (state.currentTrackIndex >= state.tracks.length) {
      state.currentTrackIndex = state.tracks.length - 1;
    }
  }

  if (sync) {
    api(`/api/star/${track.id}`, {
      method: "POST",
      body: JSON.stringify({ starred })
    }).catch(() => {
      // Keep local favorite state even if remote sync is temporarily unavailable.
    });
  }
}

async function loadCategory(category, query = "") {
  state.category = category;
  state.currentTrackIndex = -1;
  if (category !== "playlists") {
    state.selectedPlaylistId = null;
  }
  setCategoryLayout(category);

  if (category === "genres") {
    const response = await api(`/api/library/genres?query=${encodeURIComponent(query)}`);
    state.categoryItems = response.items || [];
    state.tracks = [];

    els.listTitle.textContent = "Genres";
    els.listSubtitle.textContent = "Choose a genre to see matching tracks.";
    renderCategoryItems();
    renderTracks();
    return;
  }

  state.categoryItems = [];
  renderCategoryItems();

  if (category === "favorites") {
    const response = await api(`/api/library/favorites?query=${encodeURIComponent(query)}`);
    state.tracks = response.items || [];

    // Keep local quick lookup aligned with server favorites metadata.
    state.favorites = state.tracks.map(favoriteSnapshot);
    localStorage.setItem("favorites", JSON.stringify(state.favorites));

    els.listTitle.textContent = "Favorites";
    els.listSubtitle.textContent = `${state.tracks.length} favorited songs`;
    applySortingAndRender();
    return;
  }

  if (category === "playlists") {
    const response = await api(`/api/library/playlists?query=${encodeURIComponent(query)}`);
    state.categoryItems = response.items || [];
    state.playlists = state.categoryItems.slice();
    state.tracks = [];

    els.listTitle.textContent = "Playlists";
    els.listSubtitle.textContent = "Choose a playlist from the left column.";
    renderCategoryItems();
    renderTracks();
    return;
  }

  const response = await api(`/api/library/tracks?query=${encodeURIComponent(query)}`);
  state.tracks = response.items || [];
  els.listTitle.textContent = "Tracks";
  els.listSubtitle.textContent = `${state.tracks.length} songs`;
  applySortingAndRender();
}

async function selectPlaylist(playlist) {
  state.selectedPlaylistId = playlist.id;
  const result = await api(`/api/list/playlist/${playlist.id}`);
  state.tracks = result.tracks || [];
  state.currentTrackIndex = -1;

  els.listTitle.textContent = result.title || playlist.name;
  els.listSubtitle.textContent = `${state.tracks.length} tracks`;
  applySortingAndRender();

  if (isMobileViewport()) {
    setMobileView("playlist");
  }
}

async function selectGenre(name) {
  const result = await api(`/api/list/genre/${encodeURIComponent(name)}`);
  state.tracks = result.tracks || [];
  state.currentTrackIndex = -1;

  els.listTitle.textContent = result.title || "Genres";
  els.listSubtitle.textContent = `${state.tracks.length} tracks`;
  applySortingAndRender();

  if (isMobileViewport()) {
    setMobileView("playlist");
  }
}

async function fetchLyrics(trackId) {
  try {
    const payload = await api(`/api/lyrics/${trackId}`);
    const text = String(payload.lyrics || "").trim();
    els.lyricsText.textContent = text || "No lyrics found for this song.";
  } catch (error) {
    els.lyricsText.textContent = "Lyrics unavailable.";
  }
}

function updateNowPlaying(track) {
  els.nowTitle.textContent = track.title;
  els.nowArtist.textContent = track.artist;
  els.nowAlbum.textContent = track.album;
  if (track.coverArt) {
    els.nowCover.src = `/api/cover/${track.coverArt}`;
    els.nowCoverWrap.classList.remove("no-cover");
  } else {
    els.nowCover.removeAttribute("src");
    els.nowCoverWrap.classList.add("no-cover");
  }
  fetchLyrics(track.id);
}

function clearNowPlaying() {
  els.audioPlayer.pause();
  els.audioPlayer.currentTime = 0;
  els.audioPlayer.removeAttribute("src");
  els.playPauseBtn.textContent = "▶";

  state.currentTrackIndex = -1;
  renderTracks();

  els.nowTitle.textContent = "Nothing playing";
  els.nowArtist.textContent = "-";
  els.nowAlbum.textContent = "-";
  els.lyricsText.textContent = "Lyrics will appear here when available.";
  els.nowCover.removeAttribute("src");
  els.nowCoverWrap.classList.add("no-cover");
}

function playTrack(index) {
  if (index < 0 || index >= state.tracks.length) {
    return;
  }

  state.currentTrackIndex = index;
  const track = state.tracks[index];
  els.audioPlayer.src = `/api/stream/${track.id}`;
  els.audioPlayer.play().catch(() => {});
  els.playPauseBtn.textContent = "⏸";
  updateNowPlaying(track);
  renderTracks();
}

function nextTrack() {
  if (!state.tracks.length) {
    return;
  }

  if (state.shuffle) {
    const random = Math.floor(Math.random() * state.tracks.length);
    playTrack(random);
    return;
  }

  const next = state.currentTrackIndex + 1;
  if (next >= state.tracks.length) {
    if (state.repeatMode === "all") {
      playTrack(0);
    } else {
      els.audioPlayer.pause();
      els.playPauseBtn.textContent = "▶";
    }
    return;
  }

  playTrack(next);
}

function prevTrack() {
  if (!state.tracks.length) {
    return;
  }

  const prev = Math.max(0, state.currentTrackIndex - 1);
  playTrack(prev);
}

function cycleRepeatMode() {
  if (state.repeatMode === "off") {
    state.repeatMode = "all";
  } else if (state.repeatMode === "all") {
    state.repeatMode = "one";
  } else {
    state.repeatMode = "off";
  }

  els.repeatBtn.textContent = `Repeat: ${state.repeatMode === "all" ? "All" : state.repeatMode === "one" ? "One" : "Off"}`;
}

async function runSearch(text) {
  const q = text.trim();
  if (!q) {
    await loadCategory(state.category);
    return;
  }

  const result = await api(`/api/search?q=${encodeURIComponent(q)}`);
  state.currentTrackIndex = -1;
  state.tracks = result.tracks || [];
  els.listTitle.textContent = `Search: ${q}`;
  els.listSubtitle.textContent = `${state.tracks.length} results`;
  applySortingAndRender();
}

function bindEvents() {
  els.categoryNav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      els.categoryNav.querySelectorAll("button").forEach((node) => node.classList.remove("active"));
      btn.classList.add("active");
      await loadCategory(btn.dataset.category);
      if (isMobileViewport()) {
        setMobileView("playlist");
      }
    });
  });

  if (els.mobileTabs) {
    els.mobileTabs.querySelectorAll(".mobile-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setMobileView(btn.dataset.mobileView);
      });
    });
  }

  const onToggleLibrary = () => {
    if (isMobileViewport()) {
      setMobileView("library");
      return;
    }

    setSidebarCollapsed(!state.sidebarCollapsed);
  };

  if (els.toggleSidebarBtnMobile) {
    els.toggleSidebarBtnMobile.addEventListener("click", onToggleLibrary);
  }

  if (els.nowViewArtBtn) {
    els.nowViewArtBtn.addEventListener("click", () => {
      setNowView("art");
    });
  }

  if (els.nowViewLyricsBtn) {
    els.nowViewLyricsBtn.addEventListener("click", () => {
      setNowView("lyrics");
    });
  }

  if (els.aboutBtn && els.aboutModal) {
    els.aboutBtn.addEventListener("click", () => {
      els.aboutModal.showModal();
    });
  }

  els.settingsBtn.addEventListener("click", () => {
    els.settingsModal.showModal();
  });

  els.newPlaylistBtn.addEventListener("click", async () => {
    await openPlaylistModal(null);
  });

  els.nowCover.addEventListener("error", () => {
    els.nowCover.removeAttribute("src");
    els.nowCoverWrap.classList.add("no-cover");
  });

  els.clearNowPlayingBtn.addEventListener("click", () => {
    clearNowPlaying();
  });

  els.cancelSettingsBtn.addEventListener("click", () => {
    els.settingsModal.close();
  });

  els.cancelPlaylistBtn.addEventListener("click", () => {
    els.playlistModal.close();
  });

  els.playlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const previousCategory = state.category;
    const selectedPlaylistId = els.playlistSelect.value;
    const newName = els.newPlaylistNameInput.value.trim();
    const pendingTrack = state.pendingTrackForPlaylist;

    try {
      let targetPlaylistId = selectedPlaylistId;

      if (newName) {
        const created = await api("/api/playlists", {
          method: "POST",
          body: JSON.stringify({
            name: newName,
            songIds: pendingTrack ? [pendingTrack.id] : []
          })
        });
        targetPlaylistId = created.playlist && created.playlist.id ? created.playlist.id : "";
      } else {
        if (!selectedPlaylistId) {
          throw new Error("Choose an existing playlist or enter a new playlist name.");
        }

        if (pendingTrack) {
          await api(`/api/playlists/${selectedPlaylistId}/songs`, {
            method: "POST",
            body: JSON.stringify({ songIds: [pendingTrack.id] })
          });
        }
      }

      if (previousCategory === "playlists") {
        await loadCategory("playlists");
        if (targetPlaylistId) {
          const target = state.categoryItems.find((item) => item.id === targetPlaylistId);
          if (target) {
            await selectPlaylist(target);
          }
        }
      } else {
        await refreshPlaylistsCache();
      }

      state.pendingTrackForPlaylist = null;
      els.playlistModalStatus.textContent = "Saved.";
      setTimeout(() => {
        els.playlistModal.close();
        els.playlistModalStatus.textContent = "";
      }, 250);
    } catch (error) {
      els.playlistModalStatus.textContent = error.message;
    }
  });

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.settingsForm);
    const nextSettings = {
      serverUrl: String(formData.get("serverUrl") || ""),
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      theme: String(formData.get("theme") || "graphite-light")
    };

    setTheme(nextSettings.theme);

    try {
      await api("/api/session", {
        method: "POST",
        body: JSON.stringify(nextSettings)
      });

      state.settings = nextSettings;
      localStorage.setItem("settings", JSON.stringify(state.settings));
      els.settingsStatus.textContent = "Connected successfully.";
      await loadCategory(state.category);

      setTimeout(() => {
        els.settingsModal.close();
      }, 250);
    } catch (error) {
      els.settingsStatus.textContent = error.message;
    }
  });

  let searchTimer = null;
  els.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      runSearch(els.searchInput.value).catch((error) => {
        els.listSubtitle.textContent = error.message;
      });
    }, 220);
  });

  if (els.trackColumns) {
    els.trackColumns.querySelectorAll(".track-col-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextField = btn.dataset.sortField;
        if (state.sortField === nextField) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortField = nextField;
          state.sortDir = "asc";
        }

        state.settings.sortField = state.sortField;
        state.settings.sortDir = state.sortDir;
        localStorage.setItem("settings", JSON.stringify(state.settings));
        updateSortUi();
        applySortingAndRender();
      });
    });
  }

  els.sortFieldSelect.addEventListener("change", () => {
    state.sortField = els.sortFieldSelect.value;
    state.settings.sortField = state.sortField;
    localStorage.setItem("settings", JSON.stringify(state.settings));
    applySortingAndRender();
  });

  els.themeSelect.addEventListener("change", () => {
    setTheme(els.themeSelect.value);
  });

  els.sortDirBtn.addEventListener("click", () => {
    state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    state.settings.sortDir = state.sortDir;
    localStorage.setItem("settings", JSON.stringify(state.settings));
    updateSortUi();
    applySortingAndRender();
  });

  els.playPauseBtn.addEventListener("click", () => {
    if (!els.audioPlayer.src && state.tracks.length) {
      playTrack(0);
      return;
    }

    if (els.audioPlayer.paused) {
      els.audioPlayer.play().catch(() => {});
      els.playPauseBtn.textContent = "⏸";
    } else {
      els.audioPlayer.pause();
      els.playPauseBtn.textContent = "▶";
    }
  });

  els.nextBtn.addEventListener("click", nextTrack);
  els.backBtn.addEventListener("click", prevTrack);

  els.stopBtn.addEventListener("click", () => {
    els.audioPlayer.pause();
    els.audioPlayer.currentTime = 0;
    els.playPauseBtn.textContent = "▶";
  });

  els.shuffleBtn.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    els.shuffleBtn.style.borderColor = state.shuffle ? "var(--accent)" : "var(--line)";
  });

  els.repeatBtn.addEventListener("click", cycleRepeatMode);

  els.audioPlayer.addEventListener("timeupdate", () => {
    const ratio = els.audioPlayer.duration ? (els.audioPlayer.currentTime / els.audioPlayer.duration) * 100 : 0;
    els.progressSlider.value = String(ratio || 0);
    els.currentTime.textContent = formatTime(els.audioPlayer.currentTime);
    els.duration.textContent = formatTime(els.audioPlayer.duration);
  });

  els.progressSlider.addEventListener("input", () => {
    if (!els.audioPlayer.duration) {
      return;
    }

    const ratio = Number(els.progressSlider.value) / 100;
    els.audioPlayer.currentTime = ratio * els.audioPlayer.duration;
  });

  els.volumeSlider.addEventListener("input", () => {
    els.audioPlayer.volume = Number(els.volumeSlider.value);
  });

  els.audioPlayer.addEventListener("ended", () => {
    if (state.repeatMode === "one") {
      playTrack(state.currentTrackIndex);
      return;
    }
    nextTrack();
  });
}

async function bootstrap() {
  const existing = state.settings;

  els.serverUrlInput.value = existing.serverUrl || "";
  els.usernameInput.value = existing.username || "";
  els.passwordInput.value = existing.password || "";
  const savedTheme = existing.theme || "graphite-light";
  els.themeSelect.value = savedTheme;

  const allowedSortFields = new Set(["title", "genre", "duration", "favorite"]);
  state.sortField = allowedSortFields.has(existing.sortField) ? existing.sortField : "title";
  state.sortDir = existing.sortDir || "asc";
  state.sidebarCollapsed = Boolean(existing.sidebarCollapsed);
  updateSortUi();

  buildThemeSwatches();
  setTheme(savedTheme);
  setMobileView("playlist");
  els.nowCoverWrap.classList.add("no-cover");
  els.audioPlayer.volume = Number(els.volumeSlider.value);
  bindEvents();
  setCategoryLayout(state.category);

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      setMobileView("playlist");
      setSidebarCollapsed(state.sidebarCollapsed);
    } else {
      setMobileView(state.mobileView || "playlist");
    }
  });

  setSidebarCollapsed(state.sidebarCollapsed);

  if (existing.serverUrl && existing.username && existing.password) {
    try {
      await api("/api/session", {
        method: "POST",
        body: JSON.stringify(existing)
      });
      await loadCategory(state.category);
      return;
    } catch (error) {
      els.listSubtitle.textContent = "Open settings to configure Navidrome connection.";
    }
  }

  els.listSubtitle.textContent = "Configure your Navidrome server in Settings.";
}

bootstrap();
