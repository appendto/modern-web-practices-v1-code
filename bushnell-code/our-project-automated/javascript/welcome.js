(function() {

    var messages = [
        "Hola",
        "Howdy",
        "Como estas",
        "Welcome",
        "Hi there",
        "Hello"
    ];

    var message = messages[Math.floor(Math.random()*messages.length)];

    document.getElementById('welcome').innerHTML = message;

})();