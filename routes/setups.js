var Setup = require('../models/setup');
var rest = require('restler');

module.exports = function(app) {
  app.param('setupid', function(req, res, next, setupid){
    Setup.findOne({ _id : req.params.setupid }, function(err,setup) {
      if (err) return next(err);
      if (!setup) return next(new Error('Failed to load setup ' + setupid));
      req.setup = setup;
      next();
    });
  })
  app.get('/setups',function(req, res) {
    if (!req.loggedIn) {
      res.redirect('/login');
    } else {
      Setup.find({user_id:req.user.id},function(err,docs) {
        res.send(docs);
      });
    }
  });
  app.post('/setups',function(req, res) {
    if (!req.loggedIn) {
      res.redirect('/login');
    } else {
      var s = new Setup({
        title:req.body.title,
        url: req.body.url,
        description: req.body.description,
        user_id: req.user._id
      });
      s.save(function (err) {
        if (!err) console.log('Success!');
      });
      res.redirect('/manage');
    }
  });
  app.delete('/setups/:setupid',andRestrictToSelf,function(req, res) {
    Setup.remove({_id:req.params.setupid}, function (err) {
      if (!err) {
        console.log('successfully removed setup'+req.params.setupid);
      } else {
        console.log('failed to remove setup'+req.params.setupid);
      }
    });
  });
  app.get('/setups/:setupid',function(req, res) {
    //  req.setup.directurl = 'setups/' + req.setup._id + '/';
    //  req.user.directurl = 'users/' + req.user._id + '/';
//    console.log(req.user);
    // if (req.setup.shorturl == null) {
    //   var d = 'glowing-beach-290.herokuapp.com';
    //   var b = 'http://api.bitly.com/v3/shorten?login=chrisdubois&apiKey=R_46c7bee365ae8711c76b255cd45551ed&longUrl=';
    //   var u = 'http%3A%2F%2F' + d + '%2Fsetups%2F' + req.setup._id;
    //   //api.bitly.com/v3/shorten?login=chrisdubois&apiKey=R_46c7bee365ae8711c76b255cd45551ed&longUrl=http%3A%2F%2Fbetaworks.com%2F&format=json
    //   rest.get(b + u).on('complete', function(data) {
    //     console.log('getting short url:' + data.data.url);
    //     req.setup.shorturl = data.data.url;
    //     req.setup.save(function(err) {
    //       if (err) {          
    //         console.log('problem saving shorturl');
    //       } else {
    //         console.log('saved shorturl');
    //       }
    //     });
    //   });
    // }
//user:req.user,
    res.render('view',{setup:req.setup,title:'view setup'});
  });
  app.get('/setups/:setupid/edit',loadUser,andRestrictToSelf,function(req, res) {
    res.render('edit',{setup:req.setup,user:req.user,title:'edit setup'});
  });

  app.put('/setups/:setupid',andRestrictToSelf,function(req, res) {
    req.setup.title = req.body.title;
    req.setup.url = req.body.url;
    req.setup.description = req.body.description;
    req.setup.save(function (err) {
      if (!err) console.log('Setup updated to:'+req.setup.title);
    });
  });


  app.get('/setups/:setupid/markers',function(req, res) {
    res.send(req.setup.markers);
  });
  app.post('/setups/:setupid/markers',andRestrictToSelf,function(req, res) {
    req.setup.markers.push({text:req.body.text,x:req.body.x,y:req.body.y});
    req.setup.save();
    res.send(req.setup.markers);
  });
  app.delete('/setups/:setupid/markers/:marker',andRestrictToSelf,function(req, res) {
    req.setup.markers.id(req.params.marker).remove();
    req.setup.save(function (err) {
      if (!err) console.log('removal successful');
      else console.log('remove failed');
    });
  });

  //UNIMPLEMENTED  (AND UNUSED)
  app.put('/setups/:setupid/markers',function(req, res) {
    console.log('putting to markers');
  });
};


function loadUser(req, res, next) {
  User = require("../models/user");
 User.findById(req.userid, function (err, user) {
  if (!err) {
    req.user = user;
    next();
  } else {
    next(new Error('Failed to load user ' + req.userid));
  }
 });
}
function andRestrictToSelf(req, res, next) {
  if (req.user) {
   req.user.id == req.setup.user_id
    ? next()
    : next(new Error('Unauthorized'));
  } else {
    next(new Error('Not logged in'));
  }
}
