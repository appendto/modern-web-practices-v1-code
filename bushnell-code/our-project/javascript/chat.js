(function() {

    var chatBtn = document.getElementById('chat'),
        currentDate = new Date();

    if (currentDate.getHours() < 18) {
        chatBtn.className = 'active';
        chatBtn.innerHTML = 'Chat with us!';
        chatBtn.addEventListener('click', function() { alert("You can't really chat. It's just a demo!"); } );
    } else {
        chatBtn.innerHTML = 'Chat is currently offline';
    }

})();