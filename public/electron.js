// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  powerSaveBlocker,
  Menu,
} = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
// const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const isDev = process.argv[2] === 'development' ? true : false;
const updateURL = 'http://yingliboke.oss-cn-shenzhen.aliyuncs.com/app/';

// 省电拦截器
const id = powerSaveBlocker.start('prevent-display-sleep');
console.log(powerSaveBlocker.isStarted(id));

// 接入sentry
const Sentry = require('@sentry/electron');
Sentry.init({
  dsn: 'https://6d63ad87b3d34e05903c4d5f6f67ff3b@sentry.io/1761892',
});
// autoUpdater.logger = log;
// autoUpdater.logger.transports.file.level = 'info';
// log.info('App starting...');

const BASE_URL = 'http://localhost:55197';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
// Create the browser window.
function createWindow(externalDisplay) {
  let sentry_url;
  if (isDev) {
    sentry_url = '';
  } else {
    sentry_url = url.format({
      pathname: path.join(__dirname, 'sentry.js'),
      protocol: 'file:',
      slashes: false,
    });
  }
  let template = [
    {
      label: 'Application',
      submenu: [
        {
          label: '退出',
          accelerator: 'Command+Q',
          click: function() {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '剪切',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: '粘贴',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: '选择全部',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: function(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        {
          label: '开发调试工具',
          accelerator: (function() {
            if (process.platform == 'darwin') return 'Alt+Command+I';
            else return 'Ctrl+Shift+I';
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow) focusedWindow.toggleDevTools();
          },
        },
      ],
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
      ],
    },
    {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '帮助中心',
          click: function() {
            require('electron').shell.openExternal(
              'http://help.yingliboke.cn/'
            );
          },
        },
      ],
    },
  ];

  //注册菜单
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  mainWindow = new BrowserWindow({
    width: 446,
    height: 550,
    // minHeight: 446,
    // minWidth: 530,
    minHeight: 720,
    minWidth: 1000,
    center: true,
    autoHideMenuBar: true,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true, // 是否集成 Nodejs
      preload: sentry_url,
      // devTools: true
    },
    show: false,
  });

  // 开发环境，加载localhost:8000。生产环境加载build/index.html
  // 使用process.argv读取命令行参数;
  let startUrl;
  if (isDev) {
    startUrl = `${BASE_URL}`;
  } else {
    startUrl = url.format({
      pathname: path.join(__dirname, '/../build/index.html'),
      protocol: 'file:',
      slashes: false,
    });
  }
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // 渲染进程第一次完成绘制时候，会发出ready-to-show事件。在此事件后显示窗口将没有视觉闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // updateHandle();
  });

  // Emitted when the window is closed.
  mainWindow.on('close', (e) => {
    mainWindow = null;
    app.exit();
    // e.preventDefault();
    // const url = mainWindow.webContents.getURL();
    // mainWindow.webContents.send('confirm-close-app', url);
  });

  // Page navigate
  mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
    const before = mainWindow.webContents.getURL();
    if (!isDev && before !== url) {
      event.preventDefault();
      const hash = url.split('#')[1];
      const startUrl = require('url').format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: false,
        hash,
      });
      mainWindow.loadURL(startUrl);
    }
  });
}

app.on('ready', function() {
  createWindow();
  startupEventHandle();
});
// 修改操作系统协议，通过网页端调起应用
// app.setAsDefaultProtocolClient(protocol[, path, args])
app.setAsDefaultProtocolClient('broadClass');

// Quit when all windows are closed.
// app.on('window-all-closed', function() {
//   // On OS X it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     app.exit();
//   }
// });

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('login', () => {
  // 重新调整窗口大小并将其移动到提供的bounds
  mainWindow.setBounds({
    x: 0,
    y: 0,
    width: 1280,
    height: 720,
  });

  // 将窗口移动到屏幕中央。
  mainWindow.center();
});

// 创建新窗口
let win = {};
function createNewWindow(value) {
  if (value) {
    const { width, height, minWidth, minHeight, hash } = value;

    // 打开的新窗口，未关闭的情况下，再次点击，如何做到不重复创建窗口，而是呼出已经打开过的窗口
    if (win[hash]) {
      // 如果已经存在
      win[hash].show();
    } else {
      // 如果不存在
      win[hash] = new BrowserWindow({
        title: hash,
        width,
        height,
        minHeight,
        minWidth,
        autoHideMenuBar: true,
        fullscreenable: false,
        titleBarStyle: 'hidden',
        // parent: mainWindow,
        webPreferences: {
          nodeIntegration: true, //设置此处
        },
      });

      let startUrl;
      if (isDev) {
        startUrl = `${BASE_URL}#${hash}`;
      } else {
        startUrl = url.format({
          pathname: path.join(__dirname, '/../build/index.html'),
          protocol: 'file:',
          slashes: false,
          hash,
        });
      }
      win[hash].loadURL(startUrl);
    }

    win[hash].on('closed', () => {
      win[hash] = null;
    });

    // 渲染进程第一次完成绘制时候，会发出ready-to-show事件。在此事件后显示窗口将没有视觉闪烁
    win[hash].once('ready-to-show', () => {
      win[hash].show();
    });
  } else {
    win = new BrowserWindow({
      width: 600,
      height: 500,
      fullscreenable: false,
      titleBarStyle: 'hidden',
      // parent: mainWindow,
      webPreferences: {
        nodeIntegration: true, //设置此处
      },
    });

    let startUrl;
    if (isDev) {
      startUrl = `${BASE_URL}#${123}`;
    } else {
      startUrl = url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: false,
        hash,
      });
    }

    win.loadURL(startUrl);
    win.width = 1000;

    win.on('closed', () => {
      win = null;
    });

    // 渲染进程第一次完成绘制时候，会发出ready-to-show事件。在此事件后显示窗口将没有视觉闪烁
    win.once('ready-to-show', () => {
      win.show();
    });
  }
}

