var express = require('express');
var sys   = require('sys'),
    exec  = require('child_process').exec;

var app = module.exports = express.createServer();
app.set('view engine', 'jade');
app.configure(function(){
    app.use(express.bodyDecoder());
});

// var sass = require('sass')

function convert_sass(filename) {
    var result;
    var child = exec('sass '+filename, 
		 function (error, stdout, stderr) {
		     sys.print('stdout: ' + stdout);
		     sys.print('stderr: ' + stderr);
		     if (error !== null) {
			 console.log('exec error: ' + error);
			 result= "";
		     }
		     result= stdout;
		 });
    return result;
}


app.get('/*.css', function(req, res) {
    var url= req.url.split('/').reverse();
    if (url[1] == 'css') {
	var filename= res.req.params[0].split('/')[1];
	// var css= convert_sass(__dirname+'/views/'+filename + '.css.sass');
	res.render(filename + '.css.sass', { layout: false });
    } else {
	res.sendfile(__dirname+'/public/stylesheets/'+req.params[0]+'.css');
    }
});

app.get('/javascripts/*', function(req, res){
    res.sendfile(__dirname+'/public/javascripts/'+req.params[0]);
});

app.get('/images/*', function(req, res){
    res.sendfile(__dirname+'/public/images/'+req.params[0]);
});

app.get('/', function(req, res){
    res.render('index.jade', {
	locals: {
	    title: "OntoIM"
	}
    });
});

app.listen(8080);