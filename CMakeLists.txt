cmake_minimum_required( VERSION 3.1 )
project( WASM_AR )

set( CMAKE_CXX_STANDARD 11 )

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

set( CMAKE_CXX_FLAGS_RELEASE "-g -Wall -O3" )

set( JS ${CMAKE_SOURCE_DIR}/js )
file( MAKE_DIRECTORY ${JS} )
set( CMAKE_RUNTIME_OUTPUT_DIRECTORY ${JS} )

set( BUILD_WASM opencv/build_wasm )
set( SRC_DIR emscripten )

include_directories( opencv/include )
include_directories( ${BUILD_WASM} )

file( GLOB opencv_include_modules "opencv/modules/*/include" )
include_directories( ${opencv_include_modules} )

file( GLOB opencv_js "${BUILD_WASM}/lib/*.a" )

include_directories( ${SRC_DIR} )
file( GLOB WASMAR_SRCS ${SRC_DIR}/*.cpp )

add_executable( img_tracker_wasm ${SRC_DIR}/img_tracker_wasm.cpp ${WASMAR_SRCS} )
target_link_libraries( img_tracker_wasm ${opencv_js} )

set_target_properties( img_tracker_wasm PROPERTIES LINK_FLAGS "-s EXPORT_NAME='ImageTrackerWASM' -s USE_ZLIB=1 -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXPORTED_RUNTIME_METHODS='['cwrap', 'getValue']' -s WASM=1" )
