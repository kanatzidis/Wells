var fuse = require('fuse-bindings');
var _path = require('path');
var BufferList = require('bl');
var fs = require('fs');
var uuid = require('node-uuid');

var ipc;
var backupRoot;
var mountpoint;

function wrapPath(path) {
  return _path.join(backupRoot, path.slice(1));
}

function sendIPC(cmd, path, cb, fd, buf, len, pos) {
  var id = uuid();

  var info = {
    id,
    cmd,
    path
  };

  if(cmd === 'read') {
    info.fd = fd;
    info.len = len;
    info.pos = pos;
  } else if(cmd === 'close') {
    info.fd = fd;
  }

  ipc.server.on(id, function(data, socket) {
    ipc.server.off(id, '*');
    if(data.err) {
      return cb(data.errno);
    }
    switch(cmd) {
      case 'stat':
      case 'readdir':
        cb(0, data);
        break;
      case 'close':
        cb(0);
        break;
      case 'open':
        cb(0, data.fd);
        break;
      case 'read':
        (new Buffer(data.data)).copy(buf);
        cb(data.bytesRead);
        break;
    }
  });
  ipc.server.broadcast('cmd', info);
}

var syscalls = {
  //options: ['volname=Test'],
  readdir: function (path, cb) {
    console.log('readdir(%s)', path);
    path = wrapPath(path);
    return sendIPC('readdir', path, cb);
  },
  getattr: function (path, cb) {
    console.log('getattr(%s)', path);
    path = wrapPath(path);
    return sendIPC('stat', path, cb);
  },
  release: function(path, fd, cb) {
    console.log('releasing', path);
    path = wrapPath(path);
    return sendIPC('close', path, cb, fd);
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
    return sendIPC('read', path, cb, fd, buf, len, pos);
  },
  open: function(path, flags, cb) {
    console.log('open(%s, %s)', path, flags);
    path = wrapPath(path);
    return sendIPC('open', path, cb);
  }
};

function mount(drivePath, ipcInstance, mntpoint, cb) {
  ipc = ipcInstance;
  mountpoint = mntpoint;

  backupRoot = _path.join(drivePath, 'Backups.backupdb');

  fuse.mount(mountpoint, syscalls, function(err) {
    if(err) return cb(err);
    console.log('mounted');

    cb();

  });
}

function unmount(cb) {
  fuse.unmount(mountpoint, cb);
}

module.exports = {
  mount,
  unmount
};
