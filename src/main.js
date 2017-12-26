// 必要になるモジュール群を読み込む
const {app, dialog, Menu, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

// メインウィンドウはグローバルに持つのが良い
let mainWindow
let fileWatcher

// メニュー
const mainMenuTemplate = [
    {
        label: 'ファイル',
        submenu: [
            {
                label: 'ファイルを開く',
                click: () => { chooseFileAndOpen() }
            }
        ]
    },
    {
        label: '表示',
        submenu: [
            {
                label: '開発者ツールを開く',
                accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                click: () => mainWindow.webContents.openDevTools({mode: 'detach'}),
            }
        ]
    },
    {
        label: '終了',
        role: 'quit'
    }
]

function createWindow() {
    // メインウィンドウ作成
    mainWindow = new BrowserWindow()
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)

    // index.html ロード
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))

    // ウィンドウが閉じたときに、グローバル変数を掃除する
    mainWindow.on('closed', () => {
      mainWindow = null
      if (fileWatcher) {
          fileWatcher.close()
          fileWatcher = null
      }
    })
}

app.on('ready', createWindow)

// すべてのウィンドウが閉じたらアプリケーションを終了する
// darwin は例外(Dock に常駐するからアプリを終了する必要がない？？？
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アクティブ化されたときにウィンドウを作る
// (詳細不明、QuickStart に入ってたからとりあえず入れている感じ)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function chooseFileAndOpen() {
    // ファイル選択ダイアログを開く
    let filePath = dialog.showOpenDialog(['openFile'])[0]

    // ファイルが選択されていなければ何もせず終了
    if (!filePath) {
        return
    }

    // ファイルを開く
    openFile(filePath)

    // 古い監視設定が存在していたらクローズ
    if (fileWatcher) {
        fileWatcher.close()
    }

    // ファイル監視を開始
    fileWatcher = fs.watch(filePath, {
        presistent: false,
        recursive: false
    }, (type, filename) => {
        if (type === 'change') {
            openFile(filePath)
        }
    })

}

function openFile(filePath) {
    let content = fs.readFileSync(filePath);
    mainWindow.webContents.send('changeImage', content)
}

