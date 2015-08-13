function errorDialog(error) {
    alert(error);
}

function firebaseSanitize(s) {
    // . $ # [ ] /
    return s.replace(/[\.\$\#\[\]\/]/g, "");
}

function firebaseSanitizedInputFunction(event) {
    // . $ # [ ] /
    if (   event.keyCode === 46
        || event.keyCode === 36
        || event.keyCode === 35
        || event.keyCode === 91
        || event.keyCode === 93
        || event.keyCode === 47) {
        return false;
    }
    return true;
}

function joinRoom(roomName, username) {
    var rootRef = new Firebase("https://contactamania.firebaseio.com/");
    rootRef.push({"roomName": roomName, "username": username});
    $("#msg-list").html("");
    rootRef.on("child_added", function(snapshot) {
        var data = snapshot.val();
        $("#msg-list").append("<li>There once was a person named " + data.username + " who joined a room named " + data.roomName + ".</li>");
    });
}

$(document).ready(function() {
    $(".firebase-sanitize").keypress(firebaseSanitizedInputFunction);

    $("#join-room").click(function(event) {
        event.preventDefault();

        var roomName = $("#room-name-input").val();
        var username = $("#username").val();

        if (roomName === "") {
            errorDialog("Please enter a room name.");
        } else if (username === "") {
            errorDialog("Please enter a username");
        } else {
            joinRoom(roomName, username);
        }
    });

    $("#open-rooms").change(function() {
        $("#room-name-input").val($(this).val());
    })
});
