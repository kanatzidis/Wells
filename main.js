var fs = require('fs');
var os = require('os');
var path = require('path');
var min = require('minimist');
var ipc = require('node-ipc');
var mkdirp = require('mkdirp');
var { spawn } = require('child_process');

var args = min(process.argv, { '--': true });

if(process.platform !== 'linux') throw new Error('You only need to use this on linux!');

if(args['--'].length) {
  var a = args['--'];
  
  console.log(a);
  require('./lib/fs')(a[0]);
} else {

  ipc.config.id = 'world';
  //ipc.config.silent = process.env.NODE_ENV !== 'development';

  ipc.serve(function() {

    var exec;
    var mountpoint = path.join(os.homedir(), 'Wells');

      init();
      function init() {
        var menubar = require('menubar');
        var { Menu, dialog } = require('electron');
        var fuse = require('./lib/fuse');
          
        var mb = menubar();
        //console.log(process.argv);
        var unmountedTrayMenu = Menu.buildFromTemplate([
          { label: 'Select A Drive', type: 'normal', click: selectDrive },
          { label: 'Quit', type: 'normal', click: quitAppMenu }
        ]);
        
        var mounted = false;
        
        function selectDrive() {
          var drive = dialog.showOpenDialog({ properties: ['openDirectory'] });
          if(drive) {
            drive = drive[0];
            fs.stat(path.join(drive, '.HFS+ Private Directory Data\r'), function(err, stat) {
              if(err) {
                if(err.code === 'ENOENT') {
                  //console.log(err);
                  dialog.showErrorBox('Invalid drive selected', 'This is not a Time Machine backup drive. Please select a valid drive.');
                } else {
                  dialog.showErrorBox('There was a problem', err.message);
                }
              } else {
                if(checkMountpoint()) return;
                var trayMenu = Menu.buildFromTemplate([
                  { label: `Unmount ${path.basename(drive)}`, type: 'normal', click: closeClient },
                  { label: 'Quit', type: 'normal', click: quitAppMenu }
                ]);
                mb.tray.setContextMenu(trayMenu);

                if(/node_modules/.test(process.argv[0])) {
                  process.argv[1] = path.resolve(process.argv[1]);
                }
                var cmd = `env DISPLAY=${process.env.DISPLAY} XAUTHORITY=${process.env.XAUTHORITY} ${process.argv.join(' ')} -- ${drive}`;
                //console.log(cmd.split(' '));
                exec = spawn('pkexec', cmd.split(' '), { env: process.env });
                exec.on('close', function(code) {
                  //console.log('closed', code);
                  exec = null;
                  unmountDrive();
                });

                exec.on('error', function(err) {
                  console.error(err);
                  mb.app.quit(1);
                });

                exec.stderr.on('data', function(data) {
                  console.log('stderr:', data);
                });

                exec.stdout.on('data', function(data) {
                  data = data.toString();
                  //console.log(data);
                  if(data === 'init mount\n') {
                    fuse.mount(drive, ipc, mountpoint, function(err) {
                      if(err) throw err;
                      mounted = true;
                    });
                  }
                });
              }
            });
          }
        }
        
        function unmountDrive() {
          fuse.unmount(function(err) {
            if(err) throw err;
            mb.tray.setContextMenu(unmountedTrayMenu);
            mounted = false;
          });
        }

        function closeClient() {
          ipc.server.broadcast('kill');
        }

        function quitAppMenu() {
          quitApp(() => mb.app.quit());
        }

        mb.app.on('before-quit', function() {
          quitApp();
        });

        function quitApp(cb) {
          if(!mounted) return cb && cb();
          ipc.server.broadcast('kill');
          //exec && exec.kill();
          fuse.unmount(function(err) {
            if(err) throw err;
            cb && cb();
          });
        }
        
        function checkMountpoint() {
          var mnt;
          try {
            mnt = fs.statSync(mountpoint);
          } catch(e) {}

          if(mnt && fs.readdirSync(mountpoint).length) {
            // TODO: pop dialog box
            dialog.showErrorBox('Mount Error:', mountpoint + ' already exists and is not empty.');
            mb.app.quit();
            return true;
          }
        }

        mb.on('ready', function() {
          //console.log('app is ready');

          checkMountpoint();
          mkdirp(mountpoint, function(err) {
            if(err) throw err;

            //console.log('mountpoint created');
            mb.tray.setContextMenu(unmountedTrayMenu);
          });
        });
      }

  });

  ipc.server.start();

}
