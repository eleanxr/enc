var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var path = require('path');

FileStore = function (storageDirectory) {
  if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory);
  }
  this.storageDirectory = storageDirectory;
}

FileStore.prototype.writeFileAndAttributes = function (public_attributes, content, private_attributes, done) {
  var storageDirectory = this.storageDirectory;

  fs.rename(content.path, path.join(storageDirectory, content.name), function (err) {
    if (!err) {
      public_attributes['encryptedContent'] = content.name;
      fs.rename(private_attributes.path, path.join(storageDirectory, private_attributes.name), function (err) {
        if (!err) {
          public_attributes['privateAttributes'] = private_attributes.name;
          var attributeContent = JSON.stringify(public_attributes);
          fs.writeFile(path.join(storageDirectory, content.name + '.attributes.public'), attributeContent);
        } else {
          console.error('Failed to write private attributes: ' + err.message);
        }
        if (done) {
          done(err);
        }
      });
    } else {
      console.error('Failed to move file: ' + err.message);
      if (done) {
        done(err);
      }
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
    privateAttributes = firstOrNull(files.private_attributes);

    var store = new FileStore('./storage');
    store.writeFileAndAttributes(
      attributes,
      {path: encryptedContent.path, name: encryptedContent.originalFilename},
      {path: privateAttributes.path, name: privateAttributes.originalFilename},
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
