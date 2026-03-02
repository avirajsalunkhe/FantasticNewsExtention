const availableCategories = ["business", "entertainment", "general", "health", "science", "sports", "technology"];
let selectedCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('category-grid');
  const isEnabledToggle = document.getElementById('isEnabled');
  const intervalSelect = document.getElementById('interval');
  const saveBtn = document.getElementById('save-btn');
  const msg = document.getElementById('msg');
  const statusDot = document.getElementById('status-dot');
  const githubLink = document.getElementById('github-link');

  // Ensure the link opens in a new tab (Required for some browser contexts)
  githubLink.onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: githubLink.href });
  };

  // Create Category Buttons
  availableCategories.forEach(cat => {
    const btn = document.createElement('div');
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

  // Load Saved Data
  chrome.storage.sync.get(["categories", "interval", "isEnabled"], (data) => {
    if (data.categories) {
      selectedCategories = data.categories;
      selectedCategories.forEach(cat => {
        const btn = document.getElementById(`cat-${cat}`);
        if (btn) btn.classList.add('active');
      });
    }
    if (data.interval) intervalSelect.value = data.interval;
    
    const active = data.isEnabled !== false;
    isEnabledToggle.checked = active;
    statusDot.style.background = active ? "#10b981" : "#ef4444";
  });

  // Save Logic
  saveBtn.onclick = () => {
    if (selectedCategories.length === 0) {
      alert("Please select at least one interest.");
      return;
    }

    const active = isEnabledToggle.checked;
    chrome.storage.sync.set({
      categories: selectedCategories,
      interval: intervalSelect.value,
      isEnabled: active
    }, () => {
      statusDot.style.background = active ? "#10b981" : "#ef4444";
      msg.style.display = 'block';
      setTimeout(() => msg.style.display = 'none', 2000);
    });
  };
});