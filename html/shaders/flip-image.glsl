attribute vec2 position;
varying vec2 tex_coords;

void main(void) {
    tex_coords = (position + 1.0) / 2.0;
    tex_coords.y = 1.0 - tex_coords.y;
    gl_Position = vec4(position, 0.0, 1.0);
}
