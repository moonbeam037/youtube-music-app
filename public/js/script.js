(function (w) {
    console.log(w.location.href);
    if((w.innerWidth < 800 || w.screen.width < 800) & w.location.href.indexOf("/mobile") == -1){
        w.location.href="/mobile"
    }
})(window)

var tag = document.createElement('script');
const socket = io();
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

function openNav() {
    document.getElementById('sidenav').style.width = window.innerWidth + "px";
}
function closeNav() {
    document.getElementById('sidenav').style.width = "0";
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        width: '640',
        videoId: '',
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
    $('#player').hide()
    updateList()
}
var done = false;
function onPlayerStateChange(event) {
    if (player.getPlayerState() == 0) {
        $.post('/next', (data) => {
            playVideo(data.videoId);
        })
    }
}
var search = []
async function playVideo(videoId) {
    $('#player').show()
    $('.current').removeClass('current')
    $(`#${videoId}`).addClass('current')
    player.loadVideoById({ videoId: videoId, suggestedQuality: 'small' })
}
$('#clearVideoListBtn').click(() => {
    $('#videoList').empty()
    $('#clearVideoListBtn').hide()
})
$('#searchButton').click(() => {
    q = $('#getQuery').val()
    if (q.length == '')
        return;
    $.get('https://www.googleapis.com/youtube/v3/search', {
        part: 'snippet',
        q: q,
        type: 'video',
        key: null // your api key
    }, function (data) {
        $('#videoList').empty()
        search = data.items;
        for (elem of data.items) {
            $('#videoList').append(`<li onclick="add('${elem.id.videoId}'); $(this).hide()"  class="track">${elem.snippet.title}</li>`)
        }
        $('#clearVideoListBtn').show();
    })
})
const add = (videoId) => {
    let name = "";
    for(elem of search) 
        if (elem.id.videoId == videoId)
            name = elem.snippet.title;
    $.post('/add', {
        name: $(event.target).text(),
        videoId: videoId
    })
}
const choose = (videoId) => {
    $('#player-container').show()
    if (!$('#lock-button').length)
        return;
    $.post('/choose', {
        videoId: videoId
    })
    playVideo(videoId)
}
var myVideo = document.getElementById('#video');
$('#video').on('ended', () => {
    console.log('ended')
})
$('#lock-button').click(() => {
    if (!$('#lock-button').hasClass('greenBtn')){
        $.post('/block', (data) => {
            if (data == "OK"){
                $('#lock-button').text('Вы хост')
                $('#lock-button').addClass('greenBtn')
            }
        })
    } else {
        $.post('/unblock', (data) => {
            $('#lock-button').text('Стать хостом')
            $('#lock-button').removeClass('greenBtn')
        })
    }
})
let pressed = false;
window.addEventListener('beforeunload', () => {
    $.post('/unblock', (data) => console.log(data))
})
$('#previous').click(() => {
    $.post('/previous', (data) => playVideo(data.videoId))
})
$('#shuffle').click(() => {
    $.post('/shuffle', (data) => playVideo(data.videoId))
})
$('#next').click(() => {
    $.post('/next', (data) => playVideo(data.videoId))
})
$('#clearQueue').click(() => {
    $.post('/clearQueue', (data) => player.hide())
})
$('#pause').click(() => {
    if (player.getPlayerState() == 1) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
})

setTimeout(() => {
    $('.loader').remove()
    $('.main').show()
}, 1);

function updateList() {
    $('#queueList').empty()
    $.post('/checkList', (data) => {
        for (elem of data.videoList) {
            if (elem.videoId == data.currentVideo.videoId)
                $('#queueList').append(`<li class="track-in-list current" id="${elem.videoId}" onclick="choose('${elem.videoId}')">${elem.title}</li>`)    
            else $('#queueList').append(`<li class="track-in-list" id="${elem.videoId}" onclick="choose('${elem.videoId}')">${elem.title}</li>`)
        }
    })
}

socket.on('update', (arg) => {
    $('#queueList').empty()
    for (elem of arg.videoList) {
        if (elem.videoId == arg.currentVideo.videoId)
            $('#queueList').append(`<li class="track-in-list current" id="${elem.videoId}" onclick="choose('${elem.videoId}')">${elem.title}</li>`)    
        else $('#queueList').append(`<li class="track-in-list" id="${elem.videoId}" onclick="choose('${elem.videoId}')">${elem.title}</li>`)
    }
})
