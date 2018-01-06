// SVGElement#getBBox が公開されていないようなので独自定義
declare interface SVGElement {
    getBBox(): SVGRect
}

const {ipcRenderer} = require('electron')
const remote = require('electron').remote

window.addEventListener('load', function() {
    ipcRenderer.on('changeImage', function (event: string, content: string) {

        // メッセージリセット
        setMessage("")

        // content をパース
        let svgDom = new DOMParser().parseFromString(content, 'application/xml');

        // 古い画像があれば削除する
        let target: HTMLElement = document.getElementById("svg") as HTMLElement
        let child: Node | null = target.firstChild
        while (child) {
            target.removeChild(child)
            child = target.firstChild
        }

        // エレメント挿入
        target.appendChild(document.importNode(svgDom.documentElement, true));

        // SVG のサイズ取得
        let bbox = (target.firstChild as SVGElement).getBBox()
        let width: number | null = bbox.width
        let height: number | null = bbox.height

        if (width) {
            target.setAttribute("width", width.toString(10))
        }

        if (height) {
            target.setAttribute("height", height.toString(10))
        }

        let win = remote.getCurrentWindow()

        if (win) {
            let applicationArea: HTMLElement = document.getElementById('application') as HTMLElement
            win.setContentSize(applicationArea.clientWidth, applicationArea.clientHeight)
        }
    });

    ipcRenderer.on('changeMessage', function (event: string, message: string) {
        setMessage(message)
    });
});

function setMessage(message: string) {
    // メッセージを更新
    let target: HTMLElement = document.getElementById("message") as HTMLElement;
    target.textContent = message
}
