// dice-script.js
(function () {
if (window.__diceScriptLoaded) return;
window.__diceScriptLoaded = true;


// === Insert modal and button dynamically ===
document.addEventListener("DOMContentLoaded", () => {
if (!document.getElementById('dice-modal')) {
const modalHTML = `
<div id="dice-modal" class="dice-modal-overlay" style="display:none;">
<div class="dice-modal">
<div class="close-btn" id="dice-close">×</div>
<h2>🎲 Бросок кубиков</h2>


<label>Грани первого кубика</label>
<input type="number" id="dice-sides-1" min="2" max="1000" value="6" />


<label>Грани второго кубика</label>
<input type="number" id="dice-sides-2" min="2" max="1000" placeholder="Один кубик? Это поле не трогай" />


<label>Грани третьего кубика</label>
<input type="number" id="dice-sides-3" min="2" max="1000" placeholder="Если тебе надо" />


<label>Бонус</label>
<input type="number" id="dice-bonus" value="0" />


<label>Причина броска <span style="font-weight: normal; color: #aaa;">(необязательно)</span></label>
<textarea id="dice-reason" rows="2" placeholder="например: Защита от атаки Волдеморта"></textarea>


<button type="button" id="dice-submit">Бросить</button>
</div>
</div>`;


const triggerBtn = document.createElement('input');
triggerBtn.type = 'button';
triggerBtn.id = 'dice-trigger';
triggerBtn.value = '🎲 Кинуть Дайс';


document.body.insertAdjacentHTML('beforeend', modalHTML);
document.body.appendChild(triggerBtn);
}
});

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
