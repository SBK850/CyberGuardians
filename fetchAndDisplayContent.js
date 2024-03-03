document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const postUrlInput = document.getElementById('postUrl');
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    const contentContainer = document.getElementById('content');
    const customContainer = document.querySelector('.custom-container');
    const progressBar = document.querySelector('.progressbar');
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

        progressBar.style.display = 'block';
        submittedIndicator.textContent = ''; // Clear any previous submitted message
        toggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none'); // Initially hide all content containers

        if (!isValidUrl(postUrl)) {
            console.error('Invalid URL');
            progressBar.style.display = 'none'; // Hide progress bar if URL is invalid
            return;
        }

        toggleDisplay([form], 'none'); // Hide the form to indicate processing

        const domain = getDomainFromUrl(postUrl);
        try {
            if (domain === 'x.com' || domain === 'twitter.com') {
                const response = await fetchTwitterEmbedCode(postUrl);
                if (response.html) {
                    twitterEmbedContainer.innerHTML = response.html;
                    loadTwitterWidgets();
                    toggleDisplay([twitterEmbedContainer], 'block');
                    const tweetText = extractTweetText(response.html);
                    await analyseContentForToxicity(tweetText, customContainer); // Pass customContainer to function
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
            progressBar.style.display = 'none';
            submittedIndicator.textContent = 'Submitted!';
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
        contentContainer.style.display = 'block';

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
    } catch (error) {
        console.error(error);
        // Handle error appropriately
    }
}

async function fetchTwitterEmbedCode(twitterUrl) {
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

    return await response.json();
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

        setPercentage(percentage);
        updateStrokeColor(toxicityScore);

        customContainer.style.display = 'block'; // Adjusted to display customContainer after analysis
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
    if (window.twttr && typeof twttr.widgets.load === 'function') {
        twttr.widgets.load(document.getElementById('twitterEmbedContainer'));
    } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
    }
}

function extractTweetText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const tweetParagraph = div.querySelector('p');
    return tweetParagraph ? tweetParagraph.textContent : "";
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
