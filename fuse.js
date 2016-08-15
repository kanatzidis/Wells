var fuse = require('fuse-bindings');
var _path = require('path');
var BufferList = require('bl');
var fs = require('fs');
var stat = require('./stat');

var root = '/media/kanatzidis/Backup/.HFS+ Private Directory Data\r';
var backupRoot = '/media/kanatzidis/Backup/Backups.backupdb';

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
        return cb(0, stat(s));
      }

    if(path === '/') {
      return cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 4096,
        mode: 16877,
        uid: process.getuid(),
        gid: process.getgid()
      });
    } else {
      if(ids[path]) {
        cb(0, {
          mtime: contents[path]?new Date():undefined,
          atime: contents[path]?new Date():undefined,
          ctime: new Date(),
          size: contents[path]?contents[path].length:0,
          mode: 33188,
          uid: process.getuid(),
          gid: process.getgid()
        });
      } else {
        return cb(fuse.ENOENT);
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

fuse.mount('./mnt', syscalls, function(err) { if(err) throw err; });

process.on('SIGINT', function() {
  fuse.unmount('./mnt', function() {
    process.exit();
  });
});
