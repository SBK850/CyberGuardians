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
