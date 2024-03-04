$(function() {
    $(".btn").on("click", function() {
        var $this = $(this); // Cache $(this) for use inside setTimeout or async calls
        $this.addClass('btn-progress');
        
        // Immediately start the fill loop effect
        $this.addClass('btn-fill-loop');
        
        // Placeholder for starting the async operation (e.g., fetchAndDisplayContent)
        // This is where you would typically call your async function
        asyncOperation().then(() => {
            // Once the async operation is complete, remove the fill loop effect
            $this.removeClass('btn-fill-loop');
            // Add btn-complete class or any other class to indicate completion
            $this.addClass('btn-complete');
        }).catch((error) => {
            // Handle any errors
            $this.removeClass('btn-fill-loop'); // Ensure to stop the loop in case of error
            console.error(error);
        });
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const postUrlInput = document.getElementById('postUrl');
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    const contentContainer = document.getElementById('content');
    const customContainer = document.querySelector('.custom-container');

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

    // Simplified and unified isValidUrl function
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (error) {
            return false;
        }
    };

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

    async function processTwitterUrl(postUrl) {
        const responseHtml = await fetchTwitterEmbedCode(postUrl);
        if (responseHtml) {
            twitterEmbedContainer.innerHTML = responseHtml;
            loadTwitterWidgets();
            toggleDisplay([twitterEmbedContainer], 'block');
            const tweetText = extractTweetText(responseHtml);
            await analyseContentForToxicity(tweetText, customContainer);

            // Add 'btn-complete' class after processing is done
            $(".btn").addClass('btn-complete');

            // Hide inputs 3 seconds after loading the response
            setTimeout(() => {
                $(".input").hide(); // Assuming you are using jQuery
            }, 3000);
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

            $(".btn").addClass('btn-complete');

            setTimeout(() => {
                $(".input").hide(); // jQuery for hiding elements with class 'input'
            }, 3000);

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
