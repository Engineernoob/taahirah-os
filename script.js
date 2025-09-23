// -------------------- Clock --------------------
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  document.getElementById("clock").textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000);
updateClock();

// -------------------- Pinball Icon Animation --------------------
function initPinballIcon() {
  const pinballIcon = document.getElementById("pinball-desktop-icon");
  if (pinballIcon) {
    // Add click effect
    pinballIcon.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });

    // Add periodic glow effect
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

// Initialize pinball icon when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initPinballIcon();
});

// -------------------- Window Counter --------------------
let openCount = 0;

// -------------------- Open Window --------------------
function openWindow(type) {
  const desktop = document.getElementById("desktop");
  const taskbar = document.getElementById("taskbar-buttons");

  // Track z-index for stacking
  let zCounter = 100;

  // Helper: create taskbar button with icon + title
  function createTaskButton(title, icon, win) {
    const btn = document.createElement("button");
    btn.className = "taskbar-btn";

    const img = document.createElement("img");
    img.src = icon;
    img.alt = title;

    const span = document.createElement("span");
    span.textContent = title;

    btn.appendChild(img);
    btn.appendChild(span);

    btn.addEventListener("click", () => {
      if (win.style.display === "none") {
        win.style.display = "block";
        bringToFront(win);
      } else {
        win.style.display = "none";
      }
    });

    taskbar.appendChild(btn);
    return btn;
  }

  // Helper: bring window to front
  function bringToFront(win) {
    zCounter++;
    win.style.zIndex = zCounter;
    document.querySelectorAll(".window").forEach((w) => {
      w.classList.remove("active");
    });
    win.classList.add("active");
  }

  // Make window draggable
  function makeDraggable(win, handle) {
    let offsetX = 0,
      offsetY = 0,
      isDown = false;

    handle.addEventListener("mousedown", (e) => {
      if (win.classList.contains("maximized")) return; // can't drag maximized
      isDown = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      bringToFront(win);
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });

    document.addEventListener("mouseup", () => {
      isDown = false;
    });
  }

  // Create proper 98.css window
  function makeIframeWindow(title, icon, file, width = 480, height = 360) {
    const win = document.createElement("div");
    win.className = "window";
    win.style.width = width + "px";
    win.style.height = height + "px";
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
           style="height: calc(100% - 20px); 
                  margin:0; 
                  padding:0; 
                  box-sizing:border-box; 
                  overflow:hidden;">
        <iframe src="${file}" 
          style="width:100%; 
                 height:100%; 
                 border:none; 
                 display:block; 
                 background:white; 
                 margin:0; 
                 padding:0; 
                 box-sizing:border-box;" 
          frameborder="0"></iframe>
      </div>
      <div class="resize-grip"></div>
    `;

    const titleBar = win.querySelector(".title-bar");

    // Close button
    const closeBtn = win.querySelector('[aria-label="Close"]');
    closeBtn.addEventListener("click", () => {
      win.remove();
      btn.remove();
    });

    // Minimize button
    const minBtn = win.querySelector('[aria-label="Minimize"]');
    minBtn.addEventListener("click", () => {
      win.style.display = "none";
    });

    // Maximize button
    const maxBtn = win.querySelector('[aria-label="Maximize"]');
    maxBtn.addEventListener("click", () => {
      if (win.classList.contains("maximized")) {
        win.classList.remove("maximized");
        win.style.width = width + "px";
        win.style.height = height + "px";
        win.style.left = "120px";
        win.style.top = "100px";
      } else {
        win.classList.add("maximized");
        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";
      }
    });

    // Bring to front on click
    win.addEventListener("mousedown", () => bringToFront(win));

    // Enable dragging
    makeDraggable(win, titleBar);

    desktop.appendChild(win);

    // Taskbar button
    const btn = createTaskButton(title, icon, win);

    bringToFront(win);
  }

  // Define windows
  if (type === "about") {
    makeIframeWindow(
      "About Me",
      "icons/about-me.png",
      "about-me.html",
      460,
      380
    );
  }
  if (type === "projects") {
    makeIframeWindow(
      "Projects",
      "icons/projects.png",
      "projects.html",
      500,
      380
    );
  }
  if (type === "contact") {
    makeIframeWindow("Contact", "icons/contact.png", "contact.html", 480, 380);
  }
  if (type === "resume") {
    makeIframeWindow("Resume", "icons/resume.png", "Resume-2.pdf", 600, 500);
  }
  if (type === "pinball") {
    makeIframeWindow(
      "3D Pinball: Space Cadet",
      "icons/computer-icon.png",
      "pinball/pinball.html",
      900,
      700
    );
  }
}

// -------------------- Shut Down --------------------
function shutDown() {
  // Redirect to shutdown screen
  window.location.href = "shutdown.html";
}
