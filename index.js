document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.toggle-navigation');
    const navLinks = document.querySelectorAll('.nav-list a');
  
    // Close navigation when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (toggle.checked) {
          toggle.checked = false; // Uncheck the checkbox, hiding the navigation
        }
      });
    });
  
    // Optional: Close navigation when clicking outside
    document.addEventListener('click', function(event) {
      const withinNav = event.target.closest('.site-navigation') || event.target.closest('.hamburger-icon');
      if (!withinNav && toggle.checked) {
        toggle.checked = false;
      }
    });
  });
  