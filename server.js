var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();
var appRoutes = require('./app/routes/api')(router);
var path = require('path');

// middlewarre
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public')); //all static files like css, img...
app.use('/api', appRoutes);
app.use(express.static('/public'));


//  connect to db
mongoose.connect('mongodb://localhost:27017/myList', function(err) {
	if(err) {
		console.log('We are not connected to mongoDB. Error: ' + err);
	} else {
		console.log('We are connected to mongoDB.');
	}
});

// default page INDEX.html
app.get('*', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

// listening the port
app.listen(port, function() {
	console.log('We are runing server on port: ' + port);
});