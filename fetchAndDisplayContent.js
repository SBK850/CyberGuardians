function showProgressBar(bar) {
    document.querySelector('.progressbar').style.display = 'flex';
    bar.style.width = '0%';
}

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

    form.addEventListener('submit', async e => {
        e.preventDefault();

        animateFormSubmission(submitBtn, progressbar, bar, submitted);

        const postUrl = postUrlInput.value;
        if (isValidUrl(postUrl)) {
            try {
                await fetchAndDisplayContent(postUrl, bar, submitBtn);
            } catch (error) {
                console.error('Error fetching and displaying content:', error);
            }
        } else {
            console.error('Invalid URL');
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
        setTimeout(() => {
            submitBtn.textContent = 'Submitted!';
            submitted.style.display = 'block';
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
});

async function fetchAndDisplayContent(postUrl, bar, submitBtn) {
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

        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        let receivedLength = 0;
        let chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            const percentage = ((receivedLength / contentLength) * 100).toFixed(2);
            bar.style.width = `${percentage}%`;
        }

        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        const data = JSON.parse(new TextDecoder("utf-8").decode(chunksAll));
        const postData = data[0];

        document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = postData.Content || 'Content not available';

        document.getElementById('content').style.display = 'block';
    } catch (error) {
        console.error('Fetch Error:', error);
        document.getElementById('content').style.display = 'none';
    } finally {
        hideProgressBar(bar);
        bar.style.width = '100%';
        submitBtn.textContent = 'Submitted!';
    }
}

document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button');
    const bar = document.querySelector('.progressbar .bar');

    document.getElementById('content').style.display = 'none';
    submitBtn.textContent = 'Loading...';

    const postUrl = document.getElementById('postUrl').value.trim();

    await fetchAndDisplayContent(postUrl, bar, submitBtn);
});

analyseContentForToxicity(postData.Content || '');

async function analyseContentForToxicity(content) {
    try {
        const analysisEndpoint = '/analyse-content'; // You need to create this endpoint on your server
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
        console.log('Analysis Result:', analysisResult);

        // You can then display the analysis result on your page
        // For example, showing toxicity score
        document.getElementById('toxicityScore').textContent = `Toxicity Score: ${analysisResult.score}`;

    } catch (error) {
        console.error('Error analyzing content:', error);
    }
}