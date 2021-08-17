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
import { async } from '@angular/core/testing';
// const assetsDirectory = path.join(__dirname, 'assets/favicon.png')
let win: BrowserWindow = null;
let tray: any;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');
ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "tray") win.hide();
  if (arg === "quit"){
    app.quit();
    app.exit();
    process.exit();
  }
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
    // win.webContents.openDevTools()
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
    // win.removeAllListeners("close");
    // win = null;
  });

  win.setVisibleOnAllWorkspaces(true);
  // win.setAlwaysOnTop(true);

  return win;
}


function createTray(app) {
  tray = new Tray(path.join(__dirname, 'dist/assets/logo.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show-App',
      click: function () {
        win.show();
      }
    },
    {
      label: 'Hide',
      click: function () {
        win.hide();
      }
    },
    {
      label: 'Quit',
      click: async() => {
        // tray.destroy();
        // tray.destroy();

        app.quit();
        
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setContextMenu(contextMenu)
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
  
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
  }
  else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    })
    app.on('ready', () => {
      // ipcMain.on('quit',()=>{
      //   dialog.showMessageBox(win,{message:'quit'})
      //   app.quit();
      //   app.exit();
      //   process.exit();
      // })
      createWindow();
      createTray(app);
    })
  }

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
      createWindow();
      createTray(app);
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
