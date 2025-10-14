// -------------------- Clock --------------------
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const clock = document.getElementById("clock");
  if (clock) {
    clock.textContent = `${hours}:${minutes}`;
  }
}
setInterval(updateClock, 1000);
updateClock();

// -------------------- Global State --------------------
let startMenuEl;
let startButtonEl;
let taskbarButtonsEl;
let desktopEl;

const windowRegistry = new Map();
let windowIdCounter = 0;
let zIndexCounter = 1000;

const WINDOW_PRESETS = {
  about: {
    title: "About Me",
    icon: "icons/about-me.png",
    file: "about-me.html",
    width: 460,
    height: 380,
  },
  projects: {
    title: "Projects",
    icon: "icons/projects.png",
    file: "projects.html",
    width: 500,
    height: 380,
  },
  "case-study": {
    title: "Case Study",
    icon: "icons/win-98-logo.png",
    file: "case-ai-lab.html",
    width: 660,
    height: 640,
  },
  contact: {
    title: "Contact",
    icon: "icons/contact.png",
    file: "contact.html",
    width: 480,
    height: 380,
  },
  resume: {
    title: "Resume",
    icon: "icons/resume.png",
    file: "Resume-2.pdf",
    width: 600,
    height: 500,
  },
  "skills-radar": {
    title: "Skills Radar",
    icon: "icons/computer-icon.png",
    file: "skills-radar.html",
    width: 720,
    height: 560,
  },
  pinball: {
    title: "3D Pinball: Space Cadet",
    icon: "icons/computer-icon.png",
    file: "pinball/pinball.html",
    width: 900,
    height: 700,
  },
};

// -------------------- Pinball Icon Animation --------------------
function initPinballIcon() {
  const pinballIcon = document.getElementById("pinball-desktop-icon");
  if (pinballIcon) {
    pinballIcon.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });

    setInterval(() => {
      if (!pinballIcon.matches(":hover")) {
        pinballIcon.style.filter =
          "brightness(1.2) drop-shadow(0 0 10px rgba(0, 255, 136, 0.5))";
        setTimeout(() => {
          pinballIcon.style.filter = "";
        }, 1000);
      }
    }, 5000);
  }
}

// -------------------- Setup --------------------
document.addEventListener("DOMContentLoaded", () => {
  startMenuEl = document.getElementById("start-menu");
  startButtonEl = document.getElementById("start-button");
  taskbarButtonsEl = document.getElementById("taskbar-buttons");
  desktopEl = document.getElementById("desktop");

  initPinballIcon();
  setupDesktopIcons();
  setupStartMenu();
  setupGlobalListeners();
});

function setupDesktopIcons() {
  const icons = document.querySelectorAll(".desktop-icon");
  icons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const type = icon.dataset.window;
      if (type) {
        openWindow(type);
      }
    });
  });
}

function setupStartMenu() {
  if (!startButtonEl || !startMenuEl) return;

  startButtonEl.addEventListener("click", () => {
    toggleStartMenu();
  });

  startButtonEl.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      toggleStartMenu(true);
    }
  });
}

function setupGlobalListeners() {
  document.addEventListener("click", (event) => {
    if (!startMenuEl || startMenuEl.hasAttribute("hidden")) return;
    if (
      !startMenuEl.contains(event.target) &&
      (!startButtonEl || !startButtonEl.contains(event.target))
    ) {
      toggleStartMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleStartMenu(false);
      return;
    }

    const commandKeyPressed =
      event.key === "Meta" || (event.ctrlKey && event.key === "Escape");
    if (commandKeyPressed && !event.repeat) {
      event.preventDefault();
      toggleStartMenu();
      if (startButtonEl) {
        startButtonEl.focus();
      }
    }
  });

  window.addEventListener("message", handleWindowMessage);
}

function focusFirstStartMenuItem() {
  if (!startMenuEl) return;
  const firstLink = startMenuEl.querySelector(".start-menu-list a");
  if (firstLink) {
    firstLink.focus();
  }
}

function toggleStartMenu(forceOpen) {
  if (!startMenuEl || !startButtonEl) return;

  const isHidden = startMenuEl.hasAttribute("hidden");
  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : isHidden;

  if (shouldOpen) {
    startMenuEl.removeAttribute("hidden");
    startButtonEl.setAttribute("aria-expanded", "true");
    requestAnimationFrame(focusFirstStartMenuItem);
  } else if (!isHidden) {
    startMenuEl.setAttribute("hidden", "");
    startButtonEl.setAttribute("aria-expanded", "false");
  }
}

// -------------------- Window Management --------------------
function openWindow(type) {
  if (!desktopEl || !taskbarButtonsEl) return;

  toggleStartMenu(false);
  const preset = WINDOW_PRESETS[type];
  if (!preset) return;

  // Bring existing window to front if already open.
  for (const entry of windowRegistry.values()) {
    if (entry.meta.type === type) {
      const { win, btn } = entry;
      if (win.style.display === "none") {
        win.style.display = "block";
      }
      bringToFront(win);
      setTaskButtonState(btn, true);
      return;
    }
  }

  makeIframeWindow({ ...preset, type });
}

