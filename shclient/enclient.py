import os
import hashlib
import sys
import subprocess

def digest_file(filename):
    digest = hashlib.md5()
    blocksize = 1024
    with open(filename, 'rb') as f:
        data = f.read(blocksize)
        while data:
            digest.update(data)
            data = f.read(blocksize)
            
    return ('md5', digest.hexdigest())

def gpg_encrypt(filename, plaintext_digest, email):
    gpg = [
        'gpg',
        '--encrypt',
        '--output',
        '%s.gpg' % plaintext_digest,
        '--recipient',
        email,
        filename
    ]
    subprocess.call(gpg)

def main():
    if len(sys.argv) < 3:
        print "Usage: %s <filename> <email>" % sys.argv[0]
        sys.exit(1)
        
    filename = sys.argv[1]
    email = sys.argv[2]
    
    plaintext_digest_algorithm, plaintext_digest = digest_file(filename)
    print "%s: %s" % (filename, plaintext_digest)

    gpg_encrypt(filename, plaintext_digest, email)    

if __name__ == '__main__':
    main()
