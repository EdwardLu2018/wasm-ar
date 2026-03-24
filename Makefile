EMCC				= em++

WASM_OUTPUT_DIR		= build
EMSCRIPTEN_DIR		= emscripten
OPENCV_DIR			= opencv
OPENCV_BUILD_DIR	= $(OPENCV_DIR)/build_wasm

OPENCV_INCLUDE		= -I$(OPENCV_DIR)/include \
					  -I$(OPENCV_BUILD_DIR) \
					  $(addprefix -I,$(wildcard $(OPENCV_DIR)/modules/*/include))
INCLUDE				= -I$(EMSCRIPTEN_DIR)/ $(OPENCV_INCLUDE)

# Only link opencv modules we use
OPENCV_LIBS			= $(OPENCV_BUILD_DIR)/lib/libopencv_calib3d.a \
					  $(OPENCV_BUILD_DIR)/lib/libopencv_features2d.a \
					  $(OPENCV_BUILD_DIR)/lib/libopencv_video.a \
					  $(OPENCV_BUILD_DIR)/lib/libopencv_imgproc.a \
					  $(OPENCV_BUILD_DIR)/lib/libopencv_flann.a \
					  $(OPENCV_BUILD_DIR)/lib/libopencv_core.a

CXX_FLAGS			= -std=c++11 -Wall -Os -flto
WASM_MODULE_NAME	= ImageTrackerWASM

WASM_LD_FLAGS		+= -s 'EXPORT_NAME="$(WASM_MODULE_NAME)"'
WASM_LD_FLAGS		+= -s USE_ZLIB=1
WASM_LD_FLAGS		+= -s MODULARIZE=1
WASM_LD_FLAGS		+= -s ALLOW_MEMORY_GROWTH=1
WASM_LD_FLAGS		+= -s ENVIRONMENT=worker
WASM_LD_FLAGS		+= -s EXPORTED_FUNCTIONS='["_malloc", "_free"]'
WASM_LD_FLAGS		+= -s EXPORTED_RUNTIME_METHODS='["cwrap", "getValue"]'
WASM_LD_FLAGS		+= -s WASM=1

WASM_SRCS			:= $(wildcard $(EMSCRIPTEN_DIR)/*.cpp)

.PHONY: all wasm clean

all: wasm

wasm: $(WASM_OUTPUT_DIR)/img_tracker_wasm.js

$(WASM_OUTPUT_DIR)/img_tracker_wasm.js: $(WASM_SRCS) | $(WASM_OUTPUT_DIR)
	@echo "=================================================="
	@echo "    Compiling WASM target"
	@echo "    Be sure to clone emsdk and run 'source ./emsdk/emsdk_env.sh'!"
	@$(EMCC) -o $@ $^ $(INCLUDE) $(CXX_FLAGS) $(WASM_LD_FLAGS) $(OPENCV_LIBS)
	@mkdir -p dist
	@mv $(WASM_OUTPUT_DIR)/*.wasm dist/

$(WASM_OUTPUT_DIR):
	@mkdir -p $@

clean:
	@rm -rf $(WASM_OUTPUT_DIR) dist/*.wasm