function makeIframeWindow({ title, icon, file, width, height, type }) {
  const win = document.createElement("div");
  win.className = "window";
  const windowId = `window-${++windowIdCounter}`;
  win.dataset.windowId = windowId;
  win.dataset.windowType = type;
  win.style.width = `${width}px`;
  win.style.height = `${height}px`;
  win.style.position = "absolute";
  win.style.left = 120 + Math.random() * 100 + "px";
  win.style.top = 100 + Math.random() * 80 + "px";

  win.innerHTML = `
    <div class="title-bar">
      <div class="title-bar-text">${title}</div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body"
         style="height: calc(100% - 20px); margin:0; padding:0; box-sizing:border-box; overflow:hidden;">
      <iframe src="${file}"
        style="width:100%; height:100%; border:none; display:block; background:white; margin:0; padding:0; box-sizing:border-box;"
        frameborder="0"></iframe>
    </div>
    <div class="resize-grip"></div>
  `;

  desktopEl.appendChild(win);

  const btn = createTaskButton({ id: windowId, title, icon, win });
  windowRegistry.set(windowId, {
    win,
    btn,
    meta: { type },
  });

  const titleBar = win.querySelector(".title-bar");
  const closeBtn = win.querySelector('[aria-label="Close"]');
  const minBtn = win.querySelector('[aria-label="Minimize"]');
  const maxBtn = win.querySelector('[aria-label="Maximize"]');

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeWindowById(windowId));
  }

  if (minBtn) {
    minBtn.addEventListener("click", () => {
      win.style.display = "none";
      setTaskButtonState(btn, false);
    });
  }

  if (maxBtn) {
    maxBtn.addEventListener("click", () => {
      const isMaximized = win.classList.contains("maximized");
      if (isMaximized) {
        win.classList.remove("maximized");
        if (win.dataset.prevLeft && win.dataset.prevTop) {
          win.style.left = win.dataset.prevLeft;
          win.style.top = win.dataset.prevTop;
          win.style.width = win.dataset.prevWidth;
          win.style.height = win.dataset.prevHeight;
        }
      } else {
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevTop = win.style.top;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.classList.add("maximized");
        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";
      }
      bringToFront(win);
    });
  }

  if (titleBar) {
    makeDraggable(win, titleBar);
  }

  win.addEventListener("mousedown", () => bringToFront(win));
  bringToFront(win);
}

function createTaskButton({ id, title, icon, win }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "taskbar-btn";
  btn.dataset.windowId = id;

  const img = document.createElement("img");
  img.src = icon;
  img.alt = "";

  const span = document.createElement("span");
  span.textContent = title;

  btn.appendChild(img);
  btn.appendChild(span);

  btn.addEventListener("click", () => {
    const isHidden = win.style.display === "none";
    if (isHidden) {
      win.style.display = "block";
      bringToFront(win);
      setTaskButtonState(btn, true);
    } else {
      win.style.display = "none";
      setTaskButtonState(btn, false);
    }
  });

  taskbarButtonsEl.appendChild(btn);
  setTaskButtonState(btn, true);
  return btn;
}

function setTaskButtonState(btn, isActive) {
  btn.classList.toggle("active", isActive);
  btn.setAttribute("aria-pressed", String(isActive));
}

function bringToFront(win) {
  zIndexCounter += 1;
  win.style.zIndex = zIndexCounter;

  document.querySelectorAll('.window[data-window-id]').forEach((otherWin) => {
    if (otherWin !== win) {
      otherWin.classList.remove("active");
    }
  });
  win.classList.add("active");

  const windowId = win.dataset.windowId;
  for (const entry of windowRegistry.values()) {
    const isCurrent = entry.win.dataset.windowId === windowId;
    setTaskButtonState(entry.btn, isCurrent && entry.win.style.display !== "none");
  }
}

function makeDraggable(win, handle) {
  let offsetX = 0;
  let offsetY = 0;
  let isDown = false;

  handle.addEventListener("mousedown", (event) => {
    if (win.classList.contains("maximized")) return;
    isDown = true;
    offsetX = event.clientX - win.offsetLeft;
    offsetY = event.clientY - win.offsetTop;
    bringToFront(win);
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDown) return;
    win.style.left = event.clientX - offsetX + "px";
    win.style.top = event.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    isDown = false;
  });
}

function closeWindowById(id) {
  const entry = windowRegistry.get(id);
  if (!entry) return;

  const { win, btn } = entry;
  if (btn && btn.parentNode) {
    btn.parentNode.removeChild(btn);
  }
  if (win && win.parentNode) {
    win.parentNode.removeChild(win);
  }

  windowRegistry.delete(id);

  const remaining = Array.from(windowRegistry.values()).filter(
    ({ win: remainingWin }) => remainingWin.style.display !== "none"
  );
  if (remaining.length) {
    const last = remaining[remaining.length - 1];
    bringToFront(last.win);
  }
}

function handleWindowMessage(event) {
  if (event.data !== "closeWindow") return;

  for (const [id, entry] of windowRegistry.entries()) {
    const iframe = entry.win.querySelector("iframe");
    if (iframe && iframe.contentWindow === event.source) {
      closeWindowById(id);
      break;
    }
  }
}

// -------------------- Shut Down --------------------
function shutDown() {
  window.location.href = "shutdown.html";
}
