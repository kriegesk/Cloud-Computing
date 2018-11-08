var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var SocketIOFileUpload = require('socketio-file-upload');
var usernames = {};
var FileReader = require('filereader');
var File = require('File');
var data;
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
		io.emit('data',event);
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

	//send message
	socket.on('chat message', function(data, callback){
		var msg = data.trim();
		if(msg.substr(0,3) == '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substr(0, ind);
				var msg = msg.substr(ind + 1);
				if(name in usernames){
					usernames[name].emit('private', {msg: msg,user: socket.username});
					usernames[socket.username].emit('private', {msg: msg,user: socket.username});
					console.log('private!');
				}else{
					callback(" wählen sie einen verfügbaren User aus");
				}
			}else{
				callback(" Bitte fügen sie eine Nachricht hinzu");
			}
		}else{
		io.emit('chat message', {msg: msg,user: socket.username});
		}
	});
	
	//create new user and push him to the usernames array
	socket.on('new user', function(data,callback){
		if(data in usernames){
			callback(false);	
		}else{
			callback(true);
			socket.username = data;
			usernames[socket.username] = socket;
			//usernames.push(socket.username);
			updateUsernames();
		}
	});
	
	//update usernames in clients
	function updateUsernames(){
		io.emit('usernames', Object.keys(usernames));
	}
	
	
	//Disconnect
	socket.on('disconnect',function(data){
			if(!socket.username){
				return;
			}
			delete usernames[socket.username];
			//usernames.splice(usernames.indexOf(socket.username),1);
			updateUsernames();
	});
});

http.listen(port, function(){
  console.log('Server ist gestartet');
  console.log('listening on *:' + port);
});
