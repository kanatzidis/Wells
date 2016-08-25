var fs = require('fs');
var path = require('path');
var min = require('minimist');
var ipc = require('node-ipc');

var args = min(process.argv, { '--': true });


if(args['--'].length) {
  var a = args['--'];
  
  console.log(a);
} else {

  ipc.config.id = 'world';
  //ipc.config.retry = 1500;
  //ipc.config.rawBuffer = true;
  //ipc.config.encoding = 'hex';

  ipc.serve(function() {

      var menubar = require('menubar');
      var { Menu, dialog } = require('electron');
      var fuse = require('./lib/fuse');
        
      var mb = menubar();
      console.log(process.argv);
      var unmountedTrayMenu = Menu.buildFromTemplate([
        { label: 'Select A Drive', type: 'normal', click: selectDrive }
      ]);
      
      var mounted = false;
      
      function selectDrive() {
        var drive = dialog.showOpenDialog({ properties: ['openDirectory'] });
        if(drive) {
          drive = drive[0];
          fs.stat(path.join(drive, '.HFS+ Private Directory Data\r'), function(err, stat) {
            if(err) {
              if(err.code === 'ENOENT') {
                console.log(err);
                dialog.showErrorBox('Invalid drive selected', 'This is not a Time Machine backup drive. Please select a valid drive.');
              } else {
                dialog.showErrorBox('There was a problem', err.message);
              }
            } else {
              var trayMenu = Menu.buildFromTemplate([
                { label: `Unmount ${path.basename(drive)}`, type: 'normal', click: unmountDrive }
              ]);
              mb.tray.setContextMenu(trayMenu);
              fuse.mount(drive, ipc, function(err) {
                if(err) throw err;
                mounted = true;
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
      
      mb.app.on('before-quit', function() {
        if(!mounted) return;
        fuse.unmount(function(err) {
          if(err) throw err;
        });
      });
      
      mb.on('ready', function() {
        console.log('app is ready');
        mb.tray.setContextMenu(unmountedTrayMenu);
      });

  });

  ipc.server.start();

}
