// Theme Management
(function() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Initialize theme from localStorage or default to light
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }

    // Set theme and update UI
    function setTheme(theme) {
        if (theme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            htmlElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
        }
        localStorage.setItem('theme', theme);
    }

    // Toggle theme
    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    // Event listener for theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize theme on page load
    initTheme();
})();

