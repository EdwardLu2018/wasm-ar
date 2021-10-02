#version 300 es

precision highp int;
precision mediump float;

layout (location=0) in vec2 a_position;
layout (location=1) in vec2 a_texCoord;
out vec2 texCoord;

void main() {
    gl_Position = vec4(a_position * vec2(-1, 1), 0.0f, 1.0f); // * vec2(-1, 1) mirrors image
    texCoord = a_texCoord;
}
