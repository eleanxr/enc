import os
import hashlib
import sys
import subprocess

import requests
from requests_toolbelt import MultipartEncoder

import json
import tempfile
import shutil

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
    
    print 'Upload %s, %s' % (encrypted_file, encrypted_attrs)
    
    response = requests.post(url, data=encoder, headers = {'content-type': encoder.content_type})
    print 'Upload completed with response %s' % response.status_code
    print response.text

def encrypt_and_upload(filename, working_dir, email):
    plaintext_digest_algorithm, plaintext_digest = digest_file(filename)
    print "%s: %s" % (filename, plaintext_digest)

    encrypted_file = gpg_encrypt(filename, os.path.join(working_dir, plaintext_digest + '.gpg'), email)
    
    private_attributes = os.path.join(working_dir, '%s.attributes.private' % plaintext_digest)
    with open(private_attributes, 'w') as privateattrs:
        privateattrs.write(json.dumps({'originalName': filename}))
    encrypted_attrs = gpg_encrypt(private_attributes, os.path.join(working_dir, private_attributes + '.gpg'), email) 
    post_data(encrypted_file, plaintext_digest, plaintext_digest_algorithm, encrypted_attrs, 'http://localhost:3000/files')

def main():
    if len(sys.argv) < 3:
        print "Usage: %s <filename> <email>" % sys.argv[0]
        sys.exit(1)
        
    filename = sys.argv[1]
    email = sys.argv[2]
    
    # Create a temporary working directory
    working_dir = tempfile.mkdtemp('-enc')
    try:
        encrypt_and_upload(filename, working_dir, email)
    finally:
        if os.path.exists(working_dir):
            shutil.rmtree(working_dir)
            

if __name__ == '__main__':
    main()
