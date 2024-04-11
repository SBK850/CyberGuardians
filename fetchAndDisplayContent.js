$(function () {
    $(".btn").on("click", function () {
        var $this = $(this); // Cache this to use inside setTimeout callbacks
        $this.addClass('btn-progress');
        setTimeout(function () {
            $this.addClass('btn-fill');
        }, 500);

        setTimeout(function () {
            $this.removeClass('btn-fill');
            // Do not automatically add 'btn-complete' here
        }, 4100);
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
            const carouselItemId = postData.CarouselItemID;
    
            document.getElementById('profileImageUrl').src = postData.ProfilePictureURL || 'placeholder-image-url.png';
            document.getElementById('posterName').textContent = `${postData.FirstName} ${postData.LastName}` || 'Name not available';
            document.getElementById('posterDetails').textContent = `Age: ${postData.Age} | Education: ${postData.Education}` || 'Details not available';
            document.getElementById('postContent').textContent = postData.Content || 'Content not available';
    
            contentContainer.style.display = 'block'; 
    
            let imageTextToxicityPercentage = 0;
            if (postData.UploadedImageData) {
                const uploadedImageElement = document.createElement('img');
                uploadedImageElement.src = `data:image/jpeg;base64,${postData.UploadedImageData}`;
                uploadedImageElement.style.width = '50%';
                uploadedImageElement.style.display = 'block';
                uploadedImageElement.style.marginLeft = 'auto';
                uploadedImageElement.style.marginRight = 'auto';
                uploadedImageElement.style.border = '1px solid black';
                uploadedImageElement.style.marginTop = '20px';
                const imageWrapper = document.createElement('div');
                imageWrapper.appendChild(uploadedImageElement);
                contentContainer.appendChild(imageWrapper);
    
                const extractedText = await extractTextFromImage(postData.UploadedImageData);
                if (extractedText) {
                    imageTextToxicityPercentage = await analyseContentForToxicity(extractedText, 'imageToxicityScore');
                }
            }
            
            let textToxicityPercentage = postData.Content ? await analyseContentForToxicity(postData.Content, 'textToxicityScore') : 0;
            
            updateToxicityCircle(textToxicityPercentage, 'textToxicityScore');
            updateToxicityCircle(imageTextToxicityPercentage, 'imageToxicityScore');
            
            const customContainer = document.querySelector('.custom-container');
            if (textToxicityPercentage > 0 || imageTextToxicityPercentage > 0) {
                customContainer.style.display = 'block';
            }
    
            if (Math.max(textToxicityPercentage, imageTextToxicityPercentage) >= 85) {
                displayWarningCard();
                document.getElementById('rejectButton').addEventListener('click', rejectToxicContent);
                const confirmButton = document.getElementById('confirmButton');
                if (confirmButton) {
                    confirmButton.onclick = function () { confirmToxicContent(carouselItemId); };
                }
            }
    
            $(".btn").addClass('btn-complete');
            setTimeout(() => { $(".input").hide(); }, 3000);
        } catch (error) {
            console.error(error);
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
    
            // Update the toxicity score in the appropriate container
            document.getElementById(scoreElementId).textContent = `${percentage}%`;
    
            // Adjust the corresponding circle to reflect the toxicity score and color based on the score
            const circleContainer = document.getElementById(scoreElementId).parentNode.parentNode;
            const circle = circleContainer.querySelector('svg circle:nth-child(2)');
            if (circle) {
                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;
    
                circle.style.strokeDasharray = `${circumference} ${circumference}`;
                const offset = circumference - (percentage / 100) * circumference;
                circle.style.strokeDashoffset = offset;
    
                // Determine the color based on the toxicity score
                let color = 'red'; // High toxicity
                if (percentage < 60) {
                    color = 'green'; // Low toxicity
                } else if (percentage < 85) {
                    color = 'orange'; // Medium toxicity
                }
                circle.style.stroke = color;
            }
    
            // Show the entire custom container if it's not already visible
            const customContainer = document.querySelector('.custom-container');
            if (customContainer.style.display === 'none') {
                customContainer.style.display = 'block';
            }
    
            return percentage;
        } catch (error) {
            console.error('Error analyzing content:', error);
            return null;
        }
    }    

    async function extractTextFromImage(imageData) {
        const apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAuzo1Gi9xUOJJ790SkMh-wveNqS0DoFUQ';
        const requestBody = {
            "requests": [
                {
                    "image": {
                        "content": imageData // The image data needs to be base64 encoded
                    },
                    "features": [
                        {
                            "type": "TEXT_DETECTION"
                        }
                    ]
                }
            ]
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' },
            });

            const responseData = await response.json();
            return responseData.responses[0].fullTextAnnotation.text;
        } catch (error) {
            console.error('Error extracting text:', error);
            throw error; // Re-throw to be handled by caller
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
        // Handle rejection action here
        var message = document.createElement('p');
        message.textContent = "You have chosen to reject the removal of this content. It will remain visible unless reported by another user as cyberbullying.";
        document.getElementById("message-section").appendChild(message);
        document.getElementById("warning-section").style.display = "none";
        document.getElementById("message-section").style.display = "block";
    }

    async function confirmToxicContent(carouselItemId) {
        try {
            console.log("Attempting to remove post with ID:", carouselItemId); // Log the ID to the console
            const result = await removeToxicPost(carouselItemId);
            console.log("Server response:", result); // Log the actual response from the server
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
        }
    }
});

function updateToxicityCircle(percentage, scoreElementId) {
    document.getElementById(scoreElementId).textContent = `${percentage}%`;
    const circleContainer = document.getElementById(scoreElementId).parentNode.parentNode;
    const circle = circleContainer.querySelector('svg circle:nth-child(2)');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        let color = 'red';
        if (percentage < 60) {
            color = 'green';
        } else if (percentage < 85) {
            color = 'orange';
        }
        circle.style.stroke = color;
    }
}
