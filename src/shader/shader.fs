precision mediump float;
varying float v_selected;
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

    if (v_selected > 0.5){
      gl_FragColor.rgb = mix(
      vec3(49.0/255.0,130.0/255.0,189.0/255.0), 
      vec3(1.0, 1.0, 1.0), 
      smoothstep(0.3, 0.5, radius));
      
    }else{
      gl_FragColor = vec4(0.3,0.3,0.3, 1.0);
    }

    alpha_multiplier = smoothstep(0.5, 0.3, radius);
    gl_FragColor.a = alpha_multiplier;
  }else{//line mode
    if(u_isfg > 0.5){
        gl_FragColor = vec4(0.5,0.5,0.5, 0.5);
      }else{
        gl_FragColor = vec4(0.22,0.22,0.22, 1.0);
      }
  }
  
  
}