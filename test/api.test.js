var google= new XmppChatClient();

module.exports = {
    'connect': function(assert) {
	google.connect({
	    jid: 'sgaviria@gmail.com',
	    password: 'S4ntiag0',
	    host: 'talk.google.com',
	    port: 5222		     
	});
    }
}