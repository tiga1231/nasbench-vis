import * as d3 from "d3";
import getGLprog from "webgl-utils";

window.onload = function(){

  var vertexShader = require("./shader/shader.vs");
  var fragmentShader = require("./shader/shader.fs");

  let canvasWidth = 500;
  let canvasHeight = 400;
  let dpr = window.devicePixelRatio;
  let canvas = d3.select('body')
  .append('canvas')
  .attr('id', 'plot1')
  .attr('width', canvasWidth*dpr)
  .attr('height', canvasHeight*dpr)
  .style('width', canvasWidth)
  .style('height', canvasHeight);

  let gl = getGLprog(canvas.node(), vertexShader, fragmentShader);

  d3.json('./data/data.json')
  .then(data=>{
      window.data = data;
      console.log(data);
      plot(data, gl);
      window.data = data;

  });

  // global modules for debug in browser
  window.d3 = d3;
}




function initGLData(gl, name){
  if(!gl.hasOwnProperty('data')){
    gl.data = {};
  }
  if(!gl.data.hasOwnProperty(name)){
    gl.data[name] = {};
  }
}
function initAttr(gl, name){
  initGLData(gl, name);
  let loc;
  if(!gl.data[name].hasOwnProperty('loc')){
    loc = gl.getAttribLocation(gl.program, name);
    gl.data[name].loc = loc;
  }else{
    loc = gl.data[name].loc;
  }
  return loc;
}

function initUniform(gl, name){
  initGLData(gl, name);
  let loc;
  if(!gl.data[name].hasOwnProperty('loc')){
    loc = gl.getUniformLocation(gl.program, name);
    gl.data[name].loc = loc;
  }else{
    loc = gl.data[name].loc;
  }
  return loc;
}


function update_data(gl, name, data){
  let loc = initAttr(gl, name);
  let buffer;
  if(!gl.data[name].hasOwnProperty('buffer')){
    buffer = gl.createBuffer();
    gl.data[name].buffer = buffer;
  }else{
    buffer = gl.data[name].buffer;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(data.flat()), gl.STATIC_DRAW);

  let dim;
  if (typeof(data[0]) == 'number'){
    dim = 1;
  }else{
    dim = data[0].length;
  }
  gl.vertexAttribPointer(loc, dim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc);
}


function update_uniform(gl, name, value){
  let loc = initUniform(gl, name);
  gl.uniform2f(loc, ...value);
}


function clear(gl){
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}


function plot(data, gl){
  clear(gl);
  let xy = d3.range(10000).map(i=>{
    return [
    data['4_final_validation_accuracy'][i], 
    data['12_final_validation_accuracy'][i]];
  });

  let vmax = xy.flat().reduce((a,b)=>Math.max(a,b), 0);
  let vmin = xy.flat().reduce((a,b)=>Math.min(a,b), 1.0);
  console.log(vmin, vmax);

  window.xy = xy;
  window.gl = gl;

  update_data(gl, 'a_position', xy);
  update_uniform(gl, 'u_shift', [vmin, vmin]);
  update_uniform(gl, 'u_scale', [vmax-vmin, vmax-vmin]);

  gl.drawArrays(gl.POINTS, 0, 10000);
}