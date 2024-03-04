document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const postUrlInput = document.getElementById('postUrl');
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    const contentContainer = document.getElementById('content');
    const customContainer = document.querySelector('.custom-container');
    const submittedIndicator = document.querySelector('.submitted');

    // Hide or show elements function
    const toggleDisplay = (elements, displayStyle) => {
        elements.forEach(element => {
            if (typeof element === 'string') {
                document.getElementById(element).style.display = displayStyle;
            } else if (element instanceof HTMLElement) {
                element.style.display = displayStyle;
            }
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postUrl = postUrlInput.value.trim();

        // Directly hide the form and clear the submittedIndicator without using progress bars
        form.style.display = 'none';
        submittedIndicator.textContent = ''; // Clear any previous submitted message
        toggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none');

        if (!isValidUrl(postUrl)) {
            console.error('Invalid URL');
            // Show error message or handle invalid URL case here
            form.style.display = 'block'; // Show the form again for correction
            return;
        }

        const domain = getDomainFromUrl(postUrl);
        try {
            if (domain === 'x.com' || domain === 'twitter.com') {
                const response = await fetchTwitterEmbedCode(postUrl);
                if (response.html) {
                    twitterEmbedContainer.innerHTML = response.html;
                    loadTwitterWidgets();
                    toggleDisplay([twitterEmbedContainer], 'block');
                    const tweetText = extractTweetText(response.html);
                    await analyseContentForToxicity(tweetText, customContainer);
                }
            } else if (domain.includes('youthvibe.000webhostapp.com')) {
                await fetchAndDisplayContent(postUrl, contentContainer);
                toggleDisplay([contentContainer], 'block');
            } else {
                console.error('URL domain not recognized for special handling.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            // Indicate submission has been processed
            submittedIndicator.textContent = 'Submitted!';
            form.style.display = 'block'; // Optionally show the form again
        }
    });
});

async function fetchAndDisplayContent(postUrl, contentContainer) {
    const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';
    try {
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

        const jsonData = await response.json();
        const postData = jsonData[0];

        document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = postData.Content || 'Content not available';

        // Set content container to display block
        contentContainer.style.display = 'initial';

        // Set container-s class elements to display block
        const containerS = document.querySelectorAll('.container-s');
        containerS.forEach(element => {
            element.style.display = 'block';
        });

        // Set custom-container class elements to display block
        const customContainers = document.querySelectorAll('.custom-container');
        customContainers.forEach(element => {
            element.style.display = 'block';
        });

        // Here we add the call to analyseContentForToxicity using postData.Content
        if (postData.Content) {
            await analyseContentForToxicity(postData.Content, document.querySelector('.custom-container'));
        }

        // Set twitterEmbedContainer to display block
        twitterEmbedContainer.style.display = 'block';

    } catch (error) {
        console.error(error);
        // Handle error appropriately
    }
}


async function fetchTwitterEmbedCode(twitterUrl) {
    const apiEndpoint = 'https://twitter-n01a.onrender.com/get-twitter-embed';
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: twitterUrl }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const responseData = await response.json();
        const twitterHtml = responseData.html;

        // Display the twitter embed container
        twitterEmbedContainer.innerHTML = twitterHtml;
        loadTwitterWidgets();
        toggleDisplay([twitterEmbedContainer], 'block');

        // Extract text from the tweet HTML
        const tweetText = extractTweetText(twitterHtml);

        // Analyze content for toxicity and display custom container if needed
        await analyseContentForToxicity(tweetText, customContainer);

        // Set container-s class elements to display block
        const containerS = document.querySelectorAll('.container-s');
        containerS.forEach(element => {
            element.style.display = 'block';
        });

        // Set custom-container class elements to display block
        const customContainers = document.querySelectorAll('.custom-container');
        customContainers.forEach(element => {
            element.style.display = 'block';
        });

    } catch (error) {
        console.error(error);
        // Handle error appropriately
    }
}


async function analyseContentForToxicity(content, customContainer) {
    const analysisEndpoint = 'https://google-perspective-api.onrender.com/analyse-content';
    try {
        const response = await fetch(analysisEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const analysisResult = await response.json();
        const toxicityScore = analysisResult.score;
        const percentage = Math.round(toxicityScore * 100);
        document.getElementById('customToxicityScore').textContent = `${percentage}%`;

        // Show customContainer and container-s after analysis
        customContainer.style.display = 'block';
        document.getElementById('container-s').style.display = 'block'; // Assuming the ID of the element is 'container-s'
    } catch (error) {
        console.error('Error analyzing content:', error);
        // Handle error state appropriately, e.g., show error message to user
    }
}


function getDomainFromUrl(url) {
    const matches = url.match(/^https?:\/\/([^\/]+)/i);
    return matches && matches[1] ? matches[1].replace('www.', '').toLowerCase() : '';
}

function loadTwitterWidgets() {
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    if (window.twttr && typeof twttr.widgets.load === 'function') {
        twttr.widgets.load(twitterEmbedContainer);
        twitterEmbedContainer.style.display = 'block'; // Show after loading widgets
    } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => { // Use onload to ensure the script has loaded
            twttr.widgets.load(twitterEmbedContainer);
            twitterEmbedContainer.style.display = 'block'; // Show after script is loaded and widgets are initialized
        };
        document.body.appendChild(script);
    }
}

function extractTweetText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const tweetParagraph = div.querySelector('p');
    const extractedText = tweetParagraph ? tweetParagraph.textContent : "";
    console.log("Extracted tweet text:", extractedText); // Log the extracted text to the console
    return extractedText;
}


function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (error) {
        return false;
    }
}

function setPercentage(percentage) {
    const circle = document.querySelector('.custom-percent svg circle:nth-child(2)');
    const circumference = circle.getTotalLength();
    const offset = circumference - (circumference * percentage) / 100;
    circle.style.strokeDashoffset = offset;
    document.querySelector('.custom-percent .custom-num h2').textContent = percentage;
}

function updateStrokeColor(toxicityScore) {
    const circle = document.querySelector('.custom-percent svg circle:nth-child(2)');
    const scorePercentage = toxicityScore * 100;
    const color = getColorForScore(scorePercentage);
    circle.style.stroke = color;
}

function getColorForScore(scorePercentage) {
    if (scorePercentage >= 70) {
        return '#ff0000';
    } else if (scorePercentage >= 30) {
        return '#ffa500';
    } else {
        return '#00ff43';
    }
}

async function removePostIfToxic(toxicityScore, postId) {
    if (toxicityScore > 0.7) { // Check if score is greater than 70%
        try {
            const removalEndpoint = 'remove-post.php'; // Your server-side endpoint
            const response = await fetch(removalEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: postId }), // Send post ID to identify which post to remove
            });
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const removalResult = await response.json();
            console.log('Post removal result:', removalResult.message);
        } catch (error) {
            console.error('Error removing post:', error);
        }
    }
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