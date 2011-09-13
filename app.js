var express = require('express');
var http = require('http');
var rest = require('restler');
var conf = require('./conf');
var mongooseAuth = require('mongoose-auth');
var mongoose = require('mongoose');
var everyauth = require('everyauth');
everyauth.debug = false;
var fs = require('fs');
var Promise = everyauth.Promise;
var environment = process.env.NODE_ENV || 'development'
var mongo_uri = JSON.parse( fs.readFileSync(process.cwd()+'/config.json', encoding='utf8') )[environment].mongo_uri;
mongoose.connect(mongo_uri);
Schema = mongoose.Schema
ObjectId = mongoose.SchemaTypes.ObjectId;

var UserSchema = new Schema({
//  setups : [SetupSchema]
}) , User;

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
          , registerView: 'about.jade' // should be register.jade
          , loginSuccessRedirect: '/manage'
          , registerSuccessRedirect: '/manage'
        }
    }
});
// Adds login: String

User = mongoose.model('User', UserSchema);

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


// // ROUTES
//   app.get('/users/:id/setups',function(req, res) {
//     Setup.find({user_id:req.params.id}, function (err, setups) {
//       res.send(setups);
//     });
//   });
app.get('/', function (req, res) {
  if (!req.user) {
    res.redirect('login');
  } else {
    res.redirect('mine');
  }  
});
app.get('/request',function(req,res) {
  res.send('Interested?  Request an invite and we will let you know:\n curl -X POST -d "email=YOUREMAIL" http://glowing-beach-290.herokuapp.com/request');
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
      res.render('register',{title:'login',everyauth:everyauth,userParams:{}});
    } else {
      res.send('email/coupon code not correct');
    }
  });
});
app.get('/manage', function (req, res) {
  res.render('manage', {title:'login'});
});
// app.get('/explore',function(req, res) {
//   var query = Setup.find({});
//   query.limit(5);
//   query.skip(5);
//   query.exec(function(err,setups) {
//     setups = setups.map(function(setup) {
//       setup.directurl = 'setups/' + setup._id + '/';
//       return(setup)
//     });
//     res.render('explore',{setups:setups.sort(randOrd),title:'explore'});
//   });
// });
// app.get('/mine',function(req, res) {
//   if (!req.user) {
//     res.send('Not logged in');
//   } else {
//   Setup.find({user_id:req.user.id},function(err,setups) {
//     setups = setups.map(function(setup) {
//       setup.directurl = '/setups/' + setup._id + '/';
//       return(setup)
//     });
//     res.render('mine',{setups:setups,title:'explore'});
//   });

//   }
// });
// app.get('/login', function (req, res) {
//     req.logout();
//     res.redirect('/');
// });
// app.get('/logout', function (req, res) {
//     req.logout();
//     res.redirect('/');
// });
// app.get('/about', function (req, res) {
//     res.render('about',{title:'about'});
// });
require('./routes/setups')(app)
//require('./routes/users')(app)


mongooseAuth.helpExpress(app);

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});


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
  console.log(req.params.id);
 Setup.findById(req.params.id, function (err, setup) {
  console.log(setup);
  if (err) {
    res.send('Failed to find setup' + req.params.id);
  //  req.setup = setup;
  } else {
    console.log('found setup:' + setup._id);
//    req.userid = setup.user_id;
    next();
//    next(new Error('Failed to load setup ' + req.params.id));
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
function randOrd(){
  return (Math.round(Math.random())-0.5); 
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
// // UTILITY FUNCTIONS
// function getBitly(id) {
//   var d = 'glowing-beach-290.herokuapp.com'
//   var b = 'http://api.bitly.com/v3/shorten?login=chrisdubois&apiKey=R_46c7bee365ae8711c76b255cd45551ed&longUrl=';
//   var u = 'http%3A%2F%2F' + d + '%2Fsetups%2F'+id;
// //api.bitly.com/v3/shorten?login=chrisdubois&apiKey=R_46c7bee365ae8711c76b255cd45551ed&longUrl=http%3A%2F%2Fbetaworks.com%2F&format=json
//   var a = rest.get(b + u).on('complete', function(data) {
//     console.log(data.data.url);
//     return(data.data.url);
//   });
//   return '5';
// }
