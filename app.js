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

var SetupSchema = new Schema({
  title: String,
  url: String,
  description: String,
  user_id : String,
  markers  : [MarkerSchema]
});

var UserSchema = new Schema({
  setups : [SetupSchema]
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
          , registerView: 'register.jade'
          , loginSuccessRedirect: '/manage'
          , registerSuccessRedirect: '/manage'
        }
    }
});
// Adds login: String

mongoose.model('User', UserSchema);
mongoose.model('Setup', SetupSchema);
mongoose.model('Marker', MarkerSchema);

//mongoose.connect('mongodb://localhost/mysetup-dev');
mongoose.connect('mongodb://chris:dingleberry@staff.mongohq.com:10076/app941158');
//mongoose.connect('mongodb://chris:dingleberry@staff.mongohq.com:10085/setups');

User = mongoose.model('User');
Setup = mongoose.model('Setup');
Marker = mongoose.model('Marker');

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
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/users/:id/setups',function(req, res) {
  Setup.find({user_id:req.params.id}, function (err, setups) {
    res.send(setups);
  });
});

// SETUP API
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
app.delete('/setups/:id',loadSetup,andRestrictToSelf,function(req, res) {
   Setup.remove({_id:req.params.id}, function (err) {
     if (!err) {
       console.log('successfully removed setup'+req.params.id);
     } else {
       console.log('failed to remove setup'+req.params.id);
     }
   });
});
app.get('/setups/:id',loadSetup,loadUser,function(req, res) {
  req.setup.directurl = 'setups/' + req.setup._id + '/';
  req.user.directurl = 'users/' + req.user._id + '/';
  res.render('view',{setup:req.setup,user:req.user,title:'view setup'});
});
app.get('/setups/:id/edit',loadSetup,loadUser,andRestrictToSelf,function(req, res) {
//  console.log(req.user);
  req.setup.directurl = 'setups/' + req.setup._id + '/';
  req.user.directurl = 'users/' + req.user._id + '/';
  res.render('edit',{setup:req.setup,user:req.user,title:'edit setup'});
});
app.put('/setups/:id',loadSetup,andRestrictToSelf,function(req, res) {
  req.setup.title = req.body.title;
  req.setup.url = req.body.url;
  req.setup.description = req.body.description;
  req.setup.save(function (err) {
    if (!err) console.log('Setup updated to:'+req.setup.title);
  });
//  res.redirect('/manage');
});


// UTILITY FUNCTIONS
function randOrd(){
  return (Math.round(Math.random())-0.5); 
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
function loadSetup(req, res, next) {
 Setup.findById(req.params.id, function (err, setup) {
  if (!err) {
    req.setup = setup;
    req.userid = setup.user_id;
    next();
  } else {
    next(new Error('Failed to load setup ' + req.params.id));
  }
  });
}
function loadUser(req, res, next) {
 User.findById(req.userid, function (err, user) {
  if (!err) {
    req.user = user;
    next();
  } else {
    next(new Error('Failed to load user ' + req.userid));
  }
 });
}

// MARKERS API

app.get('/setups/:id/markers',loadSetup,function(req, res) {
  res.send(req.setup.markers);
});
app.post('/setups/:id/markers',loadSetup,andRestrictToSelf,function(req, res) {
  req.setup.markers.push({text:req.body.text,x:req.body.x,y:req.body.y});
  req.setup.save();
  res.send(req.setup.markers);
});
app.delete('/setups/:id/markers/:marker',loadSetup,andRestrictToSelf,function(req, res) {
  req.setup.markers.id(req.params.marker).remove();
  req.setup.save(function (err) {
    if (!err) console.log('removal successful');
    else console.log('remove failed');
  });
});

//UNIMPLEMENTED  (AND UNUSED)
app.put('/setups/:setup/markers',function(req, res) {
 console.log('putting to markers');
});

// ROUTES
app.get('/', function (req, res) {
  if (!req.user) {
    res.redirect('login');
  } else {
    res.redirect('mine');
  }  
});
app.get('/register', function (req, res) {
  res.render('register', {title:'login',});
});
app.get('/manage', function (req, res) {
  res.render('manage', {title:'login'});
});
app.get('/explore',function(req, res) {
  var query = Setup.find({});
  query.limit(5);
  query.skip(5);
  query.exec(function(err,setups) {
    setups = setups.map(function(setup) {
      setup.directurl = 'setups/' + setup._id + '/';
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
