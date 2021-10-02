#version 300 es

precision highp int;
precision mediump float;
precision mediump sampler2D;

out vec4 color;
in vec2 texCoord;
uniform vec2 texSize;

uniform sampler2D image;
uniform float kernel[25];

#define pixelAtOffset(img, offset) textureLodOffset((img), texCoord, 0.0f, (offset))
#define S(x,y,k) result += pixelAtOffset(image, ivec2((x),(y))) * kernel[k]

const vec4 g = vec4(0.299f, 0.587f, 0.114f, 0.0f); // vec4(0.333f, 0.333f, 0.333f, 0.0f);

void main(void) {
    float gray = dot(textureLodOffset(image, texCoord, 0.0f, ivec2(0,0)), g);
    color = vec4(gray, gray, gray, 1.0f);
}
