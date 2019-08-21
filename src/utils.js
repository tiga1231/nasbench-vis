export function zip(){
  let res = [];
  for(let i=0; i<arguments[0].length; i++){
    res.push(Array(arguments.length).fill().map((d,j)=>arguments[j][i]));
  }
  return res;
}