precision mediump float;

void main(){
  vec2 loc = gl_PointCoord.xy;
  vec2 center = vec2(0.5,0.5);
  float radius = length(loc-center);
  
  // if we are within our circle, paint it red
  if (radius<0.4)
      gl_FragColor = vec4(0.7, 0.7, 1.0, 1.0);
  else if (radius<0.5)
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  else
      discard;
}