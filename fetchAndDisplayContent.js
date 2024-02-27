document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('#myForm');
    const contentContainer = document.querySelector('#content');
    const submitBtn = form.querySelector('button[type="submit"]');
    const bar = document.querySelector('.progressbar .bar');

    fetchAndDisplayContent(postUrl, bar, submitBtn, form, contentContainer);

    const submitted = document.querySelector('.submitted');
    const postUrlInput = document.querySelector('#postUrl');

    form.addEventListener('submit', async e => {
        e.preventDefault();

        animateFormSubmission(submitBtn, progressbar, bar, submitted);

        const postUrl = postUrlInput.value;
        if (isValidUrl(postUrl)) {
            try {
                await fetchAndDisplayContent(postUrl, bar, submitBtn, form, contentContainer);
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
        setTimeout(() => {
            submitted.textContent = 'Submitted!!';
            submitted.style.display = 'block';
            showProgressBar(bar);
        }, 3000);
        setTimeout(() => {
            submitted.style.display = 'none';
            submitBtn.textContent = 'Loading...';
            simulateLoadingProcess(submitBtn, bar);
        }, 6000);
    }

    function showProgressBar(bar) {
        progressbar.style.display = 'flex';
        bar.style.width = '0%';
    }

    function hideProgressBar(bar) {
        progressbar.style.display = 'none';
        bar.style.width = '0%';
    }

    function simulateLoadingProcess(submitBtn, bar, onComplete) {
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

    async function fetchAndDisplayContent(postUrl, bar, submitBtn, form, contentContainer) {
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
                if (done) {
                    break;
                }
                chunks.push(value);
                receivedLength += value.length;
                let loadingPercentage = (receivedLength / contentLength) * 100;
                bar.style.width = `${loadingPercentage}%`;
            }
            let chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for (let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            let result = new TextDecoder("utf-8").decode(chunksAll);
            let jsonData = JSON.parse(result);
            const postData = jsonData[0];
            document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
            document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
            document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
            document.getElementById('postContent').textContent = postData.Content || 'Content not available';
            contentContainer.style.display = 'block';
            form.style.display = 'none';
        } catch (error) {
            console.error('Fetch Error:', error);
            contentContainer.style.display = 'none';
            form.style.display = 'block';
        } finally {
            hideProgressBar(bar);
            submitBtn.style.display = 'none';
        }
    }

    // function isValidUrl(url) {
    //     var pattern = new RegExp('^(https?:\\/\\/)?' +
    //         '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    //         '((\\d{1,3}\\.){3}\\d{1,3}))' +
    //         '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    //         '(\\?[;&a-z\\d%_.~+=-]*)?' +
    //         '(\\#[-a-z\\d_]*)?$', 'i');
    //     return pattern.test(url);
    // }
});