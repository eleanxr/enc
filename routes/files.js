var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');

createDirectory = function (name) {
  if (!fs.existsSync(name)) {
    fs.mkdirSync(name);
  }
}

router.get('/', function(req, res) {
  res.send('files will be here');
});

router.post('/', function (req, res) {
  var form = new multiparty.Form({
    uploadDir: './uploads'
  });

  form.parse(req, function (err, fields, files) {
    if (err) {
      res.writeHead(400, {'content-type': 'text/plain'});
      res.end('invalid request' + err.message);
      return;
    }
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received fields\n\n' + util.inspect(fields));
    res.write('\n\n');
    res.end('received files\n\n' + util.inspect(files));
  });
});

module.exports = router;
