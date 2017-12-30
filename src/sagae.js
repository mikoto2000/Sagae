const {ipcRenderer} = require('electron')
const remote = require('electron').remote

window.addEventListener('load', function() {
    ipcRenderer.on('changeImage', function (event, content) {
        // content をパース
        let svgDom = new DOMParser().parseFromString(content, 'application/xml');

        // SVG のサイズ取得
        let width = svgDom.documentElement.getAttribute("width")
        let height = svgDom.documentElement.getAttribute("height")

        // 古い画像があれば削除する
        let target = document.getElementById("svg");
        let child = target.firstChild
        while (child) {
            target.removeChild(child)
            child = target.firstChild
        }

        // エレメント挿入
        target.setAttribute("width", width)
        target.setAttribute("height", height)
        target.appendChild(document.importNode(svgDom.documentElement, true));

        let win = remote.getCurrentWindow()
        let applicationArea = document.getElementById('application')
        win.setContentSize(applicationArea.clientWidth, applicationArea.clientHeight)
    });
});

