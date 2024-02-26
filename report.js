document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('form button');
    const progressbar = document.querySelector('.progressbar');
    const bar = document.querySelector('.progressbar .bar');
    const submitted = document.querySelector('.submitted');
    const postUrlInput = document.querySelector('#postUrl');

    // Animation and form submission handling
    form.addEventListener('submit', async e => {
        e.preventDefault();

        // Initial form submission animation
        animateFormSubmission(submitBtn, progressbar, bar, submitted);

        // Validate and process the URL
        const postUrl = postUrlInput.value;
        if (isValidUrl(postUrl)) {
            try {
                const data = await fetchScrapedContent(postUrl);
                console.log(data); // Log or process your data here
                // TODO: Update the UI with fetched content
            } catch (error) {
                console.error('Error scraping content:', error);
                // TODO: Update the UI to show an error message
            }
        } else {
            console.error('Invalid URL');
            // TODO: Update the UI to show an error message
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
            submitted.style.top = '0';
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

    // async function fetchScrapedContent(url) {
    //     try {
    //         const response = await fetch('<API_GATEWAY_ENDPOINT>', { // Replace <API_GATEWAY_ENDPOINT> with your actual endpoint
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ url: url }),
    //         });
    //         if (!response.ok) throw new Error('Server responded with an error: ' + response.statusText);
    //         const data = await response.json();
    //         return data; // Return the data for further processing
    //     } catch (error) {
    //         throw error; // Rethrow the error to be caught by the calling function
    //     }
    // }
});
