(async () => {
  // 1) Проверяем, включено ли расширение
  const { enabled } = await chrome.storage.sync.get('enabled');
  console.log('Словарь ударений: enabled =', enabled);
  if (!enabled) return;

  // 2) Загружаем словарь
  const url = chrome.runtime.getURL('data/stress_dictionary.json');
  console.log('Словарь ударений: URL словаря →', url);
  let dict;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error('Словарь ударений: не удалось загрузить словарь, статус', resp.status);
      return;
    }
    dict = await resp.json();
    console.log('Словарь ударений: записей в словаре =', Object.keys(dict).length);
  } catch (e) {
    console.error('Словарь ударений: ошибка fetch →', e);
    return;
  }

  // 3) Готовим RegExp
  const escapeRe = s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const words = Object.keys(dict).map(escapeRe);
  // Unicode lookarounds для границ слов
  const pattern = `(?<![\\p{L}\\p{M}])(${words.join('|')})(?![\\p{L}\\p{M}])`;
  const re = new RegExp(pattern, 'giu');

  // 4) Собираем ВСЕ текстовые узлы в массив
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentNode;
    if (parent && !parent.closest('script, style, textarea')) {
      textNodes.push(node);
    }
  }

  // 5) Обрабатываем каждый узел из массива
  textNodes.forEach(n => {
    const text = n.textContent;
    const matches = Array.from(text.matchAll(re));
    if (!matches.length) return;

    console.log(`Найдено ${matches.length} вхождений в узле:`, matches.map(m => m[0]));

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    for (const m of matches) {
      const word = m[0];
      const idx = m.index;
      // текст до вхождения
      frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
      // создаём подсветку
      const span = document.createElement('span');
      span.className = 'highlight-with-stress';
      span.textContent = word;
      // тултип
      const tip = document.createElement('span');
      tip.className = 'tooltip-stress';
      tip.textContent = dict[word.toLowerCase()];
      span.appendChild(tip);
      frag.appendChild(span);
      lastIndex = idx + word.length;
    }
    // остаток текста
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    // заменяем узел
    n.parentNode.replaceChild(frag, n);
  });
})();
