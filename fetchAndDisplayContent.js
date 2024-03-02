document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const bar = document.querySelector('.progressbar .bar');
    const contentContainer = document.getElementById('content');
    const embedContainer = document.getElementById('embedContainer'); // Make sure this exists in your HTML
    const postUrlInput = document.getElementById('postUrl');
    const submitted = document.querySelector('.submitted');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postUrl = postUrlInput.value;

        if (isValidUrl(postUrl)) {
            const domain = getDomainFromUrl(postUrl);

            if (domain === 'twitter.com' || domain === 'x.com') {
                // Handle Twitter URL
                const twitterPublishUrl = convertToTwitterPublishUrl(postUrl);
                const embedCode = await fetchTwitterEmbedCode(twitterPublishUrl);
                embedContainer.innerHTML = embedCode; // Insert the embed code into the page
                contentContainer.style.display = 'none'; // Hide other content container
            } else if (domain === 'youthvibe.000webhostapp.com') {
                try {
                    const content = await fetchAndDisplayContent(postUrl, bar, form, contentContainer, submitted);
                    if (content !== null) {
                        await analyseContentForToxicity(content);
                    }
                } catch (error) {
                    console.error('Error fetching and analyzing YouthVibe content:', error);
                }
                embedContainer.innerHTML = ''; // Clear the embed container
            } else {
                console.error('URL domain not recognized for special handling.');
            }
        } else {
            console.error('Invalid URL');
        }
    });
});

function convertToTwitterPublishUrl(postUrl) {
    return postUrl;
}


async function fetchTwitterEmbedCode(twitterUrl) {
    try {
        const apiEndpoint = 'https://twitter-n01a.onrender.com/get-twitter-embed';
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

        const data = await response.json();
        return data.html; // Return the embed code as a string
    } catch (error) {
        console.error('Error fetching Twitter embed code:', error);
        return ''; // Return an empty string in case of error
    }
}

function getDomainFromUrl(url) {
    const matches = url.match(/^https?:\/\/([^\/]+)/i);
    const domain = (matches && matches[1]) ? matches[1] : '';
    return domain.toLowerCase();
}

async function fetchAndDisplayContent(postUrl, bar, form, contentContainer, submitted) {
    showProgressBar(bar);
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

        const jsonData = await response.json();
        const postData = jsonData[0];

        document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = postData.Content || 'Content not available';

        contentContainer.style.display = 'block';
        form.style.display = 'none';

        return postData.Content;
    } catch (error) {
        console.error('Fetch Error:', error);
        contentContainer.style.display = 'none';
        form.style.display = 'block';
    } finally {
        hideProgressBar(bar);
    }
    return null;
}


async function analyseContentForToxicity(content) {
    try {
        const analysisEndpoint = 'https://google-perspective-api.onrender.com/analyse-content';
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
        document.getElementById('customToxicityScore').textContent = percentage;
        
        document.querySelector('.custom-container').style.display = 'block';
        
        setPercentage(percentage);
        updateStrokeColor(toxicityScore);
    } catch (error) {
        console.error('Error analysing content:', error);
        document.getElementById('customToxicityScore').textContent = "Error calculating toxicity score";
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

document.querySelector('.custom-container').style.display = 'none';

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

function showProgressBar(bar) {
    bar.parentElement.style.display = 'flex';
    bar.style.width = '0%';
}

function hideProgressBar(bar) {
    bar.parentElement.style.display = 'none';
    bar.style.width = '0%';
}

function animateFormSubmission(submitBtn, bar, submitted, form) {
    // Animation for form submission
    form.style.animation = 'linear .3s push';
    setTimeout(() => {
        submitBtn.style.scale = '1';
    }, 300);
    setTimeout(() => {
        submitBtn.style.animation = 'ease .5s scaleWidth';
    }, 900);
    setTimeout(() => {
        bar.style.bottom = '0px';
    }, 1200);
    setTimeout(() => {
        submitBtn.style.width = '100%';
        bar.style.animation = 'ease .7s scaleBar';
    }, 1390);
    setTimeout(() => {
        bar.style.width = '100%';
    }, 2090);
    setTimeout(() => {
        submitBtn.textContent = 'Submitted!';
        submitted.style.display = 'block';
    }, 2090);
    setTimeout(() => {
        submitted.textContent = 'Submitted!!';
        submitted.style.display = 'block';

    }, 3000);
    setTimeout(() => {
        submitted.style.display = 'none';
        submitBtn.textContent = 'Loading...';
        simulateLoadingProcess(bar, () => {
        });
    }, 6000);
}

function simulateLoadingProcess(bar, onComplete) {
    // Simulation of loading process
    let loadPercentage = 0;
    const loadingInterval = setInterval(() => {
        loadPercentage++;
        bar.style.width = `${loadPercentage}%`;
        if (loadPercentage >= 100) {
            clearInterval(loadingInterval);
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        }
    }, 100);
}
