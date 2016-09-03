var	cradle 				= require('cradle'),
		path          = require('path'),
    passport      = require('passport'),
		jwt           = require('jsonwebtoken'),
    LocalStrategy = require('passport-local').Strategy,
		bodyParser    = require('body-parser'),
		md5    				= require('md5'),
    moment    		= require('moment'),
    async    			= require('async');

//var db = new(cradle.Connection)('http://52.89.48.249', 5984).database('presety');
var db = new(cradle.Connection)().database('shifty');

/*
 * GET /presets
 *
 * GET ALL PRESETS
 */
exports.getPresets = function(req, res){
	var response = {
		presets: []
	};
  
  if(req.query.title !== undefined){
    db.view('presets/presetsByTitle', {key: req.query.title, include_docs: true}, function (err, docs) {
  		if(err){
        console.log(err);
  			res.status(500).send(err);
  		}
  		if(docs){
  		  docs.forEach(function(doc) {
          var item = doc.doc.data;
  				item.id = doc.doc._id;
  				item.rev = doc.doc.rev;
  				response.presets.push(item); 
        });
        res.status(200).send(response);
      }
    });
  }
};


/*
 * GET /presets/:preset_id
 *
 * GET PRESET BY ID
 */
exports.getPreset = function(req, res){
	db.get(req.param('preset_id'), function (err, doc) {
		if(doc){
			delete doc._rev;
		
			var response = {
				preset: doc.data
			};
			response.preset.id = req.param('preset_id')
		
			res.status(200).send(response);
		}else{
			res.status(404).send("Not found");
		}
  });
};

/*
 * POST /preset/
 *
 * POST PRESET
 */
exports.postPreset = function(req, res){
	var response = {
		preset: null
	};
	
	var preset = {
		data: req.body.preset
	}
	var title = preset.data.reference + " - " + preset.data.startTime + " to " + preset.data.endTime;
  db.view('presets/presetsByTitle', {key: title, include_docs: true}, function (err, docs) {
		if(err){
      console.log(err);
			res.status(500).send(err);
		}
    console.log(docs);
		if(docs.length === 0){
      db.save(preset, function (err, dbRes) {
        if(err){
          console.log(err);
          res.status(500).send(err);
        }else{
      		var item = preset.data;
      		item.id = dbRes.id;
      		item.rev = dbRes.rev;
		
      		response.preset = item;
		
          res.status(201).send(response);
        }
      });
    }
  });
};

/*
 * PUT /preset/:preset_id
 *
 * UPDATES PRESET BY ID
 */
exports.updatePreset =  function(req, res){
	var presetID = req.param('preset_id');
  
  db.get(req.param("preset_id"), function(err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      var currentUser = doc.data;
      
      var preset = {
    		_rev: req.body.preset.rev,
         data: req.body.preset
       }
       
       db.save(presetID, preset, function(err, dbRes) {
         if (err) {
           console.log('Could not update preset');
           console.log(err);
           res.status(500).send(err);
         } else {
           console.log(presetID + ' has been updated');
           var response = {
             user: null
           };
           response.preset = req.body.preset;
           response.preset.id = presetID;
           response.preset.rev = dbRes.rev;
      
           res.status(200).send(response);
         }
       });
    }
  });
};

/*
 * DELETE /preset/
 *
 * DELETS PRESET
 */
exports.deletePreset = function(req, res) {
  var presetID = req.param('preset_id');
	
  db.remove(presetID, function(err, dbRes) {
    if (dbRes) {
      if (err) {
        console.log('There was a error: ');
        res.status(500).send(err);
      } else {
        console.log('Deleted preset with id of: ' + presetID);
        res.status(200).send({});
      }
    } else {
      res.status(404).send("404: Not found");
    }
  });
};


