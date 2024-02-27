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

        if (submitBtn.textContent === 'Submit') {
            // If the button has not been pressed yet, change its text to "Submitted!" and animate submission
            submitBtn.textContent = 'Submitted!';
            animateFormSubmission(submitBtn, progressbar, bar, submitted);
        } else {
            // If the button has already been pressed, update its text to "Loading..." and start loading progress
            submitBtn.textContent = 'Loading...';
            await fetchAndDisplayContent(postUrlInput.value.trim(), bar, submitBtn);
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
        }, 2090);
    }
});

// Function to fetch and display the content
async function fetchAndDisplayContent(postUrl, bar, submitBtn) {
    showProgressBar(bar); // Show progress bar

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

        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        let receivedLength = 0; // Amount of bytes received
        let chunks = []; // Array to store fetched chunks

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // Calculate and update progress
            const percentage = ((receivedLength / contentLength) * 100).toFixed(2);
            bar.style.width = `${percentage}%`;
            submitBtn.textContent = `Loading... ${percentage}%`;
        }

        // Concatenate chunks into single Uint8Array
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        const data = JSON.parse(new TextDecoder("utf-8").decode(chunksAll));

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
        hideProgressBar(bar); // Hide progress bar after fetch is complete or fails
        bar.style.width = '100%'; // Set the bar to 100% when the fetch is complete
        submitBtn.textContent = 'Submitted!'; // Update button text to indicate completion
    }
}