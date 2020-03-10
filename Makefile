all:
	rm -rf ./build && mkdir build && cd build && emconfigure cmake .. && emmake make

serve:
	python3 -m http.server
