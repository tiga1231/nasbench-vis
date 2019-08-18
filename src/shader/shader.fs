attribute vec4 a_position;

uniform vec2 u_shift;
uniform vec2 u_scale;

void main(){
  gl_PointSize = 10.0;
  gl_Position = a_position;
  gl_Position.x = (gl_Position.x - u_shift.x) / u_scale.x;
  gl_Position.y = (gl_Position.y - u_shift.y) / u_scale.y;

  gl_Position.x = gl_Position.x * 2.0 - 1.0;
  gl_Position.y = gl_Position.y * 2.0 - 1.0;
}