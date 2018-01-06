// node 標準のものは、 FSWatch を export していないので自前定義
declare interface FSWatcher {
    close(): void;
}

type BrowserWindow = Electron.BrowserWindow

// 必要になるモジュール群を読み込む
const {app, dialog, Menu, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const program = require('commander')

class Main {

    private mainWindow: BrowserWindow
    private fileWatcher: FSWatcher
    private licensesWindow: BrowserWindow
    private firstOpenFilePath: string

    public constructor(firstOpenFilePath: string) {

        this.firstOpenFilePath = firstOpenFilePath

        let _this = this
        app.on('ready', function() { _this.createMainWindow() })

        // すべてのウィンドウが閉じたらアプリケーションを終了する
        // darwin は例外(Dock に常駐するからアプリを終了する必要がない？？？
        app.on('window-all-closed', () => {
          if (process.platform !== 'darwin') {
            app.quit()
          }
        })

        // アクティブ化されたときにウィンドウを作る
        // (詳細不明、QuickStart に入ってたからとりあえず入れている感じ)
        app.on('activate', function() { _this.onActivate() })
    }

    public openDevToolInMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.webContents.openDevTools({mode: 'detach'})
        }
    }

    private createMainWindow() {
        // メインウィンドウ作成
        this.mainWindow = new BrowserWindow({show: false})

        // index.html ロード
        this.mainWindow.loadURL(url.format({
          pathname: path.join(__dirname, '..', 'renderer', 'index.html'),
          protocol: 'file:',
          slashes: true
        }))

        let _this = this

        // ウィンドウが閉じたときに、グローバル変数を掃除する
        this.mainWindow.on('closed', function() { _this.onMainWindowClose() })

        // 引数で指定されたファイルが開けるならそれを開く
        this.mainWindow.once('show', function() { _this.openArgFile() })

        this.mainWindow.once('ready-to-show', function() {
            _this.mainWindow.show()
        })
    }

    private onActivate() {
        if (this.mainWindow === null) {
            this.createMainWindow()
        }
    }

    // メインウィンドウが閉じられた時の処理
    private onMainWindowClose() {
        this.mainWindow = null
        if (this.fileWatcher) {
            this.fileWatcher.close()
            this.fileWatcher = null
        }
    }

    // 引数から渡されたパスのファイルを開く
    private openArgFile() {

        // 引数でのファイル指定が無ければ何もしない
        if (!this.firstOpenFilePath) {
            return
        }

        try {
            fs.accessSync(this.firstOpenFilePath, fs.constants.R_OK)
            this.openAndWatch(this.firstOpenFilePath)
        } catch (err){
            console.log(err)
            let message = this.firstOpenFilePath + " は存在しません。"
            this.mainWindow.webContents.send('changeMessage', message)
        }
    }

    private chooseFileAndOpenAndWatch() {
        // ファイル選択ダイアログを開く
        let filePath = dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{name: 'SVG Image', extensions: ['svg']}]
        })[0]

        // ファイルが選択されていなければ何もせず終了
        if (!filePath) {
            return
        }

        this.openAndWatch(filePath)
    }

    private openAndWatch(filePath: string) {
        // ファイルを開く
        this.openFile(filePath)

        // 古い監視設定が存在していたらクローズ
        if (this.fileWatcher) {
            this.fileWatcher.close()
        }

        // ファイル監視を開始
        this.fileWatcher = fs.watch(filePath, {
            persistent: false,
            recursive: false,
            encoding: 'UTF-8'
        }, (type: string, filename: string) => {
            if (type === 'change') {
                this.openFile(filePath)
            }
        })
    }

    private openFile(filePath: string) {
        let content = fs.readFileSync(filePath);
        this.mainWindow.webContents.send('changeImage', content)
    }

    public createLicensesWindow() {
        // ライセンスウィンドウ作成
        this.licensesWindow = new BrowserWindow()
        const licensesMenu = Menu.buildFromTemplate([])
        this.licensesWindow.setMenu(null)

        // licenses.html ロード
        this.licensesWindow.loadURL(url.format({
          pathname: path.join(__dirname, '..', 'renderer', 'licenses.html'),
          protocol: 'file:',
          slashes: true
        }))

        // ウィンドウが閉じたときに、グローバル変数を掃除する
        this.licensesWindow.on('closed', function() {
          this.licensesWindow = null
        })
    }

    public static main() {
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
            program.outputHelp(Main.printUsageAndExit)
        }

        let sagae = new Main(firstOpenFilePath)

        // メニュー
        const mainMenuTemplate = [
            {
                label: 'ファイル',
                submenu: [
                    {
                        label: 'ファイルを開く',
                        click: function() { sagae.chooseFileAndOpenAndWatch() }
                    }
                ]
            },
            {
                label: '表示',
                submenu: [
                    {
                        label: 'メインウィンドウで開発者ツールを開く',
                        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                        click: function() { sagae.openDevToolInMainWindow() },
                    }
                ]
            },
            {
                label: 'ライセンス',
                click: function() { sagae.createLicensesWindow() }
            },
            {
                label: '終了',
                role: 'quit'
            }
        ]

        // アプリケーションメニュー設定
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
        Menu.setApplicationMenu(mainMenu)
    }

    // Usage を出力して終了
    private static printUsageAndExit(usage: string) {
        console.log(usage)
        process.exit(1)
    }
}

Main.main()

