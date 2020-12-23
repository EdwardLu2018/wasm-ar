#!/usr/bin/env bash

if [ ! -d "./build" ]
then
    mkdir build
    cd build

    emcmake cmake ..
    emmake make
elif [ "$1" == "--force" ]
then
    rm -rf build
    mkdir build
    cd build

    emcmake cmake ..
    emmake make
else
    cd build
    make
fi
