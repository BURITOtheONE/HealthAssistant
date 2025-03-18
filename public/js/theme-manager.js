// public/js/theme-manager.js
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('[data-lucide]');
    
    // Check if there's a saved theme in localStorage
    const currentTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        icon.setAttribute('data-lucide', 'sun');
    } else {
        document.body.classList.remove('dark-mode');
        icon.setAttribute('data-lucide', 'moon');
    }
    
    // Re-initialize Lucide icons
    lucide.createIcons();
    
    // Handle theme toggle
    themeToggle.addEventListener('click', function() {
        // Toggle theme
        document.body.classList.toggle('dark-mode');
        
        // Update localStorage
        const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        // Change icon
        if (newTheme === 'dark') {
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        
        // Re-initialize Lucide icons
        lucide.createIcons();
        
        // Send theme preference to server if user is logged in
        if (window.isLoggedIn) {
            fetch('/update-theme-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme: newTheme }),
            });
        }
    });
});