precision mediump float;

attribute vec4 a_position;

uniform vec2 u_shift;
uniform vec2 u_scale;
uniform vec4 u_margin;
uniform float u_pointsize;

varying vec4 v_color;

void main(){
  gl_PointSize = u_pointsize;
  gl_Position = a_position;
  gl_Position.x = (gl_Position.x - u_shift.x) / u_scale.x;
  gl_Position.y = (gl_Position.y - u_shift.y) / u_scale.y;

  gl_Position.x = gl_Position.x * (u_margin.y - u_margin.x) + u_margin.x;
  gl_Position.y = gl_Position.y * (u_margin.w - u_margin.z) + u_margin.z;

  gl_Position.x = gl_Position.x * 2.0 - 1.0;
  gl_Position.y = gl_Position.y * 2.0 - 1.0;



  

}