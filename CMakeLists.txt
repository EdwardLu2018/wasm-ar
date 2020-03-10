cmake_minimum_required( VERSION 3.1 )
project( WASM_AR )

# Use C++ 11 by default
set( CMAKE_CXX_STANDARD 11 )

# Set Release as default build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

# Does not work
# find_package( OpenCV REQUIRED PATHS opencv/build_wasm NO_DEFAULT_PATH)

# Needed for opencv2/opencv.hpp
include_directories( opencv/include )

# Needed by opencv.hpp for opencv2/opencv_modules.hpp
include_directories( opencv/build_wasm )

# Needed by opencv_modules.hpp for every module
file( GLOB opencv_include_modules "opencv/modules/*/include" )
include_directories( ${opencv_include_modules} )
file( GLOB opencv_contrib_include_modules "opencv_contrib/modules/*/include" )
include_directories( ${opencv_contrib_include_modules} )

add_executable( homography homography.cpp )

# Link to opencv.js precompiled libraries
file( GLOB opencv_js "opencv/build_wasm/lib/*.a" )
target_link_libraries( homography ${opencv_js} )

# Specify linker arguments
# set_target_properties( hello PROPERTIES LINK_FLAGS "-s DEMANGLE_SUPPORT=1 --preload-file assets --bind" )
set_target_properties( homography PROPERTIES LINK_FLAGS "-s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -Oz -O3 -s WASM_OBJECT_FILES=0 --llvm-lto 1 --closure 1 -s WASM=1 -s USE_ZLIB=1 --bind" )
