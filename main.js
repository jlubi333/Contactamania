"use strict";

function truncate(originalText, maxLength, appendedText, strict) {
    var newText = originalText;
    if (originalText.length > maxLength) {
        if (strict) {
            newText = originalText.substring(0, maxLength - appendedText.length);
        } else {
            newText = originalText.substring(0, maxLength);
        }
        newText += appendedText;
    }
    return newText;
}

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

function gotoScreen(sel) {
    $("body > *").hide();
    $(sel).show();
}

function isPrivateRoom(roomName) {
    return roomName.charAt(0) === "_";
}

function joinRoom(rootRef, myRoomName, myUsername) {
    var roomRef = rootRef.child(myRoomName);
    var usersRef = roomRef.child("users");

    usersRef.once("value", function(initialUserListSnapshot) {
        if (initialUserListSnapshot.hasChild(myUsername)) {
            errorDialog("Someone with username \"" + myUsername + "\" is already present in room \"" + myRoomName + "\".");
            return;
        }

        gotoScreen("#game");

        var wordmasterRef = roomRef.child("wordmaster");
        var wordmaster = null;

        var myRef = usersRef.child(myUsername);

        myRef.set(0);

        myRef.onDisconnect().remove();

        usersRef.on("child_added", function(snapshot) {
            var username = snapshot.key();
            console.log("New user! Username: " + username);
        });
        usersRef.on("child_removed", function(snapshot) {
            var username = snapshot.key();
            console.log("User " + username + " left...");
        });

        wordmasterRef.on("value", function(snapshot) {
            wordmaster = snapshot.val();

            if (wordmaster === null) {
                $(".wordmaster").empty();
                $("#claim-wordmaster").prop("disabled", false);
                $(".wordmaster-only, .guessers-only").hide();
            } else {
                $(".wordmaster").html(wordmaster);
                $("#claim-wordmaster").prop("disabled", true);

                if (wordmaster === myUsername) {
                    $(".wordmaster-only").show();
                } else {
                    $(".guessers-only").show();
                }
            }
        });

        $("#claim-wordmaster").click(function(event) {
            wordmasterRef.set(myUsername);
        });

        $("#relinquish-wordmaster").click(function(event) {
            if (wordmaster === myUsername) {
                wordmasterRef.set(null);
            }
        });
    });
}

$(document).ready(function() {
    var rootRef = new Firebase("https://contactamania.firebaseio.com/");

    rootRef.on("value", function(roomListSnapshot) {
        var line = "&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;";

        if (roomListSnapshot.numChildren() === 0) {
            $("#open-rooms").prop("disabled", true);
            $("#open-rooms").html("<option>No Open Rooms</option>");
            $("#open-rooms").append("<option disabled>" + line + "</option>");
        } else {
            $("#open-rooms").prop("disabled", false);
            $("#open-rooms").html("<option>Open Rooms</option>");
            $("#open-rooms").append("<option disabled>" + line + "</option>");

            roomListSnapshot.forEach(function(roomSnapshot) {
                var roomName = roomSnapshot.key();
                if (!isPrivateRoom(roomName)) {
                    var numUsers = roomSnapshot.child("users").numChildren();
                    var unit = "users";
                    if (numUsers === 1) {
                        unit = "user";
                    }
                    $("#open-rooms").append(
                        "<option data-room-name=" + roomName + ">"
                        + truncate(roomName, 20, "...", false)
                        + " ("
                        + numUsers
                        + " "
                        + unit
                        + ")</option>"
                    );
                }
            });
        }
    });

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
            joinRoom(rootRef, roomName, username);
        }
    });

    $("#open-rooms").change(function() {
        $("#room-name-input").val($(this).children(":selected").data("room-name"));
        $("#open-rooms").prop("selectedIndex", 0);
    });
});
