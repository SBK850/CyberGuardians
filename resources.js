function changeVideo(src, title, listElement) {
    let mainVideo = document.querySelector(".main-video-container .main-video");
    let mainVideoTitle = document.querySelector(".main-video-container .main-video__title");
    mainVideo.src = src;
    mainVideoTitle.textContent = title;

    mainVideo.play();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let videoList = document.querySelectorAll(".video-list-container .list");
    videoList.forEach((vid) => {
        vid.classList.remove("active");
    });
    listElement.classList.add("active");
}

document.querySelectorAll(".video-list-container .list").forEach((vid) => {
    vid.onclick = () => {
        let src = vid.querySelector(".list__video").src;
        let title = vid.querySelector(".list__title").textContent; 

        changeVideo(src, title, vid);
    };
});
