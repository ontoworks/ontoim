var sys = require('sys');
var xmpp = require('node-xmpp');
var net = require('net');
var jQuery= require('jquery');
var EventEmitter = require('events').EventEmitter;

function removeNL(s){
    return s.replace(/[\n\r\t]/g,"");
}

function timestamp() {
    var date= new Date();
    var timestamp= date.getHours()+":";
    timestamp += date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes();
    timestamp += ":";
    timestamp += date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds();
    return timestamp;
}

var ConnectionManager= function() {
    EventEmitter.call(this);

    var sessions= {};
    var self= this;

    this.add_session= function(jid, session) {
	sessions[jid]= session;
    };

    this.get_session= function(jid) {
	return sessions[jid];
    };

    var server= net.createServer(function (stream) {
	stream.setEncoding('utf8');
	
	stream.on('connect', function () {
	    stream.write('hello\r\n');
	});
	
	stream.on('data', function (data) {
	    data= removeNL(data);
	    var request;
	    try {
		request= JSON.parse(data);
	    } catch(err) {
		stream.write(error);
	    }
	    if (!request) return 0;

	    var sid= request.sid;
	    var jid= request.from;
	    var session= self.get_session(jid);

	    // Open XMPP persistent client connection
	    if(sid && jid) {
		if (request.session) {
		    var session = new xmpp.Client(request.session);
		    session.on('online', function() {
			console.log('online');
			self.add_session(jid, session);

			// send presence
			session.send(new xmpp.Element('presence'));
			// request for roster
			var iq_roster= new xmpp.Element('iq', {type: 'get'});
			var query_roster= new xmpp.Element('query', {xmlns:'jabber:iq:roster'});
			iq_roster.cnode(query_roster);
			session.send(iq_roster);

			var _session= {session: { sid: sid, jid: jid }};
			stream.write(JSON.stringify(_session));
		    });
		    
		    session.on('stanza', function(stanza) {
			var stanza_type;
			var to= stanza.attrs.to;
			if (stanza.is('message') &&
			    // Important: never reply to errors!
			    stanza.attrs.type !== 'error') {
			    stanza_type= "message";
			    // Swap addresses...
			    stanza.attrs.to = stanza.attrs.from;
			    delete stanza.attrs.from;
			    // and send back.
			    session.send(stanza);
			} else if(stanza.is('presence')) {
			    stanza_type= "presence";
			    // console.log(stanza.toString());
			} else if(stanza.is('iq')) {
			    stanza_type= "iq";
			    var str_stanza= stanza.toString();
			    var jQ_stanza= jQuery(str_stanza);

			    // Roster coming
			    var jQ_roster= jQ_stanza.find("query[xmlns='jabber:iq:roster']");
			    if (jQ_roster.length > 0) {
				var jQ_roster_items= jQ_stanza.find('item');
				var roster= {roster: {to: to, blist:[], contacts: {}}, sid: sid, service: 'gtalk'};
				jQ_roster_items.each(function() {
				    roster.roster.blist.push(jQuery(this).attr('jid'));
				    roster.roster.contacts[jQuery(this).attr('jid')]= {};
				});
				roster.roster.blist.sort();
				stream.write(JSON.stringify(roster));
			    }
			} else {
			    stream.write(stanza.toString());
			}
			
			console.log("["+timestamp()+"] "+stanza_type);
		    });
		} else {
		    if (request.message) {
			// session.send("");
			stream.write(request.message.content);
		    } else if (request.presence) {
			var session= self.get_session(jid);
			session.send(new xmpp.Element('presence'));
		    } else if (request.iq) {
		    }
		}
	    } else {
		stream.write("what?\n");
	    }
	});
	
	stream.on('end', function () {
	    stream.write('goodbye\r\n');
	    stream.end();
	});
    });
    server.listen(8124, 'localhost');
};

sys.inherits(ConnectionManager, EventEmitter);

new ConnectionManager();