// 监听要创建的新窗口类型
ipcMain.on('newwin', (event, value) => {
  createNewWindow(value);
  if (value) {
    const { hash } = value;
    if (JSON.stringify(data) !== '{}') {
      win.show();
      win[hash].show();
    } else {
      createNewWindow(value);
    }
  }
});

// 关闭新窗口
ipcMain.on('close-newwin', (event, value) => {
  const { type } = JSON.parse(value);
  // 监听窗口向主进程发送消息，收到消息后，向父窗口的渲染进程发消息
  mainWindow.webContents.send('newmsg', value);
  win[type].close();
});

// 关闭app
ipcMain.on('close-app', (event, value) => {
  mainWindow = null;
  app.exit();
});

// 主进程监听渲染进程传来的信息
ipcMain.on('update', (e, arg) => {
  checkForUpdates(false);
});
// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
let checkForUpdates = (key) => {
  const message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };
  // 清除每次更新下载的文件，否则无法进行更新
  let updaterCacheDirName = 'broadClass-updater1';
  const updatePendingPath = path.join(
    autoUpdater.app.baseCachePath,
    updaterCacheDirName,
    'pending'
  );
  // fs.emptyDir(updatePendingPath);
  // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
  autoUpdater.autoDownload = key;
  autoUpdater.logger = log;
  // https://github.com/electron-userland/electron-builder/issues/1254
  // if (isDev) {
  //   autoUpdater.updateConfigPath = path.join(
  //     __dirname,
  //     'default-app-update.yml'
  //   );
  // } else {
  //   autoUpdater.updateConfigPath = path.join(
  //     __dirname,
  //     '../../../app-update.yml'
  //   );
  // }
  // 配置安装包远端服务器
  autoUpdater.setFeedURL(updateURL);

  // 下面是自动更新的整个生命周期所发生的事件
  // autoUpdater.on('error', function(message) {
  //   sendUpdateMessage('error', message);
  // });
  autoUpdater.on('checking-for-update', function(message) {
    mainWindow.webContents.send('message', 'checking-for-update');
    // sendUpdateMessage('checking-for-update', message);
  });
  autoUpdater.on('update-available', function(message) {
    mainWindow.webContents.send('message', 'update-available');
    // sendUpdateMessage('update-available', message);
  });
  // autoUpdater.on('update-not-available', function(message) {
  //   sendUpdateMessage('update-not-available', message);
  // });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function(progressObj) {
    mainWindow.webContents.send('message', progressObj);
    // sendUpdateMessage('downloadProgress', progressObj);
  });
  // 更新下载完成事件
  autoUpdater.on('update-downloaded', function(
    event,
    releaseNotes,
    releaseName,
    releaseDate,
    updateUrl,
    quitAndUpdate
  ) {
    // sendUpdateMessage('isUpdateNow', event);
    mainWindow.webContents.send('message', 'isUpdateNow');
  });

  //执行自动更新检查
  autoUpdater.checkForUpdates();
};
ipcMain.on('updateNow', (e, arg) => {
  autoUpdater.quitAndInstall();
  mainWindow.destroy();
});
ipcMain.on('downloadNow', () => {
  // checkForUpdates(true);
  // 下载
  log.warn('执行下载');
  autoUpdater.downloadUpdate();
});
// 通过main进程发送事件给renderer进程，提示更新信息
// 主进程主动发送消息给渲染进程函数
function sendUpdateMessage(message, data) {
  // console.log({ message, data });
  let msg = JSON.stringify(message);
  mainWindow.webContents.send('message', { msg, data });
}
// 卸载
function startupEventHandle() {
  if (require('electron-squirrel-startup')) return;
  var handleStartupEvent = function() {
    if (process.platform !== 'win32') {
      return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
      // case '--squirrel-install':
      // case '--squirrel-updated':
      //   install();
      //   return true;
      case '--squirrel-uninstall':
        uninstall();
        // app.removeAsDefaultProtocolClient('broadClass');
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
    // 安装
    // function install() {
    //   var cp = require('child_process');
    //   var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    //   var target = path.basename(process.execPath);
    //   var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
    //   child.on('close', function(code) {
    //       app.quit();
    //   });
    // }
    // 卸载
    function uninstall() {
      var cp = require('child_process');
      var updateDotExe = path.resolve(
        path.dirname(process.execPath),
        '..',
        'update.exe'
      );
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ['--removeShortcut', target], {
        detached: true,
      });
      child.on('close', function(code) {
        app.quit();
      });
    }
  };
  if (handleStartupEvent()) {
    return;
  }
}
