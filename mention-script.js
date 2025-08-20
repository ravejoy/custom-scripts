document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("main-reply");
  let userMap = {}; // Stores users by name: { "Name": { id, avatar } }
  let dropdown;

  // Fetch users from /userlist.php and parse avatars/names
  fetch("/userlist.php")
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const rows = doc.querySelectorAll("td.tcl.username");

      rows.forEach(td => {
        const nameLink = td.querySelector("span.usersname a");
        const avatarSpan = td.querySelector("em.user-avatar a");
        if (!nameLink || !avatarSpan) return;

        const name = nameLink.textContent.trim();
        const href = nameLink.getAttribute("href");
        const idMatch = href.match(/profile\.php\?id=(\d+)/);
        const avatarStyle = avatarSpan.querySelector("span.avatar-image")?.getAttribute("style") || "";
        const avatarMatch = avatarStyle.match(/url\(['"]?(.*?)['"]?\)/);

        if (idMatch) {
          userMap[name] = {
            id: idMatch[1],
            avatar: avatarMatch ? avatarMatch[1] : "https://via.placeholder.com/32"
          };
        }
      });

      // Post content parsing: replace @Name with a profile link
      const posts = document.querySelectorAll(".post-box");
      posts.forEach(post => {
        Object.entries(userMap).forEach(([name, data]) => {
          const mentionRegex = new RegExp(`(?<![\\w@])@${name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}(?![\\w])`, 'g');
          post.innerHTML = post.innerHTML.replace(mentionRegex,
            `<a href="/profile.php?id=${data.id}" class="post-mention">@${name}</a>`
          );
        });
      });
    });

  // Mention dropdown while typing
  if (textarea) {
    textarea.addEventListener("input", () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@([\S]*)$/u);
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
      dropdown.style.padding = "4px";
      dropdown.style.zIndex = "9999";
      dropdown.style.maxHeight = "200px";
      dropdown.style.overflowY = "auto";
      dropdown.style.fontSize = "14px";
      dropdown.style.borderRadius = "4px";
      dropdown.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";

      const { top, left } = getCaretCoordinates(textarea, textarea.selectionEnd);
      const taRect = textarea.getBoundingClientRect();
      dropdown.style.left = `${taRect.left + left}px`;
      dropdown.style.top = `${taRect.top + top + window.scrollY + 20}px`;

      matches.forEach(name => {
        const { id, avatar } = userMap[name];

        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.cursor = "pointer";
        item.style.padding = "4px";
        item.style.gap = "8px";

        const img = document.createElement("img");
        img.src = avatar;
        img.width = 24;
        img.height = 24;
        img.style.borderRadius = "50%";

        const span = document.createElement("span");
        span.textContent = name;

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
    });
  }

  // Hide dropdown on outside click
  document.addEventListener("click", (e) => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.remove();
    }
  });

  // Get coordinates of caret in textarea
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
