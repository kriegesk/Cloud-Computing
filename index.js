var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var usernames = [];
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('Socket verbunden');
	
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
