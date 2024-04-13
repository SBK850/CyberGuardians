document.addEventListener("DOMContentLoaded", function () {
    const openButton = document.querySelector('.open-navigation');
    const closeButton = document.querySelector('.close-navigation');
    const navigation = document.querySelector('.site-navigation');

    openButton.addEventListener('change', function () {
        if (this.checked) {
            navigation.style.visibility = 'visible';
        }
    });

    closeButton.addEventListener('change', function () {
        if (this.checked) {
            navigation.style.visibility = 'hidden';
        }
    });
});
