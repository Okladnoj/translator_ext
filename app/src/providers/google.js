const GoogleTranslateProvider = {
  name: 'Google Translate',
  id: 'google',

  async translate(text, targetLang = 'ru', sourceLang = 'auto') {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', sourceLang);
    url.searchParams.set('tl', targetLang);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedSegments = data[0]
      .filter(segment => segment[0])
      .map(segment => segment[0]);

    const detectedLang = data[2] || sourceLang;

    return {
      translatedText: translatedSegments.join(''),
      detectedLanguage: detectedLang,
      provider: this.name,
    };
  },
};
