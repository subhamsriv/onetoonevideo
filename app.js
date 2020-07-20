var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var axios = require('axios');
var _ = require('lodash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/conferencing', usersRouter);
app.get('/icecandidate', (req,res) => {
  axios.put('https://global.xirsys.net/_turn/MyFirstApp',
   {
      format: "urls"
  },
  {
    headers: {
      "Authorization": "Basic " + Buffer.from(process.env.trunauth).toString("base64"),
      "Content-Type": "application/json",
    }
  }
  ).then(response => {
    console.log(response.data);
    res.send(response.data);
  })
  .catch((err) => {
    console.log(err);
  })
})

var port =  process.env.PORT || '8081';

var server = http.Server(app);
server.listen(port);
var io = require('socket.io')(server);



io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('nickName', (s) => {
      console.log(s);
      socket.nickname = s.nickName
      socket.broadcast.emit('joined', {user : socket.id, nickName: s.nickName });
    })
    

    socket.on('callStart',(s)=>{
      console.log(s);
      io.to(s.target).emit('callingStart', s)
    })
    
    socket.on('StartNegotiation',(s)=>{
      console.log(s);
      io.to(s.target).emit('startingNegotiation', s)
    })
    socket.on('call',(s)=>{
      console.log(s);
      io.to(s.target).emit('calling', s)
    })
    socket.on('receiveCall', (s)=>{
      console.log(s);
      io.to(s.target).emit('ack', s);
    });
    socket.on('ice', (s) => {
      console.log(s);
      io.to(s.target).emit('icereceive', s);
    })
    socket.on('hangup', (s) => {
      console.log(s);
      io.to(s.target).emit('hangupReceive', s);
    })
 });

 

 