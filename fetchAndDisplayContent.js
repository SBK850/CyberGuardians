$(document).ready(function () {
    const form = $('#reportForm');
    const btn = $(".btn"); // Assuming there's only one button

    form.on("submit", async function (e) {
        e.preventDefault();
        btn.addClass('btn-progress').removeClass('btn-complete');

        const postUrl = $('#postUrl').val().trim();
        if (!isValidUrl(postUrl)) {
            alert('Invalid URL');
            btn.removeClass('btn-progress');
            return;
        }

        try {
            // Assuming this function sends the request and returns a Promise
            await submitForm(postUrl);
            // On success
            btn.addClass('btn-fill');
            setTimeout(() => {
                btn.removeClass('btn-progress btn-fill').addClass('btn-complete');
            }, 500); // Short delay to show fill effect

        } catch (error) {
            console.error(error);
            alert('Error! ' + error.message);
            btn.removeClass('btn-progress btn-fill');
            // Optionally, add an error class to indicate failure
        }
    });

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
    }

    async function submitForm(postUrl) {
        return new Promise(async (resolve, reject) => {
            const domain = getDomainFromUrl(postUrl);
            
            try {
                // Reset display states
                toggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none');
                
                if (domain === 'x.com' || domain === 'twitter.com') {
                    const responseHtml = await fetchTwitterEmbedCode(postUrl);
                    if (responseHtml) {
                        twitterEmbedContainer.innerHTML = responseHtml;
                        loadTwitterWidgets();
                        toggleDisplay([twitterEmbedContainer], 'block');
                        const tweetText = extractTweetText(responseHtml);
                        await analyseContentForToxicity(tweetText, customContainer);
                    }
                } else if (domain.includes('youthvibe.000webhostapp.com')) {
                    await fetchAndDisplayContent(postUrl, contentContainer);
                } else {
                    throw new Error('URL domain not recognized for special handling.');
                }
    
                resolve(); // Resolve the promise when the process completes successfully
            } catch (error) {
                console.error('Error in submitForm:', error);
                reject(error); // Reject the promise if an error occurs
            }
        });
    }    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postUrl = postUrlInput.value.trim();

        if (!isValidUrl(postUrl)) {
            alert('Invalid URL');
            return;
        }

        toggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none');

        const domain = getDomainFromUrl(postUrl);
        try {
            if (domain === 'x.com' || domain === 'twitter.com') {
                await processTwitterUrl(postUrl);
            } else if (domain.includes('youthvibe.000webhostapp.com')) {
                await fetchAndDisplayContent(postUrl, contentContainer);
            } else {
                throw new Error('URL domain not recognized for special handling.');
            }
        } catch (error) {
            console.error(error);
            alert('Error! ' + error.message);
        }
    });

    form.on("submit", async function (e) {
        e.preventDefault();
        const postUrl = $('#postUrl').val().trim();
    
        btn.addClass('btn-progress').removeClass('btn-complete');
    
        if (!isValidUrl(postUrl)) {
            alert('Invalid URL');
            btn.removeClass('btn-progress');
            return;
        }
    
        try {
            await submitForm(postUrl);
            // On success
            btn.addClass('btn-fill');
            setTimeout(() => {
                btn.removeClass('btn-progress btn-fill').addClass('btn-complete');
            }, 500); // Short delay to show fill effect
        } catch (error) {
            // Handle error
            alert(`Error: ${error.message}`);
            btn.removeClass('btn-progress btn-fill');
            // Optionally, handle the error state of the button here
        }
    });

    async function processTwitterUrl(postUrl) {
        const responseHtml = await fetchTwitterEmbedCode(postUrl);
        if (responseHtml) {
            twitterEmbedContainer.innerHTML = responseHtml;
            loadTwitterWidgets();
            toggleDisplay([twitterEmbedContainer], 'block');
            const tweetText = extractTweetText(responseHtml);
            await analyseContentForToxicity(tweetText, customContainer);
        }
    }

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

            // Update the content on the page
            document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
            document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
            document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
            document.getElementById('postContent').textContent = postData.Content || 'Content not available';

            // Display the content container
            contentContainer.style.display = 'block';

            // Analyse the toxicity of the loaded post content if it exists
            if (postData.Content) {
                await analyseContentForToxicity(postData.Content, customContainer);
            }

        } catch (error) {
            console.error(error);
            // Handle error appropriately
        }
    }

    async function fetchTwitterEmbedCode(twitterUrl) {
        const apiEndpoint = 'https://twitter-n01a.onrender.com/get-twitter-embed';
        return await fetchJsonData(apiEndpoint, { url: twitterUrl });
    }

    async function fetchJsonData(apiEndpoint, data) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData.html || responseData[0]; // Adjust based on expected response structure
        } catch (error) {
            console.error('Fetch error:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    function updateContentDisplay(postData, contentContainer) {
        document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
        document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
        document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
        document.getElementById('postContent').textContent = postData.Content || 'Content not available';
        toggleDisplay([contentContainer, '.container-s', '.custom-container'], 'block');
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

            // Update the toxicity score in the custom container
            document.getElementById('customToxicityScore').textContent = `${percentage}%`;

            // Adjust the second circle to reflect the toxicity score
            const circles = customContainer.querySelectorAll('.custom-percent svg circle:nth-child(2)');
            if (circles.length > 0) {
                const circle = circles[0];
                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;

                circle.style.strokeDasharray = `${circumference} ${circumference}`;
                const offset = circumference - percentage / 100 * circumference;
                circle.style.strokeDashoffset = offset;
            }

            // Show the custom container with the toxicity score
            customContainer.style.display = 'block';
        } catch (error) {
            console.error('Error analyzing content:', error);
            // Handle error state appropriately, e.g., show error message to user
        }
    }

    function loadTwitterWidgets() {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => twttr.widgets.load(twitterEmbedContainer);
        document.body.appendChild(script);
    }

    function extractTweetText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const tweetParagraph = div.querySelector('p');
        return tweetParagraph ? tweetParagraph.textContent : "";
    }

    function getDomainFromUrl(url) {
        const matches = url.match(/^https?:\/\/([^\/]+)/i);
        return matches && matches[1] ? matches[1].replace('www.', '').toLowerCase() : '';
    }
});
