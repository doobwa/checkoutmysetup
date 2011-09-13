//require('./db_connect')
var conf = require('../conf');
var rest = require('restler');
var mongooseAuth = require('mongoose-auth');
var mongoose = require('mongoose');
var everyauth = require('everyauth');
everyauth.debug = false;
var Promise = everyauth.Promise;

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

var exports = module.exports = mongoose.model('User', UserSchema);
