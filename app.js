var express = require('express');

var conf = require('./conf');

var everyauth = require('everyauth')
  , Promise = everyauth.Promise;

everyauth.debug = true;

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var MarkerSchema = new Schema({
    description     : String
  , x      : String
  , y      : String
});

var RequestSchema = new Schema({
  email : String,
  coupon : String
});

var SetupSchema = new Schema({
  title: String,
  url: String,
  shorturl: String,
  description: String,
  user_id : String,
  markers  : [MarkerSchema]
});

var UserSchema = new Schema({
//  setups : [SetupSchema]
}) , User;

var mongooseAuth = require('mongoose-auth');

UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , facebook: {
      everyauth: {
          myHostname: 'http://local.host:3000'
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/'
      }
    }
  , password: {
        loginWith: 'email'
      , extraParams: {
          name: {
                first: String
          }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.jade' // register.jade
          , loginSuccessRedirect: '/manage'
          , registerSuccessRedirect: '/manage'
        }
    }
});
// Adds login: String

mongoose.model('User', UserSchema);
mongoose.model('Setup', SetupSchema);
mongoose.model('Marker', MarkerSchema);
mongoose.model('Request', RequestSchema);

var fs = require('fs');
var environment = process.env.NODE_ENV || 'development'
var mongo_uri = JSON.parse( fs.readFileSync(process.cwd()+'/config.json', encoding='utf8') )[environment].mongo_uri;
mongoose.connect(mongo_uri);

User = mongoose.model('User');
Setup = mongoose.model('Setup');
Marker = mongoose.model('Marker');
Request = mongoose.model('Request');

//var Resource = require('express-resource');

var app = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: 'notsurewhattoputhere'})
  , mongooseAuth.middleware()
);

app.configure( function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
//  app.register('.html', require('ejs'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.logger(':method :url :status'));
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

require('./settings').bootErrorConfig(app);
HTTPStatus = require('./lib/httpstatus');

//////////////////////////////////////////////////
// USER API
//////////////////////////////////////////////////

// Note: creating a user id done via mongoose-auth (ie. mostly
// blackmagic still)

app.param('userid', function(req, res, next, id){
  User.findOne({ _id : req.params.userid }, function(err,user) {
    if (err) return next(err);
    if (!user) return res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
    // note: not named req.user to avoid conflict with mongoose-auth
    req.requestedUser = user;  
    next();
  });
})

// Get a user's information
app.get('/api/users/:userid',function(req, res) {
  res.send(req.requestedUser);
});

// Get the setups for a particular user
app.get('/api/users/:userid/setups',function(req, res) {
  Setup.find({user_id:req.params.id}, function (err, setups) {
    res.send(setups);
  });
});

// Update a user for the logged in user
app.put('/api/users/:userid',andRestrictToSelf, function(req, res){
  user = req.requestedUser;
  user.title = req.body.user.title;
  user.body = req.body.user.body;
  user.save(function(err) {
    if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
    else res.send(HTTPStatus.OK)
  });
});

// Delete the currently logged in user
app.delete('/api/users/:userid',andRestrictToSelf,function(req, res) {
  res.send(HTTPStatus.NOT_IMPLEMENTED);
   // Setup.remove({_id:req.params.id}, function (err) {
   //   if (!err) {
   //     res.send(HTTPStatus.OK);
   //   } else {
   //     res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
   //   }
   // });
});

//////////////////////////////////////////////////
// SETUP API
//////////////////////////////////////////////////

app.param('setupid', function(req, res, next, id){
  Setup.findOne({ _id : req.params.setupid }, function(err,setup) {
    if (err) return next(err);
    if (!setup) return res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
    req.setup = setup;
    next();
  });
})

// Array of setups 
app.get('/api/setups',function(req, res) {
  Setup.find({},function(err,docs) {
    res.send(docs);
  });
});

// Get a single setup 
app.get('/api/setups/:setupid',function(req, res) {
  res.send(req.setup);
});

// Create a setup for the logged in user
app.post('/api/setups',andRestrictToSelf,function(req, res) {
    var s = new Setup({
      title:req.body.title,
      url: req.body.url,
      description: req.body.description,
      user_id: req.user._id
    });
    s.save(function (err) {
      if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
    });
    var Bitly = require(__dirname + '/lib/Bitly.js').Bitly;
    var bitly = new Bitly('o_6jbulg1k1i', 'R_3767b0d251e41099f97bf79bdd3ba0d7');
    bitly.shorten('http://checkoutmysetup.org/setups/'+s._id+'/', function(result) {
      s.shorturl = result.data.url;
      console.log(s.shorturl);
      s.save(function (err) {
        if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
      });
    });
    res.send(HTTPStatus.CREATED);
});

// Edit a setup
app.put('/api/setups/:setupid',andRestrictToSelf,function(req, res) {
  req.setup.title = req.body.title;
  req.setup.url = req.body.url;
  req.setup.description = req.body.description;
  req.setup.save(function (err) {
    if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
  });
  res.send(HTTPStatus.OK);
});

// Delete a setup
app.delete('/api/setups/:setupid',andRestrictToSelf,function(req, res) {
   Setup.remove({_id:req.params.id}, function (err) {
     if (!err) {
       res.send(HTTPStatus.OK);
     } else {
       res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
     }
   });
});


//////////////////////////////////////////////////
// MARKERS API
//////////////////////////////////////////////////

// Get all the markers for a given setup
app.get('/api/setups/:setupid/markers',function(req, res) {
  res.send(req.setup.markers);
});

// Create a marker on a given setup for the logged in user
app.post('/api/setups/:setupid/markers',andRestrictToSelf,function(req, res) {
  req.setup.markers.push({text:req.body.text,x:req.body.x,y:req.body.y});
  req.setup.save(function (err) {
    if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
  });
  res.send(HTTPStatus.OK);
});

// Delete a marker
app.delete('/api/setups/:setupid/markers/:markerid',andRestrictToSelf,function(req, res) {
  req.setup.markers.id(req.params.marker).remove();
  req.setup.save(function (err) {
    if (err) res.send(HTTPStatus.INTERNAL_SERVER_ERROR);
    else res.send(HTTPStatus.OK);
  });
});

//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////

function randOrd(){
  return (Math.round(Math.random())-0.5); 
}
function andRestrictToSelf(req, res, next) {
  if (req.user) {
   req.user.id == req.setup.user_id
    ? next()
    : res.send(HTTPStatus.UNAUTHORIZED);
  } else {
    res.send(HTTPStatus.UNAUTHORIZED);
  }
}
function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    
    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }
    
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}



