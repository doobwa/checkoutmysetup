// require('./db_connect')

// var UserSchema = new Schema({
// //  setups : [SetupSchema]
// }) , User;

// UserSchema.plugin(mongooseAuth, {
//     everymodule: {
//       everyauth: {
//           User: function () {
//             return User;
//           }
//       }
//     }
//   , facebook: {
//       everyauth: {
//           myHostname: 'http://local.host:3000'
//         , appId: conf.fb.appId
//         , appSecret: conf.fb.appSecret
//         , redirectPath: '/'
//       }
//     }
//   , password: {
//         loginWith: 'email'
//       , extraParams: {
//           name: {
//                 first: String
//           }
//         }
//       , everyauth: {
//             getLoginPath: '/login'
//           , postLoginPath: '/login'
//           , loginView: 'login.jade'
//           , getRegisterPath: '/register'
//           , postRegisterPath: '/register'
//           , registerView: 'about.jade' // should be register.jade
//           , loginSuccessRedirect: '/manage'
//           , registerSuccessRedirect: '/manage'
//         }
//     }
// });
// // Adds login: String

// mongoose.model('User', UserSchema);


// var exports = module.exports = mongoose.model('User', UserSchema);
