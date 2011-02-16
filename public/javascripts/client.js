var socket = new io.Socket(null, {port: 80});
socket.connect();

var JID= {};
JID.bare= function(jid) {
    return jid.split('/')[0];
};

$.widget('ui.buddy_list', {
    _init: function() {
    },
    /*
      Renders buddy list
      - it should render odds and evens
     */
    load: function(roster) {
	var $el= this.element;
	var service= roster.service;
	var buddy_item_layout= $el.find(".buddy-list-section."+service+" .buddy-item.layout").clone();
	buddy_item_layout.removeClass("layout even odd");
	for (var i=0; i<roster.roster.blist.length; i++) {
	    var buddy_item= buddy_item_layout.clone();
	    var buddy_jid= roster.roster.blist[i];
	    buddy_item.addClass((function(parity) { return (parity%2==0) ? 'even' : 'odd'})(i));
	    buddy_item.find(".name").text(roster.roster.contacts[buddy_jid].name);
	    $el.find(".buddy-list-section."+service+" .buddy-list").append(buddy_item.show());
	}
    }
});

$("#buddy-list-box").buddy_list();

socket.on('message', function(msg) {
    var message;
    try {
	if (typeof msg == 'object') {
	    // should be a buffer only
	} else {
	    message= JSON.parse(msg);
	}
    } catch(err) {
	console.log(err);
    }

    if (message) {
	if (message.roster) {
	    $("#buddy-list-box").buddy_list("load", message);
	} else {
	    console.log(msg);
	}
    }
});

$(".input input").keyup(function(e) {
    if (e.keyCode == 13) {
	socket.send($(".input input").val());
    }
});

// Connection Manager widget
$("#connection-manager").find('.connect-btn').click(function() {
    var username= $("#connection-manager").find(".username input").val();
    var password= $("#connection-manager").find(".password input").val();
    var msg= {"session": { "jid":username,"password":password,"host":"talk.google.com","port":5222}, "from":username};
    socket.send(JSON.stringify(msg));
});