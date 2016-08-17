var fuse = require('fuse-bindings');
var _path = require('path');
var BufferList = require('bl');
var fs = require('fs');
var stat = require('./stat');
var sudoFS = require('./fs');

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
        if(!s.size && s.nlink > 1) {
          sudoFS.stat(_path.join(`dir_${s.nlink}`, _path.basename(path)), function(err, s) {
            if(err) {
              console.log(err);
              return cb(fuse.EIO);
            }
            cb(0, stat(JSON.parse(s)));
          });
        } else {
          return cb(0, stat(s));
        }
      }

    });
  },
  release: function(path, fd, cb) {
    console.log('releasing', path);
    path = wrapPath(path);
    var _fs = path.indexOf('.HFS+') > -1 ? sudoFS : fs;
    _fs.close(fd, function(err) {
      if(err) return cb(err.errno);
      cb(0);
    });
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
    var _fs = path.indexOf('.HFS+') > -1 ? sudoFS : fs;
    _fs.read(fd, buf, 0, len, pos, function(err, bytesRead, buffer) {
      if(err) return cb(err.errno);
      cb(bytesRead);
    });
  },
  open: function(path, flags, cb) {
    console.log('open(%s, %s)', path, flags);
    path = wrapPath(path);
    var _fs = path.indexOf('.HFS+') > -1 ? sudoFS : fs;
    _fs.open(path, 'r', function(err, fd) {
      if(err) {
        console.log('open error:', err);
        return cb(err.errno);
      }
      cb(0, fd);
    });
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
