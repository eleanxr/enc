import os
import hashlib
import sys
import subprocess

import requests
from requests_toolbelt import MultipartEncoder

import json

def digest_file(filename):
    digest = hashlib.md5()
    blocksize = 1024
    with open(filename, 'rb') as f:
        data = f.read(blocksize)
        while data:
            digest.update(data)
            data = f.read(blocksize)
            
    return ('md5', digest.hexdigest())

def gpg_encrypt(filename, output_name, email):
    gpg = [
        'gpg',
        '--encrypt',
        '--output',
        output_name,
        '--recipient',
        email,
        filename
    ]
    subprocess.call(gpg)
    return output_name

def post_data(encrypted_file, digest, digest_algorithm, encrypted_attrs, url):
    data = {
        'plaintext_digest': digest,
        'plaintext_digest_algorithm': digest_algorithm,
        'encrypted_file': (encrypted_file, open(encrypted_file, 'rb')),
        'private_attributes': (encrypted_attrs, open(encrypted_attrs, 'rb'))
    }
    
    encoder = MultipartEncoder(fields = data)
    
    response = requests.post(url, data=encoder, headers = {'content-type': encoder.content_type})
    print 'Upload completed with response %s' % response.status_code
    print response.text

def main():
    if len(sys.argv) < 3:
        print "Usage: %s <filename> <email>" % sys.argv[0]
        sys.exit(1)
        
    filename = sys.argv[1]
    email = sys.argv[2]
    
    plaintext_digest_algorithm, plaintext_digest = digest_file(filename)
    print "%s: %s" % (filename, plaintext_digest)

    encrypted_file = gpg_encrypt(filename, plaintext_digest + '.gpg', email)
    
    private_attributes = '%s.attributes.private' % plaintext_digest
    with open(private_attributes, 'w') as privateattrs:
        privateattrs.write(json.dumps({'originalName': filename}))
    encrypted_attrs = gpg_encrypt(private_attributes, private_attributes + '.gpg', email) 
    post_data(encrypted_file, plaintext_digest, plaintext_digest_algorithm, encrypted_attrs, 'http://localhost:3000/files')

if __name__ == '__main__':
    main()
