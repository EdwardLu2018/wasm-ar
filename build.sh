#!/usr/bin/env bash

if [ ! -d "./build" ]
then
    mkdir build
    pushd build

    emcmake cmake ..
    emmake make
elif [ "$1" == "--force" ]
then
    rm -rf build
    mkdir build
    pushd build

    emcmake cmake ..
    emmake make
else
    pushd build
    make
fi

popd
