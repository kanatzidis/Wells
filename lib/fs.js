var sudo = require('sudo-prompt');
var path = require('path');

module.exports = {
  stat: runCmd('stat'),
  open: runCmd('open'),
  close: runCmd('close'),
  read: runCmd('read')
};

function runCmd(cmd) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args[args.length-1];
    console.log('calling sudo:', cmd, args, '\n');
    if(/node_modules/.test(process.argv[0])) {
      process.argv[1] = path.resolve(process.argv[1]);
    }
    var run = `env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY ${process.argv.join(' ')} ${cmd} ${args.slice(0, args.length - 1).join(' ')}`;
      console.log(run);
    sudo.exec(run, { name: 'Wells' }, function(err, stdout, stderr) {
      if(err || stderr) return cb(err || stderr);
      console.log('received sudo:', stdout);
      cb(stdout);
    });
  };
}
