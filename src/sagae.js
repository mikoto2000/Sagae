const {ipcRenderer} = require('electron')

window.addEventListener('load', function() {
    ipcRenderer.on('changeImage', function (event, content) {
        // content をパース
        let svgDom = new DOMParser().parseFromString(content, 'application/xml');

        // SVG のサイズ取得
        let width = svgDom.documentElement.getAttribute("width")
        let height = svgDom.documentElement.getAttribute("height")

        // エレメント挿入
        let target = document.getElementById("svg");
        target.setAttribute("width", width)
        target.setAttribute("height", height)
        target.appendChild(document.importNode(svgDom.documentElement, true));
    });
});

