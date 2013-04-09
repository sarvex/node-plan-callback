var http = require('http')
  , https = require('https')
  , parseUrl = require('url').parse

module.exports = {
  start: function(done) {
    var self = this;
    
    // consume the callback url
    self.exports.url = self.context.callbackUrl;
    delete self.context.callbackUrl;

    if (! this.exports.url) {
      done(new Error("context missing callbackUrl"));
      return;
    }

    self.emit('update');

    var payload;
    try {
      payload = JSON.stringify(self.context.callbackData);
    } catch (err) {
      done(err);
      return;
    }

    var opts = parseUrl(self.exports.url);
    opts.method = 'POST';
    opts.agent = false;
    opts.headers = {
      'content-length': payload.length,
      'content-type': 'application/json',
    };
    var httpModule = opts.protocol === 'https:' ? https : http;
    var req = httpModule.request(opts, function(resp) {
      resp.on('error', function(err) {
        done(new Error("POST " + self.exports.url + ": " + err.stack));
      });
      resp.on('end', function() {
        if (resp.statusCode === 200) {
          done();
        } else {
          done(new Error(self.exports.url + " returned http code " + resp.statusCode));
        }
      });
      resp.resume();
    });
    req.on('error', function(err) {
      done(new Error("unable to POST " + self.exports.url + ": " + err.stack));
    });
    req.write(payload);
    req.end();
  }
};
