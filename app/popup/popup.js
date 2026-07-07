let currentTargetLang = 'ru';

const grid = document.getElementById('lang-grid');
const search = document.getElementById('lang-search');
const status = document.getElementById('status');
const dropdown = document.getElementById('ui-lang-dropdown');
const selectedBtn = document.getElementById('ui-lang-selected');
const menu = document.getElementById('ui-lang-menu');

function applyI18n() {
  document.getElementById('ext-name').textContent = i18n('extName');
  document.getElementById('ui-lang-label').textContent = i18n('interfaceLanguage');
  document.getElementById('target-lang-label').textContent = i18n('targetLanguage');
  search.placeholder = i18n('searchLanguage');
}

function renderUiLangSelector() {
  const current = getLangData(_currentUiLang);
  selectedBtn.innerHTML = `<span class="lang-flag">${current.flag}</span><span>${current.label}</span>`;

  menu.innerHTML = UI_LANGUAGES.map(code => {
    const data = getLangData(code);
    return `
      <div class="ui-lang-option ${code === _currentUiLang ? 'active' : ''}" data-code="${code}">
        <span class="lang-flag">${data.flag}</span>
        <span>${data.label}</span>
      </div>
    `;
  }).join('');
}

function renderGrid(filter = '') {
  const query = filter.toLowerCase();

  const filtered = LANGUAGES.filter(code => {
    if (!query) {
      return true;
    }

    const data = getLangData(code);
    return data.label.toLowerCase().includes(query) || code.includes(query);
  });

  grid.innerHTML = filtered.map(code => {
    const data = getLangData(code);
    return `
      <div class="lang-item ${code === currentTargetLang ? 'active' : ''}" data-code="${code}">
        <span class="lang-flag">${data.flag}</span>
        <span class="lang-name">${data.label}</span>
        <span class="lang-code">${code}</span>
      </div>
    `;
  }).join('');
}

function showStatus(msg) {
  status.textContent = msg;
  status.style.opacity = '1';
  setTimeout(() => { status.style.opacity = '0'; }, 1500);
}

function renderAll() {
  applyI18n();
  renderUiLangSelector();
  renderGrid(search.value);
}

selectedBtn.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});

menu.addEventListener('click', (e) => {
  const option = e.target.closest('.ui-lang-option');
  if (!option) {
    return;
  }

  _currentUiLang = option.dataset.code;
  chrome.storage.local.set({ uiLang: _currentUiLang });
  dropdown.classList.remove('open');
  renderAll();
  showStatus(i18n('savedMessage'));
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

grid.addEventListener('click', (e) => {
  const item = e.target.closest('.lang-item');
  if (!item) {
    return;
  }

  currentTargetLang = item.dataset.code;
  chrome.storage.local.set({ targetLang: currentTargetLang });
  renderGrid(search.value);
  showStatus(i18n('savedMessage'));
});

search.addEventListener('input', () => {
  renderGrid(search.value);
});

chrome.storage.local.get({ targetLang: 'ru', uiLang: 'en' }, (result) => {
  currentTargetLang = result.targetLang;
  _currentUiLang = result.uiLang;
  renderAll();
});
