(function() {

    var currentDate = new Date;
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var day = currentDate.getDay();

    document.getElementById('date').innerHTML = month + '/' + day + '/' + year;

})();