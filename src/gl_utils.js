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


export function update_data(gl, name, data){
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


export function update_uniform(gl, name, value){
  let loc = initUniform(gl, name);
  if (typeof(value) == 'number'){
    gl.uniform1f(loc, value);
  }else if (value.length == 2){
    gl.uniform2f(loc, ...value);
  }else if (value.length == 3){
    gl.uniform3f(loc, ...value);
  }else if (value.length == 4){
    gl.uniform4f(loc, ...value);
  }
}


export function clear(gl, COLOR){
  gl.clearColor(...COLOR);
  gl.clear(gl.COLOR_BUFFER_BIT);
}