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

        // SVG のサイズ取得
        let width:string | null = svgDom.documentElement.getAttribute("width")
        let height:string | null = svgDom.documentElement.getAttribute("height")

        // 古い画像があれば削除する
        let target: HTMLElement = document.getElementById("svg") as HTMLElement
        let child: Node | null = target.firstChild
        while (child) {
            target.removeChild(child)
            child = target.firstChild
        }

        // エレメント挿入
        if (width) {
            target.setAttribute("width", width)
        }
        if (height) {
            target.setAttribute("height", height)
        }
        target.appendChild(document.importNode(svgDom.documentElement, true));

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
