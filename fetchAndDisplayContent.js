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
        submitBtn.textContent = 'Submitted!';
        animateFormSubmission(submitBtn, progressbar, bar, submitted);
    });

    async function fetchAndDisplayContent(postUrl, bar, submitBtn) {
        showProgressBar(bar);

        try {
            const apiEndpoint = 'https://cyberguardians.onrender.com/scrape';
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: postUrl })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const data = await response.json();
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
            submitBtn.textContent = 'Submit';
        }
    }

    function animateFormSubmission(submitBtn, progressbar, bar, submitted) {
        form.style.animation = 'linear .3s push';
        setTimeout(() => {
            submitBtn.style.animation = 'ease .5s scaleWidth';
            submitBtn.style.width = '100%';
            bar.style.animation = 'ease .7s scaleBar';
            bar.style.width = '100%';
        }, 300);
        setTimeout(() => {
            submitBtn.textContent = 'Loading...';
            fetchAndDisplayContent(postUrlInput.value.trim(), bar, submitBtn);
        }, 900);
    }
});
