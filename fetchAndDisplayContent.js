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

            if (confirm('We have detected potentially toxic content in this post. Would you like to remove it from the display? This action cannot be undone.')) {
                await removeToxicPost(carouselItemId);
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

    async function removeToxicPost(carouselItemId) {
        const apiEndpoint = 'remove-post.php';
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ CarouselItemID: carouselItemId }), // Send the CarouselItemID to PHP
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result.message); // Log the message from PHP
        } catch (error) {
            console.error('Error removing post:', error);
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

gsap.registerPlugin(Draggable, MorphSVGPlugin);

document.querySelectorAll('.button-tx').forEach(button => {

    let handle = button.querySelector('.handle-tx'),
        handlePath = handle.querySelector('.background-tx path'),
        drop = button.querySelector('.drop-tx'),
        dropPath = drop.querySelector('.background-tx path');

    let handleTween = gsap.to(handlePath, {
        paused: true,
        morphSVG: 'M5 16C5 9.92487 9.92487 5 16 5H24C30.0751 5 34 9.92487 36 16C36 16 37 18.4379 37 20C37 21.5621 36 24 36 24C34 30.0751 30.0751 35 24 35H16C9.92487 35 5 30.0751 5 24C5 24 5 21.5621 5 20C5 18.4379 5 16 5 16Z'
    });

    let dropTween = gsap.to(dropPath, {
        paused: true,
        morphSVG: 'M4 16C6 9.92487 9.92487 5 16 5H24C30.0751 5 35 9.92487 35 16C35 16 35 18.4379 35 20C35 21.5621 35 24 35 24C35 30.0751 30.0751 35 24 35H16C9.92487 35 6 30.0751 4 24C4 24 3 21.5621 3 20C3 18.4379 4 16 4 16Z'
    });

    gsap.set(handle, {
        x: 0
    });

    Draggable.create(handle, {
        type: 'x',
        bounds: button,
        onDrag(e) {
            dragging(this.x, button, handle, drop, handleTween, dropTween);
        },
        onRelease(e) {
            if (!this.hitTest(drop)) {
                gsap.to(handle, {
                    x: 0,
                    duration: .6,
                    ease: 'elastic.out(1, .75)',
                    onUpdate(e) {
                        dragging(gsap.getProperty(handle, 'x'), button, handle, drop, handleTween, dropTween);
                    }
                });
                if (gsap.getProperty(handle, 'x') > 0) {
                    gsap.to(handlePath, {
                        keyframes: [{
                            morphSVG: 'M5 16C5 9.92487 9.92487 5 16 5H24C30.0751 5 37 9.92487 35 16C35 16 34 18.4379 34 20C34 21.5621 35 24 35 24C37 30.0751 30.0751 35 24 35H16C9.92487 35 5 30.0751 5 24C5 24 5 21.5621 5 20C5 18.4379 5 16 5 16Z',
                            duration: .2
                        }, {
                            morphSVG: 'M5 16C5 9.92487 9.92487 5 16 5H24C30.0751 5 35 9.92487 35 16C35 16 35 18.4379 35 20C35 21.5621 35 24 35 24C35 30.0751 30.0751 35 24 35H16C9.92487 35 5 30.0751 5 24C5 24 5 21.5621 5 20C5 18.4379 5 16 5 16Z',
                            duration: .3
                        }]
                    });
                }
            } else {
                this.disable()
                gsap.to(handle, {
                    keyframes: [{
                        x: drop.offsetLeft - 8,
                        duration: .6,
                        ease: 'elastic.out(1, .8)'
                    }, {
                        x: button.offsetWidth / 2 - handle.offsetWidth - 20,
                        duration: .3
                    }]
                });
                gsap.to(handlePath, {
                    keyframes: [{
                        morphSVG: 'M5 16C3 9.92487 9.92487 5 16 5H24C30.0751 5 35 9.92487 35 16C35 16 35 18.4379 35 20C35 21.5621 35 24 35 24C35 30.0751 30.0751 35 24 35H16C9.92487 35 3 30.0751 5 24C5 24 6 21.5621 6 20C6 18.4379 5 16 5 16Z',
                        duration: .2
                    }, {
                        morphSVG: 'M5 16C5 9.92487 9.92487 5 16 5H24C30.0751 5 35 9.92487 35 16C35 16 35 18.4379 35 20C35 21.5621 35 24 35 24C35 30.0751 30.0751 35 24 35H16C9.92487 35 5 30.0751 5 24C5 24 5 21.5621 5 20C5 18.4379 5 16 5 16Z',
                        duration: .15
                    }]
                });
                gsap.to(button, {
                    '--background-opacity': 0,
                    '--progress-opacity': 0,
                    '--handle-blur': 0,
                    '--icon-y': .5,
                    duration: .3,
                    delay: .2
                });
                gsap.to(button, {
                    '--icon-rotate': 87,
                    '--icon-offset': 15.5,
                    '--icon-scale': 1.5,
                    duration: .25,
                    delay: .3
                });
                gsap.to(button, {
                    '--success-opacity': 1,
                    '--success-scale': 1,
                    '--success-x': 8,
                    duration: .2,
                    delay: .8
                });
            }
        }
    });

    button.addEventListener('click', e => {

        if (button.classList.contains('active')) {
            return
        }

        button.classList.add('active');

        gsap.to(button, {
            '--handle-drop-opacity': 1,
            '--default-opacity': 0,
            '--default-scale': .8,
            duration: .2
        })
        gsap.to(button, {
            '--progress-opacity': .5,
            '--progress-scale': 1,
            duration: .2,
            delay: .15
        })

    });

});

function dragging(x, button, handle, drop, handleTween, dropTween) {
    let progress = button.offsetWidth - 16 - handle.offsetWidth - drop.offsetWidth - x - 8;

    progress = (12 - (progress > 12 ? 12 : progress < -12 ? -12 : progress)) / 12;
    progress = progress > 1 ? 2 - progress : progress;

    handleTween.progress(progress);
    dropTween.progress(progress);
}