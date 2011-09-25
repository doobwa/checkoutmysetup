var vows = require('vows'),
  assert = require('assert'),
  should = require('should'),
  zombie = require('zombie'),
  http = require('http');

vows.describe("UserInteraction").addBatch({
  "login page" : {
    topic: function () {
	browser = new zombie.Browser({ debug: false });
	browser.runScripts = false;
	browser.on('error',function (err){console.log(err.stack)});
	//browser.on('done',function (done){console.log(done.document.cookie)});
	browser.visit(baseUrl, this.callback);
    },
    "Should have login form": function() {
      assert.equal(1,1);
    },
    'and login as chris' : {
      topic: function (browser) {
	browser.fill("email","chris.dubois@gmail.com");
	browser.fill("password","dawg4prez");
	browser.pressButton("login",this.callback);
      },
      'Setupapp present' : function (browser) {
        assert.ok(browser.querySelector("#setupapp"));
      },
      'and add a setup' : {
        topic: function (browser) {
          browser.fill("title","new test setup");
          browser.fill("url","http://4.bp.blogspot.com/_nRCyHkiPAQY/TJumt1iXuMI/AAAAAAAAAJE/a_azc5JWVBk/s1600/the+starry+night.PNG");
          browser.fill("description","testing 1 2 3");
          browser.pressButton("addsetup",this.callback);
        },
        'new setup created' : function(browser) {
          assert.ok(browser.querySelector(".setup-text:last"))
        }
      }
    },
  },
}).export(module)
