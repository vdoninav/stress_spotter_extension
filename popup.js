const toggle = document.getElementById('toggle');
const updateBtn = document.getElementById('update');

chrome.storage.sync.get('enabled', data => {
  toggle.checked = data.enabled ?? true;
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
  chrome.tabs.reload();
});

updateBtn.addEventListener('click', () => {
  alert('Функция обновления пока не реализована');
});