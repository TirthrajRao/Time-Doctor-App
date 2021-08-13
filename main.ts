import {
  app,
  dialog,
  BrowserWindow,
  screen,
  Menu,
  remote,
  Tray,
  nativeImage,
  ipcMain
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as electronLocalshortcut from 'electron-localshortcut'
// const assetsDirectory = path.join(__dirname, 'assets/favicon.png')
let win: BrowserWindow = null;
let tray = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');
ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "tray") win.hide();
  if (arg === "quit") app.quit();
});
function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;
  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    icon: path.join(__dirname, 'dist/assets/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      enableRemoteModule: true
    },
  });

  // Disable refresh
  win.on('focus', (event) => {
    console.log("event of on fucous ");
    electronLocalshortcut.register(win, ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'], () => { })
  })

  win.on('blur', (event) => {
    console.log("event of on blue ");
    electronLocalshortcut.unregisterAll(win)
  })
  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
    // debug
    win.webContents.openDevTools()
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  win.on('close', (e) => {
    // Do your control here

    console.log("close")
    e.preventDefault();
  });
  // Emitted when the window is closed.
  win.on('closed', () => {
    console.log("closed")
    win.removeAllListeners("close");
    win = null;
  });

  win.setVisibleOnAllWorkspaces(true);
  // win.setAlwaysOnTop(true);

  return win;
}


function createTray() {
  var tray = new Tray(path.join(__dirname, 'dist/assets/logo.png'))
  const handleClick = (menuItem, browserWindow, event) => {
    console.log({ menuItem, browserWindow, event });
    console.log({ remote });
    
    switch (menuItem) {
      case 'Show-App':
        console.log("show-app")
        win.show();
        break;
        case 'Hide':
          win.hide();
          break;
          default:
            // alert(' default ' + JSON.stringify(remote))
            // alert(' default ' + JSON.stringify(remote.app))
            dialog.showMessageBox(null, {
              type: 'question',
              buttons: ['Cancel', 'Yes, please', 'No, thanks'],
              defaultId: 2,
              title: 'console',
              message: 'Console.log',
              detail: 'remote:' + remote + ' remote.app:' + remote.app + 'remote.app.exit(0):' + remote.app.exit(0),
            });
        remote.app.exit(0);
        console.log("default")
        // remote.app.exit(0);
        break;
      }
      
    }
    const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show-App',
          type: 'radio',
          click: function(){
            win.show();
          }
          // click() {
          //   // handleClick('Show-App', '', '')
          //   win.show();
          // }


          // click: function(){
            //   console.log("show app");
            //   // ipcMain.emit("msg","show app")
            // }
        },
        {
          label: 'Hide',
          type: 'radio',
          click: function(){
            win.hide();
          }
            // click() {
              //   // handleClick('Hide', '', '')
              //   win.hide();
              // }
              
            // click: function () { remote.app.exit(0); }
        }
      ])
      tray.setToolTip('Rao Doctor')
      tray.setContextMenu(contextMenu)
      // dialog.showMessageBox(win, {message: tray.getTitle()})
    }
    
try {

  // Custom menu.
  const isMac = process.platform === 'darwin'

  const template: any = [
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => { createTray(); createWindow(); });

  app.disableHardwareAcceleration();

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createTray();
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
