cmake_minimum_required( VERSION 3.1 )
project( WASM_AR )

set( CMAKE_CXX_STANDARD 11 )

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

set( CMAKE_CXX_FLAGS_RELEASE "-O3" )

include_directories( opencv/include )
include_directories( opencv/build_wasm )

file( GLOB opencv_include_modules "opencv/modules/*/include" )
include_directories( ${opencv_include_modules} )

file( GLOB opencv_js "opencv/build_wasm/lib/*.a" )

add_executable( wasm_ar wasm_ar.cpp )
target_link_libraries( wasm_ar ${opencv_js} )

set_target_properties( wasm_ar PROPERTIES LINK_FLAGS "-s USE_ZLIB=1 -s LLD_REPORT_UNDEFINED -s MODULARIZE=1 -s EXPORT_NAME='ARWasm' -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXTRA_EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap']' -s WASM=1" )
