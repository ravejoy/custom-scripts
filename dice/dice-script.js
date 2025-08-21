// dice-script.js
(function () {
  if (window.__diceScriptLoaded) return;
  window.__diceScriptLoaded = true;

  const modal = document.getElementById('dice-modal');
  const openBtn = document.getElementById('dice-trigger');
  const closeBtn = document.getElementById('dice-close');
  const submitBtn = document.getElementById('dice-submit');

  openBtn?.addEventListener('click', () => modal.style.display = 'flex');
  closeBtn?.addEventListener('click', () => modal.style.display = 'none');

  submitBtn?.addEventListener('click', () => {
    const sides1 = parseInt(document.getElementById('dice-sides-1').value);
    const sides2raw = document.getElementById('dice-sides-2').value;
    const sides3raw = document.getElementById('dice-sides-3').value;
    const sides2 = sides2raw.trim() === '' ? null : parseInt(sides2raw);
    const sides3 = sides3raw.trim() === '' ? null : parseInt(sides3raw);
    const bonus = parseInt(document.getElementById('dice-bonus').value) || 0;
    const reason = document.getElementById('dice-reason').value.trim().replace(/\s+/g, ' ').replace("]", " ");

    const textarea = document.querySelector('textarea#main-reply[name="req_message"]');
    if (textarea && /\[newDice(?:Multi)?=/i.test(textarea.value)) {
      alert("В этом сообщении уже есть бросок кубика. Можно только один.");
      return;
    }

    if (!sides1 || sides1 < 2 || sides1 > 1000 ||
      (sides2 === 0 || (sides2 && (sides2 < 2 || sides2 > 1000))) ||
      (sides3 === 0 || (sides3 && (sides3 < 2 || sides3 > 1000)))) {
      alert("Укажите корректное количество граней.");
      return;
    }

    const parts = [`1d${sides1}`];
    if (sides2) parts.push(`1d${sides2}`);
    if (sides3) parts.push(`1d${sides3}`);

    const resultTag = `[newDiceMulti=${parts.join('+')}:${bonus}:${reason}]`;

    if (typeof smile === 'function') {
      smile(resultTag);
    } else {
      console.log("Dice: " + resultTag);
    }

    modal.style.display = 'none';
  });
})();
