var fuse = require('fuse-bindings');
var _path = require('path');
var BufferList = require('bl');
var fs = require('fs');
var stat = require('./stat');

var dataRoot;
var backupRoot;

var virtualDirs = {};

function wrapPath(path) {
  return _path.join(backupRoot, path.slice(1));
}
var syscalls = {
  //options: ['volname=Test'],
  readdir: function (path, cb) {
    console.log('readdir(%s)', path);
    path = wrapPath(path);
    fs.readdir(path, function(err, files) {
      if(err) return cb(err.errno);

      cb(0, files);
    });
  },
  getattr: function (path, cb) {
    console.log('getattr(%s)', path);
    path = wrapPath(path);
    fs.stat(path, function(err, s) {
      if(err) {
        if(err.code === 'ENOENT') {
          return cb(err.errno);
        } else {
          return cb(err.errno);
        }
      } else {
        console.log(s);
        if(!s.size && s.nlink > 1) {
          fs.stat(_path.join(dataRoot, `dir_${s.nlink}`, _path.basename(path)), function(err, s) {
            if(err) return cb(fuse.EIO);
            cb(0, stat(s));
          });
        } else {
          return cb(0, stat(s));
        }
      }

    });
  },
  release: function(path, fd, cb) {
    console.log('releasing', path);
    cb(0);
  },
  statfs: function (path, cb) {
    console.log('statfs');
    cb(0, {
      bsize: 1000000,
      frsize: 1000000,
      blocks: 1000000,
      bfree: 1000000,
      bavail: 1000000,
      files: 1000000,
      ffree: 1000000,
      favail: 1000000,
      fsid: 1000000,
      flag: 1000000,
      namemax: 1000000
    })
  },
  read: function (path, fd, buf, len, pos, cb) {
    console.log('read(%s, %d, %d, %d)', path, fd, len, pos);
    cb(0);
  }
};

function mount(drivePath, cb) {
  dataRoot = _path.join(drivePath, '.HFS+ Private Directory Data\r');
  backupRoot = _path.join(drivePath, 'Backups.backupdb');

  fuse.mount('./mnt', syscalls, cb);
}

function unmount(cb) {
  fuse.unmount('./mnt', cb);
}

module.exports = {
  mount,
  unmount
};
