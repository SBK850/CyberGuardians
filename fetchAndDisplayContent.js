document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm');
    const postUrlInput = document.getElementById('postUrl');
    const twitterEmbedContainer = document.getElementById('twitterEmbedContainer');
    const contentContainer = document.getElementById('content');
    const customContainer = document.querySelector('.custom-container');
    let savedUrl = '';

    const submitButton = form.querySelector('.btn');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        startLoadingAnimation(submitButton);

        try {
            await processFormSubmission(postUrlInput.value.trim());
            updateButtonState(submitButton, 'Completed', false);
        } catch (error) {
            updateButtonState(submitButton, 'Failed', false);
            console.error('Submission error:', error);
            alert('Failed to process the submission');
        }
    });

    function startLoadingAnimation(button) {
        button.disabled = true;
        button.textContent = 'Loading';
        let dotCount = 0;
        const maxDots = 3;
        button.loadingInterval = setInterval(() => {
            button.textContent = 'Loading' + '.'.repeat(dotCount);
            dotCount = (dotCount + 1) % (maxDots + 1);
        }, 500);
    }

    function updateButtonState(button, text, enable) {
        clearInterval(button.loadingInterval);
        button.textContent = text;
        button.disabled = !enable;
    }

    async function processFormSubmission(postUrl) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (postUrl) {
                    resolve();
                } else {
                    reject(new Error('Invalid URL'));
                }
            }, 1200000);
        });
    }

    const toggleDisplay = (elements, displayStyle) => {
        elements.forEach(element => {
            if (typeof element === 'string') {
                document.getElementById(element).style.display = displayStyle;
            } else if (element instanceof HTMLElement) {
                element.style.display = displayStyle;
            }
        });
    };

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
        savedUrl = postUrl;
        const domain = getDomainFromUrl(postUrl);
        try {
            if (domain === 'x.com' || domain === 'twitter.com') {
                await processTwitterUrl(postUrl);
            } else if (domain.includes('youthvibe.rf.gd')) {
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

            const toxicityPercentage = await analyseContentForToxicity(tweetText, 'textToxicityScore');

            const analysisData = {
                url: postUrl,
                content: tweetText,
                metadata: {},
                toxicityScore: toxicityPercentage,
                textAnalysisResult: { toxicityPercentage }
            };

            await storeAnalysisResults(analysisData);

            const imageToxicitySection = document.querySelector('.image-toxicity');
            if (imageToxicitySection) {
                imageToxicitySection.style.display = 'none';
            }

            const customContainer = document.querySelector('.custom-container');
            customContainer.style.display = 'block';


            const twitterContainer = document.querySelector('.report-twitter');
            twitterContainer.style.display = 'flex';

            const textToxicityCircle = customContainer.querySelector('.custom-percent svg circle:nth-child(2)');
            if (textToxicityCircle) {
                const radius = textToxicityCircle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;

                textToxicityCircle.style.strokeDasharray = `${circumference} ${circumference}`;
                const offset = circumference - (toxicityPercentage / 100) * circumference;
                textToxicityCircle.style.strokeDashoffset = offset;

                let color;
                if (toxicityPercentage <= 50) {
                    color = 'green';
                } else if (toxicityPercentage > 50 && toxicityPercentage <= 75) {
                    redirectToPost();
                    color = 'orange';
                } else {
                    redirectToPost();
                    color = 'red';
                }

                textToxicityCircle.style.stroke = color;
            }

            $(".btn").addClass('btn-complete');

            setTimeout(() => {
                $(".input").hide();
            }, 3000);
        }
    }

    async function fetchAndDisplayContent(postUrl, contentContainer) {
        try {
            const response = await fetch('https://cyberguardians.onrender.com/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: postUrl })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const postData = await response.json();
            if (typeof postData.CarouselItemID === 'undefined') {
                throw new Error('CarouselItemID is undefined in the server response.');
            }
            const carouselItemId = postData.CarouselItemID;

            let textToxicityPromise = postData.Content ? analyseContentForToxicity(postData.Content, 'textToxicityScore') : Promise.resolve(0);
            let imageToxicityPromise = postData.UploadedImageData ? callBackendForImageProcessing(postData.UploadedImageData) : Promise.resolve(0);

            const [textToxicityPercentage, imageToxicityPercentage] = await Promise.all([textToxicityPromise, imageToxicityPromise]);

            const analysisData = {
                url: postUrl,
                content: postData.Content || '',
                metadata: {
                    profileImageUrl: postData.ProfilePictureURL,
                    posterName: postData.FirstName + " " + postData.LastName,
                    posterDetails: `Age: ${postData.Age} | Education: ${postData.Education}`
                },
                toxicityScore: textToxicityPercentage,
                textAnalysisResult: { textToxicityPercentage },
                imageAnalysisResult: { imageToxicityPercentage }
            };

            await storeAnalysisResults(analysisData);

            updateToxicityCircle(textToxicityPercentage, 'textToxicityScore');
            updateToxicityCircle(imageToxicityPercentage, 'imageToxicityScore');

            // Display the content and user interactions based on analysis
            contentContainer.style.display = 'block';
            document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
            document.getElementById('posterName').textContent = postData.FirstName + " " + postData.LastName || 'Name not available';
            document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
            document.getElementById('postContent').textContent = postData.Content || 'Content not available';

            const postImage = document.getElementById('postImage');
            if (postData.UploadedImageData) {
                postImage.src = `data:image/png;base64,${postData.UploadedImageData}`;
                postImage.alt = "Post Image";
                postImage.style.display = 'block';
            } else {
                postImage.style.display = 'none';
            }

            const confirmButton = document.getElementById('confirmButton');
            if (confirmButton) {
                confirmButton.onclick = function () { confirmToxicContent(carouselItemId); };
            }

            // Check toxicity levels to determine if additional user interactions are needed
            if (Math.max(textToxicityPercentage, imageToxicityPercentage) >= 55) {
                displayWarningCard();
                document.getElementById('rejectButton').addEventListener('click', rejectToxicContent);
                if (confirmButton) {
                    confirmButton.onclick = function () { confirmToxicContent(carouselItemId); };
                }
            }

            // If there is any toxicity, display custom UI elements for detailed analysis
            const customContainer = document.querySelector('.custom-container');
            if (textToxicityPercentage > 0 || imageToxicityPercentage > 0) {
                customContainer.style.display = 'block';
            }

            $(".btn").addClass('btn-complete');
            setTimeout(() => $(".input").hide(), 3000);
        } catch (error) {
            console.error('Error fetching and displaying content:', error);
            alert(`Error occurred: ${error.message}`);
        }
    };


    function updateToxicityCircle(percentage, elementId) {
        const scoreElement = document.getElementById(elementId);
        if (!scoreElement) {
            console.error('No element with ID:', elementId);
            return;
        }
        scoreElement.textContent = `${percentage}%`;

        const customPercentElement = scoreElement.closest('.custom-percent');
        if (!customPercentElement) {
            console.error('No custom percent element found for element ID:', elementId);
            return;
        }

        const circle = customPercentElement.querySelector('circle:nth-child(2)');
        if (!circle) {
            console.error('No circle found for element ID:', elementId);
            return;
        }

        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        let color;
        if (percentage <= 50) {
            color = 'green';
        } else if (percentage > 50 && percentage <= 75) {
            color = 'orange';
        } else {
            color = 'red';
        }
        circle.style.stroke = color;
    }

    async function callBackendForImageProcessing(imageData) {
        const backendEndpoint = 'https://process-image.onrender.com/api/process-image';
        try {
            const response = await fetch(backendEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageData: imageData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server response was not ok, status: ${response.status}, ${errorText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.message || 'Error processing image on the server.');
            }

            let imageToxicityPercentage = 0;

            if (data.detectedText && data.detectedText.trim() !== '') {
                const cleanedText = filterAndCleanText(data.detectedText);
                console.log("Cleaned text to be analysed for toxicity:", cleanedText);
                imageToxicityPercentage = await analyseContentForToxicity(cleanedText, 'imageToxicityScore');
            } else {
                updateToxicityCircle(0, 'imageToxicityScore');
            }

            return imageToxicityPercentage;
        } catch (error) {
            console.error('Error processing image:', error);
            alert(`Error occurred during image processing: ${error.message}`);
            updateToxicityCircle(0, 'imageToxicityScore');
            return 0;
        }
    }


    function filterAndCleanText(text) {
        const filterPatterns = [
            /likes/i,
            /retweets/i,
            /followers/i,
            /\d+:\d+\s(AM|PM)/i,
            /Share/i,
            /Comment/i,
            /Save/i,
            /reply/i,
            /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i,
            /@[^\s]+/gi,
            /Copy\slink\sto\sTweet/i,
            /\b\d+(\.\d+)?[kKmM]\b/g,
            /\byear\sago\b/i,
            /\bmonths\sago\b/i,
            /\bdays\sago\b/i,
            /Home/i,
        ];

        text = text.replace(/\n/g, ' ');

        const atIndex = text.indexOf('@');
        if (atIndex !== -1) {
            const endOfLineIndex = text.indexOf(' ', atIndex);
            text = text.substring(0, atIndex) + (endOfLineIndex !== -1 ? text.substring(endOfLineIndex) : "");
        }

        filterPatterns.forEach(pattern => {
            text = text.replace(pattern, '');
        });

        text = text.replace(/[0-9\/]+|[^\w\s*]/g, '');

        return text.trim();
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
            return responseData.html || responseData[0];
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async function analyseContentForToxicity(content, scoreElementId) {
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

            const scoreElement = document.getElementById(scoreElementId);
            scoreElement.textContent = `${percentage}%`;

            const circleContainer = scoreElement.parentNode.parentNode;
            const circle = circleContainer.querySelector('svg circle:nth-child(2)');
            if (circle) {
                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;

                circle.style.strokeDasharray = `${circumference} ${circumference}`;
                const offset = circumference - (percentage / 100) * circumference;
                circle.style.strokeDashoffset = offset;
            }

            const customContainer = document.querySelector('.custom-container');
            customContainer.style.display = 'block';

            return percentage;
        } catch (error) {
            console.error('Error analyzing content:', error);
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

    function displayWarningCard() {
        document.getElementById("warning-section").style.display = "block";
    }

    function rejectToxicContent() {
        var message = document.createElement('p');
        message.textContent = "You have chosen to reject the removal of this content. It will remain visible unless reported by another user as cyberbullying.";
        document.getElementById("message-section").appendChild(message);
        document.getElementById("warning-section").style.display = "none";
        document.getElementById("message-section").style.display = "block";
    }

    async function confirmToxicContent(carouselItemId) {
        const confirmButton = document.getElementById("confirmButton");
        const rejectButton = document.getElementById("rejectButton");

        confirmButton.textContent = "Processing";
        confirmButton.disabled = true;
        rejectButton.style.display = "none";

        let dotCount = 0;
        const maxDots = 3;
        const loadingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % (maxDots + 1);
            confirmButton.textContent = "Processing" + '.'.repeat(dotCount);
        }, 500);

        try {
            console.log("Attempting to remove post with ID:", carouselItemId);

            const response = await fetch('https://youthvibe-remove.onrender.com/remove-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ CarouselItemID: carouselItemId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error, status = ${response.status}`);
            }

            const result = await response.json();
            console.log("Server response:", result);

            clearInterval(loadingInterval);

            if (result && result.message === 'Post removed successfully.') {
                var message = document.createElement('p');
                message.textContent = "You have confirmed the removal of this content. It will be removed immediately from YouthVibe. Thank you for helping us maintain a safe environment.";
                document.getElementById("message-section").appendChild(message);
                document.getElementById("warning-section").style.display = "none";
                document.getElementById("message-section").style.display = "block";
            } else {
                console.error("Failed to remove post:", result);
            }
        } catch (error) {
            console.error('Error confirming toxic content:', error);
            const errorMessageContainer = document.querySelector('.errorMessageContainer');
            if (errorMessageContainer) {
                errorMessageContainer.textContent = `Error occurred: ${error.message}`;
                errorMessageContainer.style.display = 'block';
            }
            clearInterval(loadingInterval);
            confirmButton.disabled = false;
            confirmButton.textContent = "Confirm";
            rejectButton.style.display = "block";
        }
    }

    async function storeAnalysisResults(data) {
        try {
            const response = await fetch('https://storeanalysisresults.onrender.com/store-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error, status = ${response.status}`);
            }
            const responseData = await response.json();
            console.log('Store analysis results:', responseData);
        } catch (error) {
            console.error('Error storing analysis results:', error);
        }
    }

    function redirectToPost() {
        if (savedUrl) {
            window.location.href = savedUrl;
        } else {
            alert('No URL saved');
        }
    }
});