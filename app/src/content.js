(() => {
  const ICONS = {
    translate: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    undo: `<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1.04-6.83 2.73L2.5 7.7V16h8.3l-3.07-3.07A7.09 7.09 0 0 1 12.5 11c3.22 0 5.98 2.09 6.93 5l2.22-.74A9.47 9.47 0 0 0 12.5 8z"/></svg>`,
  };

  let activeBubble = null;
  let translationState = null;

  chrome.storage.local.get({ uiLang: 'en' }, (result) => {
    _currentUiLang = result.uiLang;
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.uiLang) {
      _currentUiLang = changes.uiLang.newValue;
    }
  });

  function removeBubble() {
    if (!activeBubble) {
      return;
    }

    activeBubble.remove();
    activeBubble = null;
  }

  function removeUndoBar() {
    const existing = document.querySelector('.qt-undo-bar');
    if (existing) {
      existing.remove();
    }
  }

  function getSelectedTextNodes() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return [];
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const root = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!range.intersectsNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const elementsMap = new Map();

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const parent = textNode.parentElement;

      if (!parent || elementsMap.has(parent)) {
        continue;
      }

      const text = parent.textContent.trim();
      if (text.length < 2) {
        continue;
      }

      elementsMap.set(parent, {
        element: parent,
        originalText: parent.innerHTML,
        text,
      });
    }

    return [...elementsMap.values()];
  }

  function positionBubble(bubble, x, y) {
    const margin = 8;
    const rect = bubble.getBoundingClientRect();

    let left = x;
    let top = y + margin;

    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - margin;
    }

    if (left < margin) {
      left = margin;
    }

    if (top + rect.height > window.innerHeight + window.scrollY) {
      top = y - rect.height - margin;
    }

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }

  function createTriggerBubble(x, y) {
    removeBubble();

    const bubble = document.createElement('div');
    bubble.className = 'qt-bubble';
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y + 8}px`;

    const trigger = document.createElement('button');
    trigger.className = 'qt-trigger';
    trigger.innerHTML = ICONS.translate;
    trigger.title = i18n('translateTooltip');

    trigger.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      translateInPlace();
    });

    bubble.appendChild(trigger);
    document.body.appendChild(bubble);
    activeBubble = bubble;

    positionBubble(bubble, x, y + 8);
  }

  async function translateInPlace() {
    const entries = getSelectedTextNodes();

    if (entries.length === 0) {
      return;
    }

    removeBubble();
    window.getSelection()?.removeAllRanges();

    translationState = {
      entries,
      translated: false,
    };

    entries.forEach(entry => {
      entry.element.classList.add('qt-translating');
    });

    showUndoBar(entries.length, true);

    try {
      const translations = await Promise.all(
        entries.map(entry => Translator.translate(entry.text))
      );

      entries.forEach((entry, i) => {
        entry.element.textContent = translations[i].translatedText;
        entry.element.classList.remove('qt-translating');
        entry.element.classList.add('qt-translated');
      });

      translationState.translated = true;
      showUndoBar(entries.length, false);
    } catch (error) {
      restoreOriginals(entries);
      removeUndoBar();
      console.error('Translation failed:', error);
    }
  }

  function restoreOriginals(entries) {
    entries.forEach(entry => {
      entry.element.innerHTML = entry.originalText;
      entry.element.classList.remove('qt-translated', 'qt-translating');
    });

    translationState = null;
  }

  function showUndoBar(count, isLoading) {
    removeUndoBar();

    const bar = document.createElement('div');
    bar.className = 'qt-undo-bar';

    if (isLoading) {
      bar.innerHTML = `
        <div class="qt-undo-content">
          <div class="qt-spinner"></div>
          <span>${i18n('translatingCount', count)}</span>
        </div>
      `;
    } else {
      bar.innerHTML = `
        <div class="qt-undo-content">
          <span>${i18n('translatedCount', count)}</span>
          <button class="qt-undo-btn">
            ${ICONS.undo}
            <span>${i18n('undoButton')}</span>
          </button>
        </div>
      `;

      bar.querySelector('.qt-undo-btn').addEventListener('click', () => {
        if (translationState) {
          restoreOriginals(translationState.entries);
        }
        removeUndoBar();
      });
    }

    document.body.appendChild(bar);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('mouseup', (e) => {
    if (activeBubble?.contains(e.target)) {
      return;
    }

    if (e.target.closest('.qt-undo-bar')) {
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (!text || text.length < 2) {
        removeBubble();
        return;
      }

      createTriggerBubble(e.pageX, e.pageY);
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (activeBubble?.contains(e.target)) {
      return;
    }

    if (e.target.closest('.qt-undo-bar')) {
      return;
    }

    removeBubble();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeBubble();

      if (translationState) {
        restoreOriginals(translationState.entries);
        removeUndoBar();
      }
    }
  });
})();
