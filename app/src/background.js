importScripts('messages.js', 'providers/google.js');

const activeProvider = GoogleTranslateProvider;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== MessageType.translate) {
    return false;
  }

  activeProvider.translate(message.text, message.targetLang)
    .then(result => sendResponse({ ok: true, result }))
    .catch(error => sendResponse({ ok: false, error: error.message }));

  return true;
});
