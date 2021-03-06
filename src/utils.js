export const bg_color = [0.2, 0.2, 0.2, 1.0];

export function zip(){
  let res = [];
  for(let i=0; i<arguments[0].length; i++){
    res.push(Array(arguments.length).fill().map((d,j)=>arguments[j][i]));
  }
  return res;
}

let dataCache = {};
export function loadBin(url, handler, handler_kwargs={}){
  if (url in dataCache){
    handler(dataCache[url], handler_kwargs);
  }else{
    var xhr = new window.XMLHttpRequest();
    var ready = false;
    handler_kwargs.url = url;
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 
            && xhr.status === 200
            && ready !== true) {
            let response;
            if (xhr.responseType === "arraybuffer"){
              response = xhr.response;
            }else if(xhr.mozResponseArrayBuffer !== null){
              response = xhr.mozResponseArrayBuffer;
            }else if(xhr.responseText !== null){
              var data = String(xhr.responseText);
              var ary = new Array(data.length);
              for (var i = 0; i <data.length; i++) {
                  ary[i] = data.charCodeAt(i) & 0xff;
              }
              var uint8ay = new Uint8Array(ary);
              response = uint8ay.buffer;
            }
            dataCache[url] = response;
            handler(response, handler_kwargs);
            ready = true;
        }
    };
    xhr.open("GET", url, true);
    xhr.responseType="arraybuffer";
    xhr.send();
  }
  
}


export function flatten(data){
  // data: Array or ArrayBuffer
  if(data instanceof Array){
    while(typeof(data[0]) !== 'number'){
      data = data.flat();
    }
  }
  return data;
}


export function reshape(data, shape){
  data = flatten(data);

  if (shape.length == 1){
    return data;
  }else if (shape.length == 2){
    let res = [];
    for (let i=0; i<shape[0]; i++){
      res.push([]);
      for (let j=0; j<shape[1]; j++){
        res[res.length-1].push(data[i*shape[1] + j]);
      }
    }
    return res;
  }else{
    let res = [];
    let stepsize = shape.slice(1).reduce((x,y)=>x*y, 1);
    for (let i=0; i<shape[0]; i++){
      let slice_i = data.slice(i*stepsize, (i+1)*stepsize);
      let shape_i = shape.slice(1);
      res.push(reshape(slice_i, shape_i));
    }
    return res;
  }
}
