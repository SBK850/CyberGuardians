document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.toggle-navigation');
    const navLinks = document.querySelectorAll('.nav-list a');
  
    // Event listener for navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (toggle.checked) {
          toggle.checked = false;
        }
      });
    });
  
    // This listens for any click that is not on the nav or icon to close the nav
    document.addEventListener('click', function(event) {
      const isClickInsideNav = event.target.closest('.site-navigation') || event.target.closest('.hamburger-icon');
      if (!isClickInsideNav && toggle.checked) {
        toggle.checked = false;
      }
    });
  });
  