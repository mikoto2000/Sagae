Sagae
=====

Sagae is yet another SVG editor.


Usage:
------

TODO

Build:
------

### Build Requirements:

- Docker
- ImageMagick


### Release:

```sh
> convert -background none .\resource\icon.svg -define icon:auto-resize .\resource\icon.ico
> docker-compose run --rm electron electron-packager . sagae --platform=win32 --arch=x64 --electron-version=1.7.9 --overwrite --icon=./resource/icon.ico
```

License:
--------

Copyright (C) 2017 mikoto2000

This software is released under the MIT License, see LICENSE

このソフトウェアは MIT ライセンスの下で公開されています。 LICENSE を参照してください。


Author:
-------

mikoto2000 <mikoto2000@gmail.com>

