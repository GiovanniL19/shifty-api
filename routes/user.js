var	cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
		jwt           = require('jsonwebtoken'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5');

//var db = new(cradle.Connection)('http://52.89.48.249', 5984).database('shifty');
var db = new(cradle.Connection)().database('shifty');

//CHECKS CREDENTIALS
passport.use(new LocalStrategy(
  function(username, password, done) {
    db.view('users/userByUsername', {
      key: username,
      include_docs: true
    }, function(err, docs) {
      if (err || docs.length == 0) {
        console.log('Error: User not found');
        return done(err);
      } else {
        var user = docs[0];
        console.log('Found user ' + user.key);
        if (password === user.doc.data.secure.salt) {
          console.log('Correct Password');
          return done(null, user);
        } else {
          console.log('Incorrect Password');
          return done(null, false, {
            message: 'Incorrect password.'
          });
        }
      }
    });
  }
));
 
/*
 * POST /authenticate
 *
 * AUTHENTICATE USER
 */
exports.authenticate = function(req, res, next){
	passport.authenticate('local', function(err, user, info) {
	  if (err) {
	    return next(err)
	  }
	  if (user === false) {
	    console.log('Incorrect Login Details');
	    return res.status(404).send( {
	      error: 'No user was found, please try again'
	    });
	  } else {
	    console.log('Creating token');
	    var user = user.doc;
 
	    console.log(user._id)
  
	    var token = jwt.sign({user: user._id}, "shifty-api-token-secure");
	    res.status(200).send({token: token, userId: user._id});
	  }

	})(req, res, next);
};


/*
 * GET /users/:user_id
 *
 * GET USER BY ID
 */
exports.getUser = function(req, res){
	var response = {
    user: null
  }

  db.get(req.param("user_id"), function(err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      response.user = doc.data;
      response.user.id = doc._id;
      response.user.rev = doc._rev;
			
      delete response.user._rev;
      delete response.user._id;

      console.log('Retrieved ' + req.param("user_id") + ' user by ID');
      res.status(200).send(response);
    }
  });
};

/*
 * PUT /users/:user_id
 *
 * UPDATES USER BY ID
 */
exports.updateUser = function(req, res){
	var userId = req.param('user_id')
  var user = {
		_rev: req.body.user.rev,
     data: req.body.user
   }

   user.data = req.body.user;
   user.data.lastModified = Date.now();
   
   delete user.data.rev;

   db.save(userId, user, function(err, dbRes) {
     if (err) {
       console.log('Could not update user');
       console.log(err);
       res.status(500).send(err);
     } else {
       console.log(userId + ' has been updated');
       var response = {
         user: null
       };
       response.user = req.body.user;
       response.user.id = userId;
       response.user.rev = dbRes.rev;
      
       res.status(200).send(response);
     }
   });
};

/*
 * GET /check?email=test@test.com&username=
 *
 * Check if email exists or username
 */
exports.check = function(req, res){
	
  if(req.query.email !== undefined){
  	db.view('users/userByEmail', {key: req.query.email, include_docs: true}, function (err, docs) {
  		if(err){
  			res.status(500).send(err);
  		}
      console.log(docs)
  		if(docs.length > 0){
  			res.status(200).send(true);
  		}else{
  			res.status(200).send(false);
  		}
    });
  }else if(req.query.username !== undefined){
  	db.view('users/userByUsername', {key: req.query.username, include_docs: true}, function (err, docs) {
  		if(err){
  			res.status(500).send(err);
  		}
  		if(docs.length > 0){
  			res.status(200).send(true);
  		}else{
  			res.status(200).send(false);
  		}
    });
  }
};