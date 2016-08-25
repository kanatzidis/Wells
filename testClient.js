'use strict';

const ipc=require('node-ipc');
var fs = require('fs');
var p = require('path');

/***************************************\
 *
 * You should start both hello and world
 * then you will see them communicating.
 *
 * *************************************/

ipc.config.id = 'hello';

var virtualDirs = {};

var base = '/media/kanatzidis/Backup/.HFS+ Private Directory Data\r';

ipc.connectTo(
    'world',
    function(){

        ipc.of.world.on(
            'cmd',
            function(data){
                ipc.log('got a message from world : ', data);
                var path = data.path;
                  Object.keys(virtualDirs).forEach(function(dir) {
                    if(path.includes(dir)) path = path.replace(dir, p.join(base, virtualDirs[dir]));
                  });
              switch(data.cmd) {
                case 'stat':
                  fs.stat(path, function(err, stat) {
                    if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                    if(!stat.size && stat.nlink > 1) {
                      virtualDirs[path] = `dir_${stat.nlink}`;
                      path = p.join(base, virtualDirs[path]);
                      return fs.stat(path, function(err, stat) {
                        if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                        ipc.of.world.emit(data.id, stat);
                      });
                    }
                    ipc.of.world.emit(data.id, stat);
                  });
                  break;
                case 'readdir':
                  fs.readdir(path, function(err, dirs) {
                    if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                    ipc.of.world.emit(data.id, dirs);
                  });
                  break;
                case 'close':
                  fs.close(data.fd, function(err) {
                    if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                    ipc.of.world.emit(data.id, {});
                  });
                  break;
                case 'open':
                  fs.open(path, 'r', function(err, fd) {
                    if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                    ipc.of.world.emit(data.id, { fd });
                  });
                  break;
                case 'read':
                  var buf = new Buffer(data.len);
                  fs.read(data.fd, buf, 0, data.len, data.pos, function(err, bytesRead, data) {
                    if(err) return ipc.of.world.emit(data.id, { err: true, errno: err.errno });
                    ipc.of.world.emit(data.id, { data, bytesRead });
                  });
                  break;
              }
            }
        );
    }
);
