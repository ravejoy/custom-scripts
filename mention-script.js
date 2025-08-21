document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("main-reply");
  let userMap = {};
  let dropdown;
  let activeIndex = -1;

  fetch("/userlist.php")
    .then(res => res.arrayBuffer())
    .then(buffer => {
      const decoder = new TextDecoder("windows-1251");
      const html = decoder.decode(buffer);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const rows = doc.querySelectorAll("td.tcl.username");

      rows.forEach(td => {
        const nameLink = td.querySelector("span.usersname a");
        const avatarSpan = td.querySelector("em.user-avatar a");

        if (!nameLink || !avatarSpan) return;

        const name = nameLink.textContent.trim();
        const href = nameLink.getAttribute("href");
        const match = href.match(/profile\.php\?id=(\d+)/);
        const avatarStyle = avatarSpan.querySelector("span.avatar-image")?.getAttribute("style") || "";
        const avatarMatch = avatarStyle.match(/url\(['"]?(.*?)['"]?\)/);

        if (match) {
          userMap[name] = {
            id: match[1],
            avatar: avatarMatch ? avatarMatch[1] : "https://via.placeholder.com/40"
          };
        }
      });

      // Replace mentions in posts
      const posts = document.querySelectorAll(".post-box");
      posts.forEach(post => {
        Object.entries(userMap).forEach(([name, data]) => {
          const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(?<![\\w@])@${escaped}(?![\\w])`, "g");
          post.innerHTML = post.innerHTML.replace(regex,
            `<a href="/profile.php?id=${data.id}" class="post-mention">@${name}</a>`
          );
        });
      });
    });

  if (textarea) {
    textarea.addEventListener("input", () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@([\w\u0400-\u04FF\s\-']*)$/);

      if (!atMatch || Object.keys(userMap).length === 0) {
        if (dropdown) dropdown.remove();
        return;
      }

      const prefix = atMatch[1].toLowerCase();
      let matches = Object.keys(userMap).filter(name =>
        name.toLowerCase().includes(prefix)
      );

      if (matches.length === 0) {
        if (dropdown) dropdown.remove();
        return;
      }

      // Сортування: спочатку ті, що починаються з префікса
      matches.sort((a, b) => {
        const aStart = a.toLowerCase().startsWith(prefix) ? 0 : 1;
        const bStart = b.toLowerCase().startsWith(prefix) ? 0 : 1;
        return aStart - bStart;
      });

      if (dropdown) dropdown.remove();
      dropdown = document.createElement("div");
      dropdown.style.position = "absolute";
      dropdown.style.background = "#fff";
      dropdown.style.border = "1px solid #ccc";
      dropdown.style.zIndex = "9999";
      dropdown.style.maxHeight = "280px";
      dropdown.style.overflowY = "auto";
      dropdown.style.borderRadius = "8px";
      dropdown.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
      dropdown.style.minWidth = "240px";
      dropdown.style.fontFamily = "system-ui, sans-serif";

      const { top, left } = getCaretCoordinates(textarea, textarea.selectionEnd);
      const taRect = textarea.getBoundingClientRect();
      dropdown.style.left = `${taRect.left + left}px`;
      dropdown.style.top = `${taRect.top + top + window.scrollY + 20}px`;

      activeIndex = 0; // автоселект першого елемента

      matches.forEach((name, index) => {
        const { id, avatar } = userMap[name];

        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "12px";
        item.style.padding = "10px 16px";
        item.style.cursor = "pointer";
        item.style.transition = "background 0.15s ease-in-out";

        const span = document.createElement("span");
        const lowerName = name.toLowerCase();
        const matchStart = lowerName.indexOf(prefix);
        if (matchStart !== -1) {
          const before = name.slice(0, matchStart);
          const match = name.slice(matchStart, matchStart + prefix.length);
          const after = name.slice(matchStart + prefix.length);
          span.innerHTML = `${before}<strong style="color:#5865F2">${match}</strong>${after}`;
        } else {
          span.textContent = name;
        }

        span.style.fontSize = "16px";
        span.style.fontWeight = "600";
        span.style.whiteSpace = "nowrap";
        span.style.overflow = "hidden";
        span.style.textOverflow = "ellipsis";
        span.style.color = "#000";

        const img = document.createElement("img");
        img.src = avatar;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.flexShrink = "0";

        item.appendChild(img);
        item.appendChild(span);

        item.addEventListener("click", () => {
          textarea.value =
            textarea.value.slice(0, atMatch.index) + "@" + name + " ";
          textarea.focus();
          dropdown.remove();
        });

        item.addEventListener("mouseenter", () => {
          activeIndex = index;
          refreshHighlight();
        });

        dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);

      const items = dropdown.querySelectorAll("div");

      function refreshHighlight() {
        items.forEach((el, i) => {
          const isActive = i === activeIndex;
          el.style.background = isActive ? "#5865F2" : "transparent";
          const textSpan = el.querySelector("span");
          if (textSpan) textSpan.style.color = isActive ? "#fff" : "#000";
        });
        if (items[activeIndex]) {
          items[activeIndex].scrollIntoView({ block: "nearest" });
        }
      }

      refreshHighlight();

      textarea.addEventListener("keydown", (e) => {
        if (!dropdown || items.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          refreshHighlight();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          refreshHighlight();
        } else if (e.key === "Enter") {
          if (activeIndex >= 0 && activeIndex < items.length) {
            e.preventDefault();
            items[activeIndex].click();
          }
        } else if (e.key === "Escape") {
          dropdown.remove();
        }
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.remove();
    }
  });

  function getCaretCoordinates(el, pos) {
    const div = document.createElement("div");
    const style = getComputedStyle(el);
    for (const prop of style) {
      div.style[prop] = style[prop];
    }
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.overflow = "hidden";
    div.style.height = el.offsetHeight + "px";
    div.style.width = el.offsetWidth + "px";

    const text = el.value.substring(0, pos);
    const span = document.createElement("span");
    span.textContent = "\u200b";

    div.textContent = text;
    div.appendChild(span);
    document.body.appendChild(div);

    const { offsetTop: top, offsetLeft: left } = span;
    document.body.removeChild(div);
    return { top, left };
  }
});
