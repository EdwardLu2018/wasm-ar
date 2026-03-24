#version 300 es

precision highp int;
precision mediump float;
precision mediump sampler2D;

out vec4 color;
in vec2 texCoord;

uniform sampler2D image;

const vec4 g = vec4(0.299, 0.587, 0.114, 0.0);

void main(void) {
    float gray = dot(textureLodOffset(image, texCoord, 0.0, ivec2(0,0)), g);
    color = vec4(gray, gray, gray, 1.0);
}
