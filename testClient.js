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
              switch(data.cmd) {
                case 'stat':
                  Object.keys(virtualDirs).forEach(function(dir) {
                    if(path.includes(dir)) path.replace(dir, p.join(base, virtualDirs[dir]));
                  });
                  fs.stat(path, function(err, stat) {
                    if(err) throw err;
                    if(!stat.size && stat.nlink) {
                      virtualDirs[path] = `dir_${stat.nlink}`;
                      path = p.join(base, virtualDirs[path]);
                      return fs.stat(path, function(err, stat) {
                        if(err) throw err;
                        stat.path = path;
                        console.log(stat);
                        ipc.of.world.emit('response', stat);
                      });
                    }
                    ipc.of.world.emit('response', stat);
                  });
                  break;
                case 'readdir':
                  break;
                case 'close':
                  break;
                case 'open':
                  break;
                case 'read':
                  break;
              }
            }
        );
    }
);
