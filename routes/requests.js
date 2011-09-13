var Setup = require('../models/setup');
module.exports = function(app) {
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
};
