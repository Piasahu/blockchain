/* app.js — Blockchain Dashboard */
/* global hljs */
(function () {
  "use strict";

  /* ========== THEME TOGGLE ========== */
  const root = document.documentElement;
  let theme = "dark"; // default dark
  root.setAttribute("data-theme", theme);

  function updateThemeUI() {
    const sunIcon =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    const moonIcon =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.innerHTML =
        (theme === "dark" ? sunIcon : moonIcon) +
        "<span>" +
        (theme === "dark" ? "Light Mode" : "Dark Mode") +
        "</span>";
    }
    const mobileToggle = document.getElementById("mobileThemeToggle");
    if (mobileToggle) {
      mobileToggle.innerHTML = theme === "dark" ? sunIcon : moonIcon;
    }
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
    updateThemeUI();
    // Re-render charts with new theme colors
    renderAllCharts();
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", toggleTheme);
  });
  updateThemeUI();

  /* ========== NAVIGATION ========== */
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");

  function navigateTo(sectionId) {
    // Update nav
    navItems.forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("data-section") === sectionId);
    });
    // Update sections
    sections.forEach(function (sec) {
      sec.classList.toggle("active", sec.id === sectionId);
    });
    // Scroll main to top
    var mainEl = document.getElementById("mainContent");
    if (mainEl) mainEl.scrollTop = 0;
    // Close mobile sidebar
    closeMobileSidebar();
    // Update hash
    window.location.hash = sectionId;
    // Animate counters on overview
    if (sectionId === "overview") {
      animateCounters();
    }
    // Initialize charts for the section
    initChartsForSection(sectionId);
  }

  navItems.forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      var sectionId = item.getAttribute("data-section");
      navigateTo(sectionId);
    });
  });

  // Hash routing
  function handleHash() {
    var hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(hash)) {
      navigateTo(hash);
    } else {
      navigateTo("overview");
    }
  }
  window.addEventListener("hashchange", handleHash);

  /* ========== MOBILE SIDEBAR ========== */
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var menuToggle = document.getElementById("menuToggle");

  function openMobileSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("open");
  }

  function closeMobileSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }

  if (menuToggle) menuToggle.addEventListener("click", openMobileSidebar);
  if (overlay) overlay.addEventListener("click", closeMobileSidebar);

  /* ========== ANIMATED COUNTERS ========== */
  var countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    document.querySelectorAll("[data-counter]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var prefix = "";
      var suffix = "";

      // Determine formatting
      var text = el.textContent;
      if (text.includes("$")) prefix = "$";
      if (text.includes("B")) suffix = "B";
      if (text.includes("M")) suffix = "M";
      if (text.includes("T")) suffix = "T";

      var start = 0;
      var duration = 1500;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
        var ease = 1 - Math.pow(1 - progress, 3);
        var current = start + (target - start) * ease;

        if (target >= 100) {
          el.textContent = prefix + Math.round(current) + suffix;
        } else if (target >= 10) {
          el.textContent = prefix + current.toFixed(1) + suffix;
        } else {
          el.textContent = prefix + current.toFixed(2) + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Final value
          if (target >= 100) {
            el.textContent = prefix + Math.round(target) + suffix;
          } else if (target >= 10) {
            el.textContent = prefix + target.toFixed(1) + suffix;
          } else {
            el.textContent = prefix + target.toFixed(2) + suffix;
          }
        }
      }

      requestAnimationFrame(step);
    });
  }

  /* ========== COLLAPSIBLE ========== */
  window.toggleCollapsible = function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle("open");
  };

  /* ========== TABS ========== */
  window.switchTab = function (sectionContext, tabName) {
    var section = document.getElementById(sectionContext);
    if (!section) return;
    section.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });
    section.querySelectorAll(".tab-content").forEach(function (content) {
      content.classList.toggle(
        "active",
        content.getAttribute("data-tabcontent") === tabName
      );
    });
  };

  /* ========== CHART.JS CONFIGURATION ========== */
  var chartInstances = {};

  function getChartColors() {
    var isDark = theme === "dark";
    return {
      primary: "#3b82f6",
      green: "#10b981",
      purple: "#8b5cf6",
      amber: "#f59e0b",
      red: "#ef4444",
      cyan: "#06b6d4",
      text: isDark ? "#e5e7eb" : "#0f172a",
      textMuted: isDark ? "#9ca3af" : "#475569",
      textFaint: isDark ? "#6b7280" : "#94a3b8",
      gridColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      surface: isDark ? "#111827" : "#ffffff",
    };
  }

  function setChartDefaults() {
    var colors = getChartColors();
    Chart.defaults.color = colors.textMuted;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor =
      theme === "dark" ? "#1a1f2e" : "#ffffff";
    Chart.defaults.plugins.tooltip.titleColor = colors.text;
    Chart.defaults.plugins.tooltip.bodyColor = colors.textMuted;
    Chart.defaults.plugins.tooltip.borderColor =
      theme === "dark" ? "#2a3344" : "#e2e8f0";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };
  }

  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  }

  /* ========== CHART: Chain TVL ========== */
  function renderChainTvlChart() {
    destroyChart("chainTvlChart");
    var ctx = document.getElementById("chainTvlChart");
    if (!ctx) return;

    var colors = getChartColors();
    var labels = [
      "Ethereum",
      "Tron",
      "BSC",
      "Solana",
      "Arbitrum",
      "Base",
      "Blast",
      "Bitcoin",
      "Polygon",
      "Avalanche",
      "Linea",
      "Optimism",
      "Sui",
      "zkLink Nova",
    ];
    var data = [
      59.74, 7.68, 4.81, 4.47, 2.76, 1.57, 1.53, 1.03, 0.86, 0.72, 0.7,
      0.68, 0.61, 0.53,
    ];
    var barColors = [
      colors.primary,
      colors.red,
      colors.amber,
      colors.purple,
      colors.cyan,
      colors.primary,
      colors.amber,
      colors.amber,
      colors.purple,
      colors.red,
      colors.cyan,
      colors.red,
      colors.cyan,
      colors.green,
    ];

    chartInstances["chainTvlChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "TVL ($B)",
            data: data,
            backgroundColor: barColors.map(function (c) {
              return c + "cc";
            }),
            borderColor: barColors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.parsed.x + "B";
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              callback: function (value) {
                return "$" + value + "B";
              },
            },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });
  }

  /* ========== CHART: Protocol TVL ========== */
  function renderProtocolTvlChart() {
    destroyChart("protocolTvlChart");
    var ctx = document.getElementById("protocolTvlChart");
    if (!ctx) return;

    var colors = getChartColors();

    chartInstances["protocolTvlChart"] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Aave", "Lido", "EigenLayer", "Sky", "Ethena", "Spark"],
        datasets: [
          {
            data: [24.4, 22.6, 10.9, 5.855, 4.856, 4.392],
            backgroundColor: [
              colors.primary + "cc",
              colors.purple + "cc",
              colors.cyan + "cc",
              colors.amber + "cc",
              colors.red + "cc",
              colors.green + "cc",
            ],
            borderColor:
              theme === "dark" ? "#111827" : "#ffffff",
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              padding: 12,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": $" + context.parsed + "B";
              },
            },
          },
        },
      },
    });
  }

  /* ========== CHART: DEX Volume ========== */
  function renderDexVolumeChart() {
    destroyChart("dexVolumeChart");
    var ctx = document.getElementById("dexVolumeChart");
    if (!ctx) return;

    var colors = getChartColors();

    chartInstances["dexVolumeChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Orca",
          "Raydium",
          "Curve",
          "Quickswap",
          "DODO",
          "PancakeSwap",
        ],
        datasets: [
          {
            label: "24h Volume ($M)",
            data: [307.5, 217.3, 119.7, 50.4, 47.4, 27.2],
            backgroundColor: [
              colors.primary + "cc",
              colors.purple + "cc",
              colors.green + "cc",
              colors.cyan + "cc",
              colors.amber + "cc",
              colors.red + "cc",
            ],
            borderColor: [
              colors.primary,
              colors.purple,
              colors.green,
              colors.cyan,
              colors.amber,
              colors.red,
            ],
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.parsed.y + "M";
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              callback: function (value) {
                return "$" + value + "M";
              },
            },
          },
        },
      },
    });
  }

  /* ========== CHART: RWA Ecosystem ========== */
  function renderRwaEcosystemChart() {
    destroyChart("rwaEcosystemChart");
    var ctx = document.getElementById("rwaEcosystemChart");
    if (!ctx) return;

    var colors = getChartColors();
    var labels = [
      "Ondo Finance",
      "BlackRock BUIDL",
      "Circle USYC",
      "Franklin Templeton BENJI",
      "Centrifuge",
    ];
    var data = [2.5, 2.0, 1.8, 0.7, 0.3];
    var barColors = [
      colors.primary,
      colors.purple,
      colors.cyan,
      colors.amber,
      colors.green,
    ];

    chartInstances["rwaEcosystemChart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "TVL ($B)",
            data: data,
            backgroundColor: barColors.map(function (c) {
              return c + "cc";
            }),
            borderColor: barColors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.parsed.x + "B";
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              callback: function (value) {
                return "$" + value + "B";
              },
            },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });
  }

  /* ========== CHART RENDERING ========== */
  var chartsInitialized = {
    overview: false,
    dexs: false,
    tradfi: false,
  };

  function initChartsForSection(sectionId) {
    // Small delay to ensure DOM is visible
    setTimeout(function () {
      if (sectionId === "overview") {
        renderChainTvlChart();
        renderProtocolTvlChart();
        chartsInitialized.overview = true;
      }
      if (sectionId === "dexs") {
        renderDexVolumeChart();
        chartsInitialized.dexs = true;
      }
      if (sectionId === "tradfi") {
        renderRwaEcosystemChart();
        chartsInitialized.tradfi = true;
      }
    }, 150);
  }

  function renderAllCharts() {
    setChartDefaults();
    chartsInitialized = { overview: false, dexs: false, tradfi: false };
    // Re-render visible section's charts
    var activeSection = document.querySelector(".section.active");
    if (activeSection) {
      initChartsForSection(activeSection.id);
    }
  }

  /* ========== SYNTAX HIGHLIGHTING ========== */
  function initHighlighting() {
    document.querySelectorAll("pre code").forEach(function (block) {
      hljs.highlightElement(block);
    });
  }

  /* ========== INIT ========== */
  function init() {
    setChartDefaults();
    initHighlighting();
    handleHash();
    // Animate counters if on overview
    if (
      !window.location.hash ||
      window.location.hash === "#overview"
    ) {
      animateCounters();
      initChartsForSection("overview");
    }
  }

  // Wait for fonts & DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
