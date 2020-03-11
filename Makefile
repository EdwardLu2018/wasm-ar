all:
	rm -rf ./build && mkdir build && cd build && emcmake cmake .. && emmake make

serve:
	python3 -m http.server
