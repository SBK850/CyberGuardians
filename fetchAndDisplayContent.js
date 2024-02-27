document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('reportForm');
    const submitBtn = form.querySelector('button');
    const progressbar = document.querySelector('.progressbar');
    const bar = progressbar.querySelector('.bar');
    const contentSection = document.getElementById('content');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        
        // Hide the content section
        contentSection.style.display = 'none';

        // Change button text to "Submitted!" and disable the button
        submitBtn.textContent = 'Submitted!';
        submitBtn.disabled = true;

        // Show progress bar and animate form submission
        showProgressBar(bar);
        animateFormSubmission(progressbar, bar);

        // Perform the data fetch
        const postUrl = form.postUrl.value.trim();
        await fetchAndDisplayContent(postUrl, bar, submitBtn);
    });

    async function fetchAndDisplayContent(postUrl, bar, submitBtn) {
        try {
            const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: postUrl })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Assuming data is not an array and directly the object.
            updateContentSection(data);

            // Once data is received, show content and change button text to "Completed!"
            contentSection.style.display = 'block';
            submitBtn.textContent = 'Completed!';
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            hideProgressBar(bar);
            submitBtn.disabled = false;
        }
    }

    function showProgressBar(bar) {
        progressbar.style.display = 'flex';
        // Start progress at 0
        bar.style.width = '0%';
    }

    function hideProgressBar(bar) {
        progressbar.style.display = 'none';
        bar.style.width = '0%';
    }

    function updateContentSection(data) {
        document.getElementById('profileImageUrl').src = data.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${data.FirstName} ${data.LastName}`;
        document.getElementById('posterDetails').textContent = `Age: ${data.Age} | Education: ${data.Education}`;
        document.getElementById('postContent').textContent = data.Content;
    }

    function animateFormSubmission(progressbar, bar) {
        let progress = 0;
        const interval = setInterval(() => {
            if (progress <= 100) {
                bar.style.width = `${progress}%`;
                progress += 10;
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(interval);
            // When the fake progress is complete, set bar to full width
            bar.style.width = '100%';
            submitBtn.textContent = 'Loading...';
        }, 5000); // This should be adjusted according to the expected response time
    }
});
