// Function to show the progress bar with simulated progress
function showProgressBar(bar) {
    document.querySelector('.progressbar').style.display = 'flex';
    bar.style.width = '0%';
}

// Function to hide the progress bar
function hideProgressBar(bar) {
    document.querySelector('.progressbar').style.display = 'none';
    bar.style.width = '0%';
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('form button');
    const progressbar = document.querySelector('.progressbar');
    const bar = document.querySelector('.progressbar .bar');
    const submitted = document.querySelector('.submitted');
    const postUrlInput = document.querySelector('#postUrl');

    // Animation and form submission handling
    form.addEventListener('submit', async e => {
        e.preventDefault();

        // Initial form submission animation
        animateFormSubmission(submitBtn, progressbar, bar, submitted);

        // Validate and process the URL
        const postUrl = postUrlInput.value;
        if (isValidUrl(postUrl)) {
            try {
                const data = await fetchScrapedContent(postUrl);
                console.log(data); // Log or process your data here
                // TODO: Update the UI with fetched content
            } catch (error) {
                console.error('Error scraping content:', error);
                // TODO: Update the UI to show an error message
            }
        } else {
            console.error('Invalid URL');
            // TODO: Update the UI to show an error message
        }
    });

    function animateFormSubmission(submitBtn, progressbar, bar, submitted) {
        form.style.animation = 'linear .3s push';
        setTimeout(() => {
            submitBtn.style.scale = '1';
        }, 300);
        setTimeout(() => {
            submitBtn.style.animation = 'ease .5s scaleWidth';
        }, 900);
        setTimeout(() => {
            progressbar.style.bottom = '0px';
        }, 1200);
        setTimeout(() => {
            submitBtn.style.width = '100%';
            bar.style.animation = 'ease .7s scaleBar';
        }, 1390);
        setTimeout(() => {
            bar.style.width = '100%';
            submitted.style.top = '0';
        }, 2090);
        setTimeout(() => {
            submitBtn.textContent = 'Submitted!';
            submitted.style.display = 'block';
            // Now fetch and display content after the animation has completed
            fetchAndDisplayContent();
        }, 2090);
    }

    function isValidUrl(url) {
        var pattern = new RegExp('^(https?:\\/\\/)?' +
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
            '((\\d{1,3}\\.){3}\\d{1,3}))' +
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$', 'i');
        return pattern.test(url);
    }
})

// Function to fetch and display the content
async function fetchAndDisplayContent(postUrl, bar, submitBtn) {
    const interval = showProgressBar(bar, submitBtn); // Show progress bar with simulated progress

    try {
        const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: postUrl }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const data = await response.json();

        // Assuming the response is an array and we're interested in the first item
        const postData = data[0];

        // Update the page with the fetched content
        document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = postData.Content || 'Content not available';

        // Show the content container only after the data is fetched
        document.getElementById('content').style.display = 'block'; // Changed from 'initial' to 'block'
    } catch (error) {
        console.error('Fetch Error:', error);
        // Hide the content container if the fetch fails
        document.getElementById('content').style.display = 'none';
    } finally {
        hideProgressBar(bar, submitBtn, interval); // Hide progress bar after fetch is complete or fails
        bar.style.width = '100%'; // Set the bar to 100% when the fetch is complete
        submitBtn.textContent = 'Submitted!'; // Update button text to indicate completion
    }
}

// Function to handle form submission
document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const submitBtn = event.target.querySelector('button');
    const bar = document.querySelector('.progressbar .bar');

    document.getElementById('content').style.display = 'none';
    submitBtn.textContent = 'Loading...'; // Change button text to indicate loading

    // Extract the URL from the input field
    const postUrl = document.getElementById('postUrl').value.trim();

    // Fetch and display the content
    await fetchAndDisplayContent(postUrl, bar, submitBtn);
});
