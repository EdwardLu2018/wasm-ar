cmake_minimum_required( VERSION 3.1 )
project( WASM_AR )

set( CMAKE_CXX_STANDARD 11 )

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

set( CMAKE_CXX_FLAGS_RELEASE "-g -Wall -O3" )

set( WASM ../wasm )
file( MAKE_DIRECTORY ${WASM} )
set( CMAKE_RUNTIME_OUTPUT_DIRECTORY ${WASM} )

include_directories( opencv/build_wasm )
include_directories( opencv/build_wasm/opencv/include )

file( GLOB opencv_include_modules "opencv/build_wasm/opencv/modules/*/include" )
include_directories( ${opencv_include_modules} )

file( GLOB opencv_js "opencv/build_wasm/lib/*.a" )

add_executable( img_tracker_wasm src/img_tracker_wasm.cpp )
target_link_libraries( img_tracker_wasm ${opencv_js} )

set_target_properties( img_tracker_wasm PROPERTIES LINK_FLAGS "-s EXPORT_NAME='ARWasm' -s USE_ZLIB=1 -s MODULARIZE=1 -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXTRA_EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap']' -s WASM=1" )
