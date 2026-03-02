// --- CONFIGURATION ---
const NEWS_API_KEY = "431b51af0fc548738b6fab9f1abd41de"; 
const DEFAULT_INTERVAL = 15; 

let currentNewsWindowId = null;
let autoCloseTimer = null;

// --- INITIALIZATION ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["categories", "interval", "isEnabled"], (data) => {
    if (!data.categories) {
      chrome.storage.sync.set({
        categories: ["general", "technology"],
        interval: DEFAULT_INTERVAL,
        isEnabled: true,
        skipNext: false
      });
    }
    setupAlarm(data.interval || DEFAULT_INTERVAL);
  });
});

// Handle Browser Startup for "Once a Day" feature
chrome.runtime.onStartup.addListener(() => {
  checkOnceADayNews();
});

async function checkOnceADayNews() {
  const settings = await chrome.storage.sync.get(["interval", "isEnabled"]);
  if (!settings.isEnabled || settings.interval !== "once-a-day") return;

  const today = new Date().toLocaleDateString();
  const data = await chrome.storage.local.get("lastStartupRun");

  if (data.lastStartupRun !== today) {
    checkAndShowNews();
    chrome.storage.local.set({ lastStartupRun: today });
  }
}

function setupAlarm(interval) {
  if (interval === "once-a-day") {
    chrome.alarms.clear("fetchNews");
    return;
  }

  let mins = parseFloat(interval);
  if (isNaN(mins) || mins <= 0) mins = DEFAULT_INTERVAL;

  chrome.alarms.clear("fetchNews", () => {
    chrome.alarms.create("fetchNews", { periodInMinutes: mins });
  });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.interval) {
    setupAlarm(changes.interval.newValue);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchNews") {
    checkAndShowNews();
  }
});

async function checkAndShowNews() {
  if (currentNewsWindowId !== null) {
    try {
      await chrome.windows.get(currentNewsWindowId);
      return; 
    } catch (e) {
      currentNewsWindowId = null;
    }
  }

  const settings = await chrome.storage.sync.get(["categories", "isEnabled", "skipNext", "interval"]);
  if (!settings.isEnabled) return;
  if (settings.skipNext) {
    await chrome.storage.sync.set({ skipNext: false });
    return;
  }

  const categoryList = settings.categories || ["general"];
  const category = categoryList[Math.floor(Math.random() * categoryList.length)];
  
  try {
    const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.articles && data.articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.articles.length);
      const article = data.articles[randomIndex];
      
      // --- NEW TIMING LOGIC ---
      // 10s for Test (0.5 mins), 15s for everything else
      const isTesting = settings.interval == "0.5";
      const autoCloseMs = isTesting ? 10000 : 15000;

      await chrome.storage.local.set({ 
        currentNews: article, 
        timerDurationMs: autoCloseMs 
      });

      const width = 450;
      const height = 550;

      chrome.system.display.getInfo((displays) => {
        const display = displays[0].workArea;
        chrome.windows.create({
          url: "news_popup.html",
          type: "popup",
          width: width,
          height: height,
          left: Math.round(display.left + display.width - width - 20),
          top: Math.round(display.top + display.height - height - 20),
          focused: true
        }, (window) => {
          currentNewsWindowId = window.id;
          if (autoCloseTimer) clearTimeout(autoCloseTimer);
          autoCloseTimer = setTimeout(() => {
            if (currentNewsWindowId) {
              chrome.windows.remove(currentNewsWindowId, () => {
                currentNewsWindowId = null;
              });
            }
          }, autoCloseMs);
        });
      });
    }
  } catch (error) {
    console.error("Failed to fetch news:", error);
  }
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === currentNewsWindowId) {
    currentNewsWindowId = null;
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
  }
});