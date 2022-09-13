const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server)

// variables
let blocked = false;
let blockerIp = '';
videoList = []
let currentIndex = 0;
width = 0;
height = 0;

// functions
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    console.log(arr)
    return arr;
}

function sendVideoList() {
    io.sockets.emit("update", {videoList: videoList, currentVideo: videoList[currentIndex]});
}

server.listen(3000, () => {
    console.log('server listening on http://localhost:3000')
})

// app settings
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(cors())
app.set('views', path.join(__dirname, 'public'))
app.set('view engine', 'ejs')
app.use('/public', express.static(path.join(__dirname, 'public')))

// get and post methods
app.get('/', (req, res) => {
    let blocker = false;
    let userIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    if (blockerIp == userIp || blockerIp == '')
        blocker = true;
    res.render('index.ejs', { blocker, blocked })
})

app.post('/block', (req, res) => {
    if (blockerIp != ''){
        res.sendStatus(401);
        return;
    }
    blockerIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    blocked = true;
    res.sendStatus(200)
})

app.post('/unblock', (req, res) => {
    let reqIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    if (blockerIp != reqIp) {
        res.sendStatus(401);
        return;
    }
    blocked = false;
    blockerIp = '';
    res.sendStatus(200);
})

app.post('/add', (req, res) => {
    if (!videoList.some(u => u.videoId == req.body.videoId))
        videoList.push({title: req.body.name, videoId: req.body.videoId})
    sendVideoList()
    res.sendStatus(200);
})

app.post('/next', (req, res) => {
    currentIndex++;
    if (currentIndex >= videoList.length)
        currentIndex = 0;
        sendVideoList();
    res.json({videoId: videoList[currentIndex].videoId})
})
app.post('/checkList', (req, res) => {
    res.json({videoList: videoList, currentVideo: videoList[currentIndex]})
})
app.post('/choose', (req, res) => {
    for(let i = 0; i < videoList.length; i++){
        if (videoList[i].videoId == req.body.videoId){
            currentIndex = i;
            break;
        }
    }
    res.sendStatus(200)
})
app.get('/mobile', (req, res) => {
    console.log('redirected.')
    let blocker = false;
    let userIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    if (blockerIp == userIp || blockerIp == '')
        blocker = true;
    res.render('mobile.ejs', { blocker, blocked })
})
app.post('/resolution', (req, res) => {
    console.log(req.body)
    width = req.body.width;
    height = req.body.height;
    if (width < 800) {
        console.log('redireccting..');
        res.redirect('/mobile')
    }
})

app.post('/clearQueue', (req, res) => {
    videoList = []
    sendVideoList()
    res.sendStatus(200)
})

app.post('/shuffle', (req, res) => {
    videoList = shuffleArray(videoList)
    currentIndex = 0;
    sendVideoList()
    res.json({videoId: videoList[0].videoId})
})

app.post('/previous', (req, res) => {
    currentIndex--;
    if (currentIndex <= -1)
        currentIndex = videoList.length-1;
    sendVideoList();
    res.json({videoId: videoList[currentIndex].videoId})
})