#!/usr/bin/env bash

mkdir build
pushd build

emcmake cmake -DCMAKE_BUILD_TYPE=Release ..
emmake make -j7

popd
