var	cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
		jwt           = require('jsonwebtoken'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5');
    
var nodemailer = require('nodemailer');

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
 * POST /users
 *
 * POST USER
 */
exports.saveUser = function(req, res){
	var response = {
    user: null
  }
  if(req.body.user){
    newUser = {
      data: req.body.user
    }
  
    newUser.identity.image = "data:image/png;base64,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";
    
    db.save(newUser, function (err, dbRes) {
      if(err){
        res.status(500).send(err)
      }else{
        response.user = dbRes.data;
        res.status(201).send(response);
      }
    });
  }else{
    res.status(400).send('Incorrect user format');
  }
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
      delete response.user.secure.salt;
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
	var userId = req.param('user_id');
  
  db.get(req.param("user_id"), function(err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      var currentUser = doc.data;
      
      var user = {
        _rev: req.body.user.rev,
         data: req.body.user
       }
       
      if(req.body.user.secure.salt){
        user.data.secure.salt = req.body.user.secure.salt;
      }else{
        user.data.secure.salt = currentUser.secure.salt;
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


/*
 * GET /resetPassword?email=test@test.com
 *
 * Reset password for account with given email address
 */
exports.resetPassword = function(req, res){
	db.view('users/userByEmail', {key: req.query.email, include_docs: true}, function (err, docs) {
		if(err){
			res.status(500).send(err);
		}else{
      if(docs.length > 0){
        var user = docs[0].doc;

        var text = "";
        var possible = "!@£$%^&*(~)ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 8; i++){
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
    
        var password = md5('j*(XY@^T%&!F%I)' + text + 'juxhUGBG@^&DF(A)');
    
        console.log(text);
    
        user.data.secure.salt = password;
        user.data.secure.tempPass = true;
    
        db.save(docs[0].doc._id, user, function(err, dbRes) {
          if (err) {
            console.log('Could not update user');
            console.log(err);
            res.status(500).send(err);
          } else {
            console.log(docs[0].doc._id + ' has been updated');
        
            var transport = nodemailer.createTransport('SMTP', {
              host: 'mail.giovannilenguito.co.uk',
              auth: {
                user: "shifty@giovannilenguito.co.uk",
                pass: "mnCJX/YVU"
              }
            });
        
            var mailOptions = {
              from: '"Shifty" <shifty@giovannilenguito.co.uk>', // sender address
              to: user.data.identity.email, // list of receivers
              subject: 'Shifty Password Reset', // Subject line
              html: 'Your generated password is: <b>'+text+'</b>.<br>Please change your password when you login.' // html body
            };

            // send mail with defined transport object
            transport.sendMail(mailOptions, function(error, info){
              if(error){
                console.log(error);
                res.status(200).send(false);
              }else{
                console.log('Message sent: ' + info.response);
                res.status(200).send(true);
              }
            });
          }
        });
      }else{
        res.status(404).send('Not Found User');
      }
    }
  });
};