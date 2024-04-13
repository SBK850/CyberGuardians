// This function will be called when a video list item is clicked
function changeVideo(src, title, listElement) {
    // Update the main video source and title
    let mainVideo = document.querySelector(".main-video-container .main-video");
    let mainVideoTitle = document.querySelector(".main-video-container .main-video__title");
    mainVideo.src = src;
    mainVideoTitle.textContent = title;

    // Play the video
    mainVideo.play();

    // Scroll to the top of the page to bring the main video into view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update the 'active' class for the current video
    let videoList = document.querySelectorAll(".video-list-container .list");
    videoList.forEach((vid) => {
        vid.classList.remove("active");
    });
    listElement.classList.add("active");
}

// Set up the click event for each video list item
document.querySelectorAll(".video-list-container .list").forEach((vid) => {
    vid.onclick = () => {
        // Get the video source and title from the clicked item
        let src = vid.querySelector(".list__video").src;
        let title = vid.querySelector(".list__title").textContent; // Use textContent for better performance and consistency

        // Call the changeVideo function with the src, title, and clicked list item element
        changeVideo(src, title, vid);
    };
});
