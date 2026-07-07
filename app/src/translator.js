const Translator = (() => {
  let _provider = GoogleTranslateProvider;
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
    setProvider(provider) {
      _provider = provider;
    },

    getProvider() {
      return _provider;
    },

    getTargetLanguage() {
      return _targetLang;
    },

    async translate(text) {
      return _provider.translate(text, _targetLang);
    },
  };
})();
