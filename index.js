var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var SocketIOFileUpload = require('socketio-file-upload');
var usernames = {};
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var readline = require('readline');
var bodyParser = require('body-parser');
var Request = require('request');

require('dotenv').config({silent: true});

const toneAnalyzer = new ToneAnalyzerV3({
	version_date: '2017-09-21',
	username: process.env.TONE_ANALYZER_USERNAME,
	password: process.env.TONE_ANALYZER_PASSWORD,
});



app.use(bodyParser.json());
//app.use(express.static('public'));
//app.use(SocketIOFileUpload.router);
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
				var mood = AnalyzeTone(msg, socket);
				console.log('Mood: ' + mood);
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
		var mood = AnalyzeTone(msg, socket);
		console.log('Mood in message : ' + mood);
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



//--------------------------------------------------------------------------ToneAnalyzer

/*
function AnalyzeTone(message,socket){
	var value;

	let params = {
		tone_input: message,
		content_type: 'text/plain',
		sentences: true
	};

	toneAnalyzer.tone(params,function(error,response){
		value = '';
		if(error){
			value = error;
			console.log(value);
		} else {
			console.log('ToneAnalyzervalue: ' + JSON.stringify(response,null,2));
			value = happyOrUnhappy((response));
			var msg = "my Mood " + value;
			io.emit('chat message', {msg: msg,user: socket.username});
			console.log(value);
		}
	})

	return value;
*/
function AnalyzeTone(message,socket){
 	value = "";
	var params = createToneRequest(message,socket)

function createToneRequest (message,socket) {
	var toneChatRequest;
	console.log(message);
	var messageSplit = message.split('.');
	toneChatRequest = {utterances: []};

    for (let i in messageSplit ) {
			console.log("message split" + messageSplit [i]);
      let utterance = {text: messageSplit[i]};
      toneChatRequest.utterances.push(utterance);
		}
		return toneChatRequest;
}

toneAnalyzer.toneChat(params,function(error,response) {
	if (error) {
		console.log(error);
	} else {
		console.log('Im toneAnalyzer drinnen');
		value = happyOrUnhappy((response));
		console.log("value ist = " + value);
		console.log(JSON.stringify(response, null, 2));	
	}
});
return value;
}
  function happyOrUnhappy (response) {
	const happyTones = ['satisfied', 'excited', 'polite', 'sympathetic','joy'];
	const unhappyTones = ['sad', 'frustrated', 'impolite','sadness','anger'];
	let happyValue = 0;
	let unhappyValue = 0;

	for (let i in response.utterances_tone) {
    let utteranceTones = response.utterances_tone[i].tones;
    for (let j in utteranceTones) {
      if (happyTones.includes(utteranceTones[j].tone_id)) {
        happyValue = happyValue + utteranceTones[j].score;
      }
      if (unhappyTones.includes(utteranceTones[j].tone_id)) {
        unhappyValue = unhappyValue + utteranceTones[j].score;
      }
    }
	}
	console.log('HappyValue: '+ happyValue);
	console.log('unhappyValue: '+ unhappyValue);
  if (happyValue >= unhappyValue) {
    return ':D';
  }
  else {
    return ':(';
  }
}

	//---------------------------------------------Die Funktioniert------------------------------------------
		/*	for (let i in response.sentences_tone) {
		console.log('Erste For-Schleife Hallo');
		console.log('Sentence Score: '+ response.sentences_tone[i]);
		
	  let sentencesTone = response.sentences_tone[i].tones;
	  for (let j in sentencesTone) {
			console.log('Happy or Unhappy inside for ' + sentencesTone[j]);
		if (happyTones.includes(sentencesTone[j].tone_id)) {
			console.log('HAPPY');
		  happyValue = happyValue + sentencesTone[j].score;
		}
		if (unhappyTones.includes(sentencesTone[j].tone_id)) {
			console.log('UNHAPPY');
		  unhappyValue = unhappyValue + sentencesTone[j].score;
		}
		}
			console.log('happyvalue: ' + happyValue);
			console.log('unhappyValue: ' + unhappyValue);
			if (happyValue >= unhappyValue) {
	  		return ':)';
			}
			else {
	 			return ':(';
			}
	}*/
	//-------------------------------------------------------------------------------------------------------

	/*
	for (let i in response.document_tone) {
		console.log('Erste For-Schleife Hallo');
		console.log('ToneScore: '+ response.document_tone.tones[i]);
		
		
	  let documentTone = response.document_tone[i].tones;
	  for (let j in documentTone) {
			console.log('Happy or Unhappy inside for ' + documentTone[j]);
		if (happyTones.includes(documentTone[j].tone_id)) {
			console.log('HAPPY');
		  happyValue = happyValue + documentTone[j].score;
		}
		if (unhappyTones.includes(documentTone[j].tone_id)) {
			console.log('UNHAPPY');
		  unhappyValue = unhappyValue + documentTone[j].score;
		}
	  }
	}*/