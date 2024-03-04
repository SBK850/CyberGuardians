$(document).ready(function () {
    const form = $('#reportForm');
    const btn = $(".btn");
    const postUrlInput = $('#postUrl');
    const twitterEmbedContainer = $('#twitterEmbedContainer');
    const contentContainer = $('#content');
    const customContainer = $('.custom-container');

    // Simplified and unified isValidUrl function
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Hide or show elements function
    function toggleDisplay(elements, displayStyle) {
        elements.forEach(element => {
            element.css('display', displayStyle);
        });
    }

    // Function to get domain from URL
    function getDomainFromUrl(url) {
        const matches = url.match(/^https?:\/\/([^\/]+)/i);
        return matches && matches[1] ? matches[1].replace('www.', '').toLowerCase() : '';
    }

    // Form submission handling
    form.on("submit", async function (e) {
        e.preventDefault();
        btn.addClass('btn-progress').removeClass('btn-complete btn-fill');

        const postUrl = postUrlInput.val().trim();

        if (!isValidUrl(postUrl)) {
            alert('Invalid URL');
            btn.removeClass('btn-progress');
            return;
        }

        try {
            // Process form submission
            await submitForm(postUrl);
            // Success path
            btn.addClass('btn-fill');
            setTimeout(() => {
                btn.removeClass('btn-progress btn-fill').addClass('btn-complete');
            }, 500); // Short delay to show fill effect
        } catch (error) {
            // Error path
            console.error(error);
            alert('Error! ' + error.message);
            btn.removeClass('btn-progress btn-fill');
        }
    });

    // Encapsulated form submission logic
    async function submitForm(postUrl) {
        const domain = getDomainFromUrl(postUrl);
        
        return new Promise(async (resolve, reject) => {
            toggleDisplay([twitterEmbedContainer, contentContainer, customContainer], 'none');

            try {
                if (domain === 'x.com' || domain === 'twitter.com') {
                    // Process for Twitter or X.com
                    await processTwitterUrl(postUrl);
                } else if (domain.includes('youthvibe.000webhostapp.com')) {
                    // Process for YouthVibe
                    await fetchAndDisplayContent(postUrl);
                } else {
                    throw new Error('URL domain not recognized for special handling.');
                }
                resolve(); // Resolve on success
            } catch (error) {
                console.error('Error in submitForm:', error);
                reject(error); // Reject on error
            }
        });
    }

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
