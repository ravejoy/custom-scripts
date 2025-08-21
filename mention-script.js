document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("main-reply");
  let userMap = {}; // { "Username": { id: "2", avatar: "..." } }
  let dropdown;
  let activeIndex = -1;

  // Load users from /userlist.php with proper decoding
  fetch("/userlist.php")
    .then(response => response.arrayBuffer())
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
            avatar: avatarMatch ? avatarMatch[1] : "https://via.placeholder.com/32"
          };
        }
      });

      // Mention rendering in posts
      const posts = document.querySelectorAll(".post-box");
      posts.forEach(post => {
        Object.entries(userMap).forEach(([name, data]) => {
          const escaped = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape special chars
          const regex = new RegExp(`(?<![\\w@])@${escaped}(?![\\w])`, 'g');
          post.innerHTML = post.innerHTML.replace(regex,
            `<a href="/profile.php?id=${data.id}" class="post-mention">@${name}</a>`
          );
        });
      });
    })
    .catch(err => console.error("Failed to fetch user list", err));

  // Show mention dropdown in textarea on @
  if (textarea) {
    textarea.addEventListener("input", () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@([\w\u0400-\u04FF\s\-']*)$/); // Cyrillic + latin + spaces

      if (!atMatch || Object.keys(userMap).length === 0) {
        if (dropdown) dropdown.remove();
        return;
      }

      const prefix = atMatch[1].toLowerCase();
      const matches = Object.keys(userMap).filter(name =>
        name.toLowerCase().startsWith(prefix)
      );

      if (matches.length === 0) {
        if (dropdown) dropdown.remove();
        return;
      }

      if (dropdown) dropdown.remove();
      dropdown = document.createElement("div");
      dropdown.style.position = "absolute";
      dropdown.style.background = "#fff";
      dropdown.style.border = "1px solid #ccc";
      dropdown.style.padding = "4px 0";
      dropdown.style.zIndex = "9999";
      dropdown.style.maxHeight = "250px";
      dropdown.style.overflowY = "auto";
      dropdown.style.fontSize = "14px";
      dropdown.style.borderRadius = "6px";
      dropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      dropdown.style.minWidth = "180px";

      const { top, left } = getCaretCoordinates(textarea, textarea.selectionEnd);
      const taRect = textarea.getBoundingClientRect();
      dropdown.style.left = `${taRect.left + left}px`;
      dropdown.style.top = `${taRect.top + top + window.scrollY + 20}px`;

      activeIndex = -1;

      matches.forEach((name, index) => {
        const { id, avatar } = userMap[name];

        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.cursor = "pointer";
        item.style.padding = "6px 10px";
        item.style.gap = "10px";
        item.style.transition = "background 0.2s ease-in-out";
        item.style.borderBottom = "1px solid #eee";

        const setActive = (active) => {
          item.style.background = active ? "#d6e0f5" : "transparent";
        };

        item.addEventListener("mouseenter", () => setActive(true));
        item.addEventListener("mouseleave", () => setActive(false));

        const img = document.createElement("img");
        img.src = avatar;
        img.width = 32;
        img.height = 32;
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.flexShrink = "0";

        const span = document.createElement("span");
        span.textContent = name;
        span.style.fontSize = "15px";
        span.style.fontWeight = "500";
        span.style.whiteSpace = "nowrap";
        span.style.overflow = "hidden";
        span.style.textOverflow = "ellipsis";

        item.appendChild(img);
        item.appendChild(span);

        item.addEventListener("click", () => {
          textarea.value =
            textarea.value.slice(0, atMatch.index) + "@" + name + " ";
          textarea.focus();
          dropdown.remove();
        });

        dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);

      // Save reference to all items
      const items = dropdown.querySelectorAll("div");
      textarea.addEventListener("keydown", (e) => {
        if (!dropdown || items.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (e.key === "Enter") {
          if (activeIndex >= 0 && activeIndex < items.length) {
            e.preventDefault();
            items[activeIndex].click();
          }
        } else if (e.key === "Escape") {
          dropdown.remove();
          return;
        } else {
          return;
        }

        items.forEach((el, i) => {
          el.style.background = i === activeIndex ? "#d6e0f5" : "transparent";
        });
      });
    });
  }

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.remove();
    }
  });

  // Calculate caret coordinates for dropdown positioning
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
