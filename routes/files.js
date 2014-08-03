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

writeFileAndAttributes = function (fsPath, name, attributes, done) {
  var storageDirectory = './storage'
  createDirectory(storageDirectory);

  console.log('Moving file ' + fsPath + ' to ' + name);
  fs.rename(fsPath, path.join(storageDirectory, name), function (err) {
    if (!err) {
      console.log('File moved, writing attributes...');
      var attributeContent = JSON.stringify(attributes);
      fs.writeFile(path.join(storageDirectory, name + '.attributes'), attributeContent);
    } else {
      console.error('Failed to move file: ' + err.message);
    }
    if (done) {
      done(err);
    }
  });
}

firstOrNull = function (item) {
  if (item instanceof Array) {
    return item.length > 0 ? item[0] : null;
  } else {
    return item;
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

    var attributes = {};
    attributes['plaintextDigest'] = firstOrNull(fields.plaintext_digest);
    attributes['plaintextDigestAlgorithm'] = firstOrNull(fields.plaintext_digest_algorithm);
    encryptedContent = firstOrNull(files.encrypted_file);

    writeFileAndAttributes(
      encryptedContent.path,
      encryptedContent.originalFilename,
      attributes,
      function (err) {
        if (err) {
          res.writeHead(500, {'content-type': 'text/plain'})
          res.end(err.message);
        } else {
          res.writeHead(200, {'content-type': 'text/plain'});
          res.write('received fields\n\n' + util.inspect(fields));
          res.write('\n\n');
          res.end('received files\n\n' + util.inspect(files));
        }
      }
    );
  });
});

module.exports = router;
