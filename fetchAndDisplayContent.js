document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const postUrlInput = document.getElementById('postUrl');
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    const contentContainer = document.getElementById('content');
    const customContainer = document.querySelector('.custom-container');
    const submittedIndicator = document.querySelector('.submitted');

    customContainer.style.display = 'none';

    const clearAndToggleDisplay = (elements, displayStyle) => {
        elements.forEach(element => {
            if (typeof element === 'string') {
                document.getElementById(element).innerHTML = '';
                document.getElementById(element).style.display = displayStyle;
            } else if (element instanceof HTMLElement) {
                element.innerHTML = '';
                element.style.display = displayStyle;
            }
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postUrl = postUrlInput.value.trim();

        submittedIndicator.textContent = '';
        clearAndToggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none');

        if (!isValidUrl(postUrl)) {
            console.error('Invalid URL');
            return;
        }

        form.style.display = 'none';

        const domain = getDomainFromUrl(postUrl);
        try {
            if (domain === 'x.com' || domain === 'twitter.com') {
                const response = await fetchTwitterEmbedCode(postUrl);
                if (response.html) {
                    twitterEmbedContainer.innerHTML = response.html;
                    twitterEmbedContainer.style.display = 'block';
                    const tweetText = extractTweetText(response.html);
                    await analyseContentForToxicity(tweetText, customContainer);
                }
            } else if (domain.includes('youthvibe.000webhostapp.com')) {
                await fetchAndDisplayContent(postUrl, contentContainer);
                contentContainer.style.display = 'block';
            } else {
                console.error('URL domain not recognized for special handling.');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            submittedIndicator.textContent = 'Submitted!';
            customContainer.style.display = 'block';
        }
    });
});

function getDomainFromUrl(url) {
    const matches = url.match(/^https?:\/\/([^\/]+)/i);
    return matches && matches[1] ? matches[1].replace('www.', '').toLowerCase() : '';
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

function extractTweetText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const tweetParagraph = div.querySelector('p');
    return tweetParagraph ? tweetParagraph.textContent : "";
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

async function fetchAndDisplayContent(postUrl, contentContainer) {
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
}

async function analyseContentForToxicity(content, customContainer) {
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

    setPercentage(percentage);
    updateStrokeColor(toxicityScore);
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