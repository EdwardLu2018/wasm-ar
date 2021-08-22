## Компиляция OpenCV

Весь процесс компиляции описан на [оф. сайте](https://docs.opencv.org/4.5.2/d4/da1/tutorial_js_setup.html)

В общем, весь процесс прост:

1. Установка emsdk
2. Клонирование репозитория OpenCV
3. Билд OpenCV.js

Для корректной работы на десктопе и на мобильных устройствах хорошо работает связка emsdk 1.40.1 и OpenCV 3.4.13

Билд производится такой командой (CentOS 8)
```
emcmake python3 ./opencv/platforms/js/build_js.py build_wasm --build_wasm --build_flags="-s USE_PTHREADS=0 -O3"
```

Пример билда приведён в файле opencv.js