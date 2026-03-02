const availableCategories = ["business", "entertainment", "general", "health", "science", "sports", "technology"];
let selectedCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('category-grid');
  const isEnabledToggle = document.getElementById('isEnabled');
  const intervalSelect = document.getElementById('interval');
  const saveBtn = document.getElementById('save-btn');
  const statusMsg = document.getElementById('save-status');

  // 1. Create Category Buttons
  availableCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.className = "pill";
    btn.onclick = () => {
      if (selectedCategories.includes(cat)) {
        selectedCategories = selectedCategories.filter(c => c !== cat);
        btn.classList.remove('active');
      } else {
        selectedCategories.push(cat);
        btn.classList.add('active');
      }
    };
    btn.id = `cat-${cat}`;
    container.appendChild(btn);
  });

  // 2. Load Saved Settings from Chrome Storage
  chrome.storage.sync.get(["categories", "interval", "isEnabled"], (data) => {
    if (data.categories) {
      selectedCategories = data.categories;
      selectedCategories.forEach(cat => {
        const btn = document.getElementById(`cat-${cat}`);
        if (btn) btn.classList.add('active');
      });
    }
    if (data.interval) intervalSelect.value = data.interval;
    isEnabledToggle.checked = data.isEnabled !== false;
  });

  // 3. Save Logic
  saveBtn.onclick = () => {
    if (selectedCategories.length === 0) {
      alert("Please pick at least one category!");
      return;
    }
    chrome.storage.sync.set({
      categories: selectedCategories,
      interval: intervalSelect.value,
      isEnabled: isEnabledToggle.checked
    }, () => {
      statusMsg.style.display = 'block';
      setTimeout(() => statusMsg.style.display = 'none', 3000);
    });
  };
});