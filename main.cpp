#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <opencv2/core/mat.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/opencv.hpp>

#include <stdio.h>

using namespace cv;
using namespace emscripten;

class Hello {
private:
  std::vector<unsigned char> buffer;
  Mat decoded;

public:
  Hello() : buffer{}, decoded{} {};

  val allocate(size_t size) {
    this->buffer.reserve(size);
    unsigned char *byteBuffer = this->buffer.data();
    return val(typed_memory_view(size, byteBuffer));
  }

  Mat my_imdecode() {
    this->decoded = imdecode(this->buffer, IMREAD_GRAYSCALE);
    return this->decoded;
  }
};

EMSCRIPTEN_BINDINGS(my_module) {
  class_<Mat>("Mat");
  class_<Hello>("Hello")
      .constructor<>()
      .function("imdecode", &Hello::my_imdecode)
      .function("allocate", &Hello::allocate);
}
