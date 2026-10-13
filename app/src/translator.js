const Translator = (() => {
  let _targetLang = 'ru';

  chrome.storage.local.get({ targetLang: 'ru' }, (result) => {
    _targetLang = result.targetLang;
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.targetLang) {
      _targetLang = changes.targetLang.newValue;
    }
  });

  return {
    getTargetLanguage() {
      return _targetLang;
    },

    async translate(text) {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.translate,
        text,
        targetLang: _targetLang,
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? 'No response from background worker');
      }

      return response.result;
    },
  };
})();
