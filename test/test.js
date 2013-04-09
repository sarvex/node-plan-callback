var definition = require('../')
  , Plan = require('plan')
  , http = require('http')
  , assert = require('assert')

describe("callback", function() {
  it("works when callback is successful", function(done) {
    var data = { foo: true };
    var hitServer = false;
    var server = http.createServer(function(req, resp) {
      assert.strictEqual(req.method, 'POST');
      req.setEncoding('utf8');
      var buffer = "";
      req.on('data', function(data) {
        buffer += data;
      });
      req.on('end', function() {
        assert.strictEqual(buffer, JSON.stringify(data));
        assert.ok(! hitServer);
        hitServer = true;
      });
      resp.statusCode = 200;
      resp.end();
    });
    server.listen(function() {
      var port = server.address().port;
      var url = "http://localhost:" + port + "/blah/foo"
      var task = Plan.createTask(definition);
      var plan = new Plan();
      plan.addTask(task);
      plan.on('error', done);
      plan.on('end', function() {
        assert.strictEqual(task.exports.url, url);
        assert.ok(hitServer);
        server.close();
        done();
      });
      plan.start({
        callbackUrl: url,
        callbackData: data
      });
    });
  });

  it("fails when callback url cannot be reached", function(done) {
    var task = Plan.createTask(definition);
    var plan = new Plan();
    var hadError = false;
    plan.addTask(task);
    plan.on('error', function(err) {
      hadError = true;
    });
    plan.on('end', function() {
      assert.ok(hadError);
      done();
    });
    plan.start();
  });

  it("fails when callback returns bad http status code", function(done) {
    var server = http.createServer(function(req, resp) {
      resp.statusCode = 500;
      resp.end();
    });
    server.listen(function() {
      var port = server.address().port;
      var url = "http://localhost:" + port + "/blah/foo"
      var task = Plan.createTask(definition);
      var plan = new Plan();
      var hadError = false;
      plan.addTask(task);
      plan.on('error', function(err) {
        hadError = true;
      });
      plan.on('end', function() {
        assert.ok(hadError);
        server.close(done);
      });
      plan.start({
        callbackUrl: url,
        callbackData: {foo: true}
      });
    });
  });
});
