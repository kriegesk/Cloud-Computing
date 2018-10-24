var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var SocketIOFileUpload = require('socketio-file-upload');
var fs = require('fs');
var usernames = [];
var upload;
app.use(SocketIOFileUpload.router);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



io.on('connection', function(socket){
	console.log('Socket verbunden');

	//Set up the uploader with the path
	var uploader = new SocketIOFileUpload();
	uploader.dir = __dirname;
	console.log('Path: ' + uploader.dir);
	uploader.listen(socket);

	//actions for the saved files
	uploader.on('saved', function(event){
		upload = event;
		io.emit('data', upload);
		console.log('File Uploaded');
		console.log('-------------------------------');
		console.log(event);
		console.log('-------------------------------');
		console.log(event.file);
	});

	//actions for an error
	uploader.on('error', function(event){
		console.log('Error from uploader',event);
	});

	//Nachricht senden
	socket.on('chat message', function(data){
		io.emit('chat message', {msg: data,user: socket.username});
	});
	
	socket.on('new user', function(data,callback){
		if(usernames.indexOf(data) != -1){
			callback(false);	
		}else{
			callback(true);
			socket.username = data;
			usernames.push(socket.username);
			updateUsernames();
		}
	});
	
	//Benutzernamen Updaten
	function updateUsernames(){
		io.emit('usernames', usernames);
	}
	
	
	//Disconnect
	socket.on('disconnect',function(data){
			if(!socket.username){
				return;
			}
			usernames.splice(usernames.indexOf(socket.username),1);
			updateUsernames();
	});
});

http.listen(port, function(){
  console.log('Server ist gestartet');
  console.log('listening on *:' + port);
});
