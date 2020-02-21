precision mediump float;

attribute vec4 a_position;
attribute float a_selected;
attribute vec3 a_color;

uniform vec2 u_extent_x;
uniform vec2 u_extent_y;

uniform vec4 u_margin;
uniform float u_pointsize;

varying float v_selected;
varying vec3 v_color;

void main(){
  gl_PointSize = u_pointsize * 1.0 * (a_selected > 0.5 ? 1.8:1.0);
  gl_Position = a_position;


  //data to [0,1]
  gl_Position.x = (gl_Position.x - u_extent_x.x) / (u_extent_x.y - u_extent_x.x);
  gl_Position.y = (gl_Position.y - u_extent_y.x) / (u_extent_y.y - u_extent_y.x);

  //add margin
  gl_Position.x = gl_Position.x * (u_margin.y - u_margin.x) + u_margin.x;
  gl_Position.y = gl_Position.y * (u_margin.w - u_margin.z) + u_margin.z;

  //data to [-1,1]
  gl_Position.x = gl_Position.x * 2.0 - 1.0;
  gl_Position.y = gl_Position.y * 2.0 - 1.0;
  
  // gl_Position.z = (a_selected>0.5? 0.9:0.1);

  v_selected = a_selected;
  v_color = a_color;
}