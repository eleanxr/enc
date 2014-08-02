var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var path = require('path');

createDirectory = function (name) {
  if (!fs.existsSync(name)) {
    fs.mkdirSync(name);
  }
}

writeFileAndAttributes = function (fsPath, name, attributes) {
  var storageDirectory = './storage'
  createDirectory(storageDirectory);

  console.log('Moving file ' + path + ' to ' + name);
  fs.rename(fsPath, path.join(storageDirectory, name), function (err) {
    if (!err) {
      console.log('File moved, writing attributes...');
      var attributeContent = JSON.stringify(attributes);
      fs.writeFile(path.join(storageDirectory, name + '.attributes'), attributeContent);
    } else {
      console.error('Failed to move file: ' + err.message);
    }
  });
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

    files.encrypted_file.forEach(function (file) {
      writeFileAndAttributes(file.path, file.originalFilename, fields);
    });

    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received fields\n\n' + util.inspect(fields));
    res.write('\n\n');
    res.end('received files\n\n' + util.inspect(files));
  });
});

module.exports = router;
