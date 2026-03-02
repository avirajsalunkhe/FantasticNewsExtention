document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');
  const newsImg = document.getElementById('news-image');
  const heroWrapper = document.getElementById('hero-wrapper');
  const newsSource = document.getElementById('news-source');
  const newsTitle = document.getElementById('news-title');
  const newsDesc = document.getElementById('news-desc');
  const newsLink = document.getElementById('news-link');
  const timerText = document.getElementById('timer-text');
  const timerProgress = document.getElementById('timer-progress');
  const skipBtn = document.getElementById('skip-btn');
  const closeBtn = document.getElementById('close-btn');

  const isExtension = typeof chrome !== 'undefined' && chrome.storage;

  const startCountdown = (durationMs) => {
    if (!durationMs) return;

    let remainingSeconds = Math.floor(durationMs / 1000);
    const totalSeconds = remainingSeconds;

    const updateTimer = () => {
      if (remainingSeconds < 0) {
        clearInterval(countdownInterval);
        return;
      }

      // Update Text
      timerText.textContent = `${remainingSeconds}s left`;

      // Update Progress Bar width
      const percentage = (remainingSeconds / totalSeconds) * 100;
      timerProgress.style.width = `${percentage}%`;

      remainingSeconds--;
    };

    updateTimer(); // Initial call
    const countdownInterval = setInterval(updateTimer, 1000);
  };

  const populateUI = (data) => {
    const article = data.currentNews;
    const durationMs = data.timerDurationMs;

    if (!article) {
      newsTitle.textContent = "Waiting for news...";
      loader.classList.add('hidden');
      mainContent.classList.remove('hidden');
      return;
    }

    newsTitle.textContent = article.title;
    newsDesc.textContent = article.description || "No description available. Click below for the full story.";
    newsSource.textContent = article.source?.name || "Global News";
    newsLink.href = article.url;

    if (article.urlToImage) {
      newsImg.src = article.urlToImage;
      newsImg.onload = () => {
        loader.classList.add('hidden');
        mainContent.classList.remove('hidden');
      };
      newsImg.onerror = () => {
        heroWrapper.style.display = 'none';
        loader.classList.add('hidden');
        mainContent.classList.remove('hidden');
      };
    } else {
      heroWrapper.style.display = 'none';
      loader.classList.add('hidden');
      mainContent.classList.remove('hidden');
    }

    // Start the visual timer
    startCountdown(durationMs);
  };

  if (isExtension) {
    chrome.storage.local.get(["currentNews", "timerDurationMs"], (result) => {
      populateUI(result);
    });
  } else {
    // Mock for development
    setTimeout(() => {
      populateUI({
        currentNews: {
          title: "NASA's Voyager 1 Sends Signal Back to Earth After Months of Silence",
          description: "Engineers successfully restored communication with the most distant human-made object in space, marking a significant win for deep space exploration.",
          source: { name: "Science Daily" },
          url: "#",
          urlToImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000"
        },
        timerDurationMs: 30000 // 30 seconds
      });
    }, 1000);
  }

  closeBtn.addEventListener('click', () => window.close());
  skipBtn.addEventListener('click', () => {
    if (isExtension) {
      chrome.storage.sync.set({ skipNext: true }, () => window.close());
    } else {
      window.close();
    }
  });
});