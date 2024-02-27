document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('#myForm'); // Replace with your actual form's selector
    const contentContainer = document.querySelector('#content'); // Replace with your actual content container's selector
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

        // After the bar reaches 100%, wait 3 seconds, then display "Submitted!!"
        setTimeout(() => {
            submitted.textContent = 'Submitted!!';
            submitted.style.display = 'block';
            showProgressBar(bar); // Start showing progress bar after 3 seconds
        }, 3000);

        // After 3 seconds of displaying "Submitted!!", begin loading process
        setTimeout(() => {
            submitted.style.display = 'none'; // Hide "Submitted!!"
            submitBtn.textContent = 'Loading...'; // Change text to "Loading..."

            // Simulate loading process (replace this with actual loading logic)
            simulateLoadingProcess(submitBtn, bar);
        }, 6000); // Wait additional 3 seconds
    }


    // Show progress bar
    function showProgressBar(bar) {
        progressbar.style.display = 'flex';
        bar.style.width = '0%';
    }

    // Hide progress bar
    function hideProgressBar(bar) {
        progressbar.style.display = 'none';
        bar.style.width = '0%';
    }

    // Simulate the loading process
    function simulateLoadingProcess(submitBtn, bar, onComplete) {
        let loadPercentage = 0;
        const loadingInterval = setInterval(() => {
            // Simulate the loading process
            loadPercentage++;
            bar.style.width = `${loadPercentage}%`;

            // Once loading is complete, clear the interval, hide the progress bar, and call onComplete callback
            if (loadPercentage >= 100) {
                clearInterval(loadingInterval);
                onComplete(); // Call the callback function when the loading is complete
            }
        }, 100); // The interval duration here depends on your actual loading time
    }

    async function fetchAndDisplayContent(postUrl, bar, submitBtn, form, contentContainer) {
        showProgressBar(bar); // Assuming this function initiates the progress bar
    
        try {
            const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';
    
            // Initiate the fetch request
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: postUrl }),
            });
    
            // Check if the response was successful
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
    
            // Read the stream and update the progress bar
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let receivedLength = 0; // this will be the length we have received so far
            let chunks = []; // array of received binary chunks (comprises the body)
    
            while (true) {
                const { done, value } = await reader.read();
    
                if (done) {
                    break;
                }
    
                chunks.push(value);
                receivedLength += value.length;
    
                let loadingPercentage = (receivedLength / contentLength) * 100;
                bar.style.width = `${loadingPercentage}%`; // Update the progress bar width
            }
    
            // Concatenate chunks into a single Uint8Array
            let chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for (let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
    
            // Decode the Uint8Array into a string
            let result = new TextDecoder("utf-8").decode(chunksAll);
    
            // Parse the JSON string into an object
            let jsonData = JSON.parse(result);
            const postData = jsonData[0];
    
            // Update your UI with the fetched data
            document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
            document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
            document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
            document.getElementById('postContent').textContent = postData.Content || 'Content not available';
    
            // Show the content container and hide the form
            contentContainer.style.display = 'block';
            form.style.display = 'none';
    
        } catch (error) {
            console.error('Fetch Error:', error);
            // Optionally reset the UI in case of an error
            contentContainer.style.display = 'none';
            form.style.display = 'block';
        } finally {
            // Hide the progress bar and the submit button
            hideProgressBar(bar); // Assuming this function hides the progress bar
            submitBtn.style.display = 'none';
        }
    }
    

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
