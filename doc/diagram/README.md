[ozcld](https://github.com/mikoto2000/ozcld) および [Graphviz](https://graphviz.gitlab.io/) を用いて画像へ変換したうえで参照してください。

ozcld のインストール

```
go get github.com/mikoto2000/ozcld/cmd/ozcld
```

ozcld で dot に変換 -> Graphviz で画像に変換

```
ozcld -o ClassDiagram_app.dot .\ClassDiagram_app.ozcld
dot -T svg ClassDiagram_app.dot -o ClassDiagram_app.svg
ozcld -o ClassDiagram_SvgElement.dot .\ClassDiagram_SvgElement.ozcld
dot -T svg ClassDiagram_SvgElement.dot -o ClassDiagram_SvgElement.svg
```

