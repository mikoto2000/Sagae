// 必要になるモジュール群を読み込む
const {app, dialog, Menu, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const program = require('commander')

// メインウィンドウはグローバルに持つのが良い
let mainWindow
let fileWatcher
let licensesWindow

// メニュー
const mainMenuTemplate = [
    {
        label: 'ファイル',
        submenu: [
            {
                label: 'ファイルを開く',
                click: () => { chooseFileAndOpenAndWatch() }
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
        label: 'ライセンス',
        click: () => { createLicensesWindow() }
    },
    {
        label: '終了',
        role: 'quit'
    }
]

// パッケージ化したアプリのために、ダミーの引数を挿入する
if (!process.defaultApp) {
    process.argv.splice(1, 0, ".")
}

// コマンドライン引数解析
program.version('1.0.0')
    .usage('[options] FILE')
    .parse(process.argv)

let firstOpenFilePath
if (program.args[0]) {
    firstOpenFilePath = path.resolve(program.args[0])
}

// 引数の数判定
if (program.args.length > 1) {
    program.outputHelp(printUsageAndExit)
}

// Usage を出力して終了
function printUsageAndExit(usage) {
    console.log(usage)
    process.exit(1)
}

function createMainWindow() {
    // メインウィンドウ作成
    mainWindow = new BrowserWindow({show: false})
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)

    // index.html ロード
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'index.html'),
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

    // 引数で指定されたファイルが開けるならそれを開く
    mainWindow.once('show', () => {
        // 引数でのファイル指定が無ければ何もしない
        if (!firstOpenFilePath) {
            return
        }

        try {
            fs.accessSync(firstOpenFilePath, fs.constants.R_OK)
            openAndWatch(firstOpenFilePath)
        } catch (err){
            console.log(err)
            let message = firstOpenFilePath + " は存在しません。"
            mainWindow.webContents.send('changeMessage', message)
        }
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })
}

app.on('ready', createMainWindow)

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
    createMainWindow()
  }
})

function chooseFileAndOpenAndWatch() {
    // ファイル選択ダイアログを開く
    let filePath = dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{name: 'SVG Image', extensions: ['svg']}]
    })[0]

    // ファイルが選択されていなければ何もせず終了
    if (!filePath) {
        return
    }

    openAndWatch(filePath)
}

function openAndWatch(filePath) {
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

function createLicensesWindow() {
    // ライセンスウィンドウ作成
    licensesWindow = new BrowserWindow()
    const licensesMenu = Menu.buildFromTemplate([])
    licensesWindow.setMenu(null)

    // licenses.html ロード
    licensesWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'licenses.html'),
      protocol: 'file:',
      slashes: true
    }))

    // ウィンドウが閉じたときに、グローバル変数を掃除する
    licensesWindow.on('closed', () => {
      licensesWindow = null
    })
}