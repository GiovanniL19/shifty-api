var	cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
		jwt           = require('jsonwebtoken'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5');

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
  
	db.view('shifts/shiftsByUser', {include_docs: true, key}, function (err, docs) {
		if(err){
      console.log(err);
			res.status(500).send(err);
		}else{    
  		if(docs){
        console.log(docs.length)
  		  docs.forEach(function(doc) {
  				var item = doc.data;
  				item.id = doc._id;
  				item.rev = doc.rev;
  				response.shifts.push(item);
  		  });
	
  			res.status(200).send(response);
  		}else{
  			res.status(404).send([]);
  		}
    }
  });
};


/*
 * GET /shifts/:shift_id
 *
 * GET SHIFT BY ID
 */
exports.getShift = function(req, res){
	db.get(req.param('shift_id'), function (err, doc) {
		if(doc){
			delete doc._rev;
		
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


