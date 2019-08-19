precision mediump float;

void main(){
  gl_FragColor = vec4(1.0,1.0,1.0,1.0);
  vec2 loc = gl_PointCoord.xy;
  vec2 center = vec2(0.5,0.5);
  float radius = length(loc-center);
  float alpha_multiplier;

  gl_FragColor.rgb = mix(
    vec3(0.3, 0.3, 0.7), 
    vec3(1.0, 1.0, 1.0), 
    smoothstep(0.3, 0.5, radius));
  alpha_multiplier = smoothstep(0.5, 0.3, radius);
  gl_FragColor.a = alpha_multiplier;
}