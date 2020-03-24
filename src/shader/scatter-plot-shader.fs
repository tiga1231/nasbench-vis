precision mediump float;
varying float v_selected;
varying vec3 v_color;
uniform float u_isfg;
uniform float u_mode;

void main(){

  if (u_isfg > 0.5 && v_selected < 0.5){
    discard;
  }

  gl_FragColor = vec4(1.0,1.0,1.0,1.0);
  if (u_mode < 0.5){ //point mode
    vec2 loc = gl_PointCoord.xy;
    vec2 center = vec2(0.5,0.5);
    float radius = length(loc-center);
    float alpha_multiplier;
    float alpha_base = 1.0;

    if (v_selected > 0.5 && u_isfg > 0.5){
      gl_FragColor.rgb = mix(
      v_color, 
      mix(v_color, vec3(1.0,1.0,1.0), 0.3),
      smoothstep(0.3, 0.5, radius));
    }else{
      gl_FragColor = vec4(0.3,0.3,0.3, 1.0);
    }

    alpha_multiplier = alpha_base * smoothstep(0.5, 0.3, radius);
    gl_FragColor.a = alpha_multiplier;
  }else{//line mode
    gl_FragColor = vec4(1.0,1.0,1.0, 0.3);
  }

  
  
  
}