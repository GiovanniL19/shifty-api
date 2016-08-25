var express 			= require('express'),
 		cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5'),
    jwt           = require('express-jwt');

//var db = new(cradle.Connection)('http://52.89.48.249', 5984).database('shifty');
var db = new(cradle.Connection)().database('shifty');

var user = require('./routes/user.js');
var shift = require('./routes/shift.js');

var port = 3002;
    
var app = express();

//support json and url encoded requests
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: '500mb', extended: true}));

//IF ERROR SEND CUSTOME MESSAGE
app.use(function (err, req, res, next) {
   if (err.name === 'UnauthorizedError') {
     res.send(401, 'Invalid token, No access allowed. Please login');
   }
}); //if there is an error


//Headers
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(jwt({ secret: 'shifty-api-token-secure'}).unless({path: ['/auth']}));

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid Token');
  }
});

//Welcome
app.get('/',function(req, res){
  res.status(200).send('Welcome to Shifty API 1.0. You will need a token to access this API');
});

// Users
app.post('/auth', user.authenticate);
app.get('/users/:user_id', user.getUser);
app.put('/users/:user_id', user.updateUser);
app.get('/check', user.check);

//Shifts
app.get('/shifts/:shift_id', shift.getShift);
app.get('/shifts', shift.getShifts);
app.post('/shifts', shift.postShift);
app.delete('/shifts/:shift_id', shift.deleteShift);

app.listen(port);
console.log('Running on http://localhost:' + port);