// ROUTES
app.get('/', function (req, res) {
  if (!req.user) {
    res.render('index',{title:'checkoutmysetup.com',layout:false});
  } else {
    res.redirect('mine');
  }  
});
app.post('/request',function(req,res) {
  Request.find({email:req.body.email},function(err,rs) {
    if (rs.length>0) {
      res.send('That email already has a request pending.\n');
    } else {
      var r = new Request({email:req.body.email,coupon:randomString(10)});
      r.save(function(err) {
        if (err) {
          res.send('An error occurred.  Please try again later.\n');
        } else {  
          res.send('Your request has been received.  We will email you when we have spots available.\n');
        };
      });
    }
  });
});
app.get('/register/:email/coupon/:id', function (req, res) {
  Request.find({email:req.params.email},function(err,request) {
    if (request[0].coupon == req.params.id) {
      res.redirect('/register');
    } else {
      res.send('email/coupon code not correct');
    }
  });
});
app.get('/manage', function (req, res) {
  res.render('manage', {title:'login'});
});
app.get('/explore',function(req, res) {
  var query = Setup.find({});
//  query.limit(5);
//  query.skip(5);
  query.exec(function(err,setups) {
    setups = setups.map(function(setup) {
//      setup.directurl = 'setups/' + setup._id + '/';
      return(setup)
    });
    res.render('explore',{setups:setups.sort(randOrd),title:'explore'});
  });
});
app.get('/mine',function(req, res) {
  if (!req.user) {
    res.send('Not logged in');
  } else {
  Setup.find({user_id:req.user.id},function(err,setups) {
    setups = setups.map(function(setup) {
      setup.directurl = '/setups/' + setup._id + '/';
      return(setup)
    });
    res.render('mine',{setups:setups,title:'explore'});
  });

  }
});
app.get('/login', function (req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/about', function (req, res) {
    res.render('about',{title:'about'});
});
mongooseAuth.helpExpress(app);

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
