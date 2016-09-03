var	cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
		jwt           = require('jsonwebtoken'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5'),
    moment    		= require('moment'),
    async    			= require('async');

//var db = new(cradle.Connection)('http://52.89.48.249', 5984).database('shifty');
var db = new(cradle.Connection)().database('shifty');

/*
 * GET /shifts
 *
 * GET ALL SHIFTS
 */
exports.getShifts = function(req, res){
	var response = {
		shifts: []
	};
  
  if(req.query.userID !== undefined && req.query.month !== undefined && req.query.year !== undefined){
    db.view('shifts/shiftsByUser', {key: req.query.userID, include_docs: true}, function (err, docs) {
  		if(err){
        console.log(err);
  			res.status(500).send(err);
  		}
  		if(docs){
  		  async.eachSeries(docs, function(doc, nextDoc) {
          var month = moment.unix(doc.doc.data.dateTimeStamp).format('M');
          var year = moment.unix(doc.doc.data.dateTimeStamp).format('YYYY');
          if(month == req.query.month && year == req.query.year){
            var item = doc.doc.data;
    				item.id = doc.doc._id;
    				item.rev = doc.doc.rev;
    				response.shifts.push(item); 
          }
          nextDoc();
          
        }, function done(){
          res.status(200).send(response);
        });
      }
    });
  } else if(req.query.when !== undefined){
  	db.view('shifts/shiftsByUser', {key: req.query.user, include_docs: true}, function (err, docs) {
  		if(err){
        console.log(err);
  			res.status(500).send(err);
  		}
  		if(docs){
  		  docs.forEach(function(doc) {
  				var item = doc.data;
          
          var now = Math.floor(Date.now() / 1000);
          
          if(item.dateTimeStamp > (now - (86400 * 7)) && item.dateTimeStamp < now && req.query.when == 'last' || item.dateTimeStamp < (now + (86400 * 7)) && item.dateTimeStamp > now && req.query.when == 'next'){
    				item.id = doc._id;
    				item.rev = doc.rev;
    				response.shifts.push(item); 
          }
  		  });
	
  			res.status(200).send(response);
  		}else{
  			res.status(404).send([]);
  		}
    });
  }else if(req.query.showHistory !== undefined){
  	db.view('shifts/shiftsByUser', {key: req.query.user, include_docs: true}, function (err, docs) {
  		if(err){
        console.log(err);
  			res.status(500).send(err);
  		}
  		if(docs){
  		  docs.forEach(function(doc) {
  				var item = doc.data;
          
          var now = Math.floor(Date.now() / 1000);
          
          if(item.dateTimeStamp < now){
    				item.id = doc._id;
    				item.rev = doc.rev;
    				response.shifts.push(item); 
          }
  		  });
	
  			res.status(200).send(response);
  		}else{
  			res.status(404).send([]);
  		}
    });
  }else if(req.query.showUpcoming !== undefined){
  	db.view('shifts/shiftsByUser', {key: req.query.user, include_docs: true}, function (err, docs) {
  		if(err){
        console.log(err);
  			res.status(500).send(err);
  		}
  		if(docs){
  		  docs.forEach(function(doc) {
  				var item = doc.data;
          
          var now = Math.floor(Date.now() / 1000);
          
          if(item.dateTimeStamp > now){
    				item.id = doc._id;
    				item.rev = doc.rev;
    				response.shifts.push(item); 
          }
  		  });
	
  			res.status(200).send(response);
  		}else{
  			res.status(404).send([]);
  		}
    });
  }else{
    res.status(404).send(response);
	}
  
};


/*
 * GET /shifts/:shift_id
 *
 * GET SHIFT BY ID
 */
exports.getShift = function(req, res){
	db.get(req.param('shift_id'), function (err, doc) {
		if(doc){
			var response = {
				shift: doc.data
			};
			response.shift.id = req.param('shift_id')
		
			res.status(200).send(response);
		}else{
			res.status(404).send("Not found");
		}
  });
};

/*
 * POST /shift/
 *
 * POST SHIFT
 */
exports.postShift = function(req, res){
	var response = {
		shift: null
	};
	
	var shift = {
		data: req.body.shift
	}
	
  db.save(shift, function (err, dbRes) {
    if(err){
      console.log(err);
      res.status(500).send(err);
    }else{
  		var item = shift.data;
  		item.id = dbRes.id;
  		item.rev = dbRes.rev;
		
  		response.shift = item;
		
      res.status(201).send(response);
    }
  });
};


/*
 * DELETE /shift/
 *
 * DELETS SHIFT
 */
exports.deleteShift = function(req, res) {
  var shiftID = req.param('shift_id');
	
  db.remove(shiftID, function(err, dbRes) {
    if (dbRes) {
      if (err) {
        console.log('There was a error: ');
        res.status(500).send(err);
      } else {
        console.log('Deleted shift with id of: ' + shiftID);
        res.status(200).send({});
      }
    } else {
      res.status(404).send("404: Not found");
    }
  });
};


