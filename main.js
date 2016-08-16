var menubar = require('menubar');
var { Menu, dialog } = require('electron');
var fs = require('fs');
var path = require('path');
var fuse = require('./lib/fuse');

var mb = menubar();

var trayMenu = Menu.buildFromTemplate([
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
        trayMenu = Menu.buildFromTemplate([
          { label: `Unmount ${path.basename(drive)}`, type: 'normal', click: unmountDrive }
        ]);
        mb.tray.setContextMenu(trayMenu);
        fuse.mount(drive, function(err) {
          if(err) throw err;
          mounted = true;
        });
     }
    });
  }
}

function unmountDrive() {
  trayMenu = Menu.buildFromTemplate([
    { label: 'Select A Drive', type: 'normal', click: selectDrive }
  ]);
  mb.tray.setContextMenu(trayMenu);
  fuse.unmount(function(err) {
    if(err) throw err;
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
  mb.tray.setContextMenu(trayMenu);
});
