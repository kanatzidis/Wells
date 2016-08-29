# Wells

![Wells Screenshot](/docs/anim.gif?raw=true "Wells Screenshot")

## What is this?

Wells (as in H.G.) is a FUSE for Apple's Time Machine, made with Electron.js. I made it because [tmfs](http://manpages.ubuntu.com/manpages/saucy/man1/tmfs.1.html) didn't handle deeply nested folders correctly, and to show what kind of cool stuff can be done with Electron.

## Do I need this?

If you don't use linux, no. Mac reads it natively (obviously) and Windows can't do HFS.

## How to use

I'm working on a nicely packaged version of this but for now you can run the electron app manually:

```
# If not already installed
# (this is for ubuntu/debian, replace with your own distro's package/command as appropriate)
sudo apt-get install libfuse-dev

# From inside the app repo
npm install

# Rebuild native modules
./node_modules/.bin/electron-rebuild -`./node_modules/.bin/electron -v`

npm start
```

## Bad code

This thing is still prototype status so GTFO with your criticisms ayye. Functionally it seems to all be there though. Let me know of any bugs.

## License

MIT
