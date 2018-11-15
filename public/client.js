$(function () {
    var $nameForm = $('#nameForm');
    var socket = io();
    var $users = $('#users');
    var $username =$('#username');
    var $messageForm = $('#messageForm');
    var $messages= $('#messages');
    var $chatFenster = $('#chatFenster');
    
    //actions for the login window
    $nameForm.submit(function(e){
        if($username.val().trim()==""){
            alert('Please choose a name!');
            return false;
        } else {
            e.preventDefault();
            console.log('user logged in: ' + $username.val());
            socket.emit('new user',$username.val(),function(data){
            if(data){
                $('#usernameWrapper').hide();
                $('#chat').show();
            }else{
                
            }
            });	
        }
        
        
    });

    
    //event for the data download
    socket.on('data', function(data){
        //$messages.append('<a href="data:application/' + data + ';charset=utf-8;base64,Zm9vIGJhcg==">text file</a><br/>')
        //document.getElementById('downloadbtn').disabled = false;			
    });	

    //update of usernames
    socket.on('usernames', function(data){
        var html = 'User Online:' +'<br><br>';
        var newuser = '';
        for(i = 0; i < data.length;i++){
            html += data[i]+ '<br>';
        }
        $users.html(html);
    });
    
    //actions for the submission of a message to the server
    $messageForm.submit(function(e){
        if($('#m').val().trim()==""){
            alert('Do not send empty messages!');
            return false;
        } else {
            socket.emit('chat message', $('#m').val(),function(data){
                $messages.append('<span class="error"> ERROR: '+ data  + '</span><br>');
            });
              $('#m').val('');
            return false;
        }
    });

    //getting a message from the server
    socket.on('chat message', function(data){
        var currentDate = new Date();
        var minutes = '';
        var seconds = '';
        if(currentDate.getMinutes() < 10){
            minutes += '0'+currentDate.getMinutes();
        } else {
            minutes += currentDate.getMinutes();
        }
        if(currentDate.getSeconds() < 10){
            seconds += '0'+currentDate.getSeconds();
        } else {
            seconds += currentDate.getSeconds();
        }
        var datetime = currentDate.getDate() + '.' 
                       + (currentDate.getMonth()+1) + '.'
                       + currentDate.getFullYear() + ' @ '
                       + currentDate.getHours() + ':'
                       + minutes + ':'
                       + seconds;
        $messages.append('<span class="public"><Strong>'+data.user+ '</strong>: ' + data.msg 
                         + '<br>' + '</span><span class="date"><i>Sent on: ' + datetime + '</i><br></span>');
        //Hier muss man noch irgendwie den Wert berechnen wie weit es scrollen muss, 
        //ist im Moment mit 1000 festgeschrieben
        chatFenster.scrollTo({
            top: 1000,
            behavior: "smooth"
        })
    });
    
        // Private msg Function
        socket.on('private', function(data){
        $messages.append('<span class="private"> <Strong>'+ 'private: '+data.user+ '</strong>: ' + data.msg  + '</span><br>');
    });

        // mood function
    socket.on('mood', function(data){
        $messages.append('<span class="mood"> mood of the user is:  '+ data.msg  + '</span><br>');
    });
});