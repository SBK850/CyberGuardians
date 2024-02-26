// Initially hide the content container and submitted message
document.getElementById('content').style.display = 'none';
document.querySelector('.submitted').style.display = 'none';

// Function to show the progress bar
function showProgressBar() {
    document.querySelector('.progressbar').style.display = 'flex';
    document.querySelector('.progressbar .bar').style.width = '100%';
}

// Function to hide the progress bar
function hideProgressBar() {
    document.querySelector('.progressbar').style.display = 'none';
    document.querySelector('.progressbar .bar').style.width = '0%';
}

// Function to fetch and display the content
async function fetchAndDisplayContent(postUrl) {
    showProgressBar(); // Show progress bar when starting the fetch

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

        // Update the page with the fetched content
        document.getElementById('profileImageUrl').src = data.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${data.FirstName} ${data.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${data.Age} | Education: ${data.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = data.Content || 'Content not available';

        // Show the content container only after the data is fetched
        document.getElementById('content').style.display = 'flex';
    } catch (error) {
        console.error('Fetch Error:', error);
        // Hide the content container if the fetch fails
        document.getElementById('content').style.display = 'none';
    } finally {
        hideProgressBar(); // Hide progress bar after fetch is complete or fails
    }
}

// Function to handle form submission
document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Hide the content container before starting the fetch
    document.getElementById('content').style.display = 'none';
    document.querySelector('.submitted').style.display = 'none';

    // Extract the URL from the input field
    const postUrl = document.getElementById('postUrl').value.trim();

    // Fetch and display the content
    await fetchAndDisplayContent(postUrl);

    // Show the submitted message
    document.querySelector('.submitted').style.display = 'block';
});
