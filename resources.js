let videoList = document.querySelectorAll(".video-list-container .list");

videoList.forEach((vid) => {
    vid.onclick = () => {
        // Remove 'active' class from all list items first
        videoList.forEach((remove) => {
            remove.classList.remove("active");
        });

        // Add 'active' class to the clicked list item
        vid.classList.add("active");

        // Get the video source and title from the clicked item
        let src = vid.querySelector(".list__video").src;
        let title = vid.querySelector(".list__title").textContent; // Use textContent for better performance and consistency

        // Update the main video source
        let mainVideo = document.querySelector(".main-video-container .main-video");
        mainVideo.src = src;

        // Play the video
        mainVideo.play();

        // Update the title in the main video container
        document.querySelector(".main-video-container .main-video__title").textContent = title;
    };
});

function changeVideo(src, title) {
    var mainVideo = document.getElementById('mainVideo');
    var mainVideoTitle = document.querySelector('.main-video__title');

    mainVideo.src = src;
    mainVideoTitle.textContent = title;

    // Optionally, play the video and scroll back to the main video section
    mainVideo.play();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update active class for current video
    var lists = document.querySelectorAll('.list');
    lists.forEach(list => list.classList.remove('active'));
    event.currentTarget.classList.add('active');
}