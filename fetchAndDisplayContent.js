// Function to fetch and display the content
async function fetchAndDisplayContent(postUrl) {
    try {
        // Replace with the URL to your API Gateway endpoint
        const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';

        const response = await fetch(apiEndpoint, {
            method: 'POST', // Or 'GET', depending on how your Lambda is set up
            headers: {
                'Content-Type': 'application/json',
                // Add any other necessary headers here, such as API keys or authorization tokens
            },
            body: JSON.stringify({ url: postUrl }), // If your Lambda function expects a body, send it here
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const data = await response.json();

        // Update the page with the fetched content
        document.getElementById('profileImageUrl').src = data.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = data.FirstName + ' ' + data.LastName || 'Name not available';
        document.getElementById('posterDetails').textContent = 'Age: ' + data.Age + ' | Education: ' + data.Education || 'Details not available';
        document.getElementById('postContent').textContent = data.Content || 'Content not available';

        // Show the content container
        document.getElementById('content').style.display = 'block';
    } catch (error) {
        console.error('Fetch Error:', error);
        // Optionally hide the content container if the fetch fails
        document.getElementById('content').style.display = 'none';
    }
}
