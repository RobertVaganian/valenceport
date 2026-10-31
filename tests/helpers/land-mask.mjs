// Read the same generalized land contours that are displayed by the prototype.
export function landMask(svg) {
  const rings=[...svg.matchAll(/\bd="([^"]+)"/g)].flatMap(match=>match[1].split('M').slice(1).map(part=>{
    const numbers=part.match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];
    for(let i=0;i<numbers.length;i+=2)points.push([numbers[i],numbers[i+1]]);
    return {points,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};
  }));
  return (x,y)=>{
    let winding=0;
    for(const ring of rings){if(x<ring.minX||x>ring.maxX||y<ring.minY||y>ring.maxY)continue;
      for(let i=0,j=ring.points.length-1;i<ring.points.length;j=i++){
        const a=ring.points[j],b=ring.points[i];
        if((a[1]<=y&&b[1]>y)||(a[1]>y&&b[1]<=y)){
          const crossing=a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]);
          if(crossing>x)winding+=b[1]>a[1]?1:-1;
        }
      }
    }return winding!==0;
  };
}
export function samplePath(path,spacing=1){
 let cursor=[0,0],samples=[];
 for(const match of path.matchAll(/([MLQ])([^MLQ]+)/g)){
  const n=match[2].match(/-?\d+(?:\.\d+)?/g).map(Number);
  if(match[1]==='M'){cursor=n;samples.push(n);continue;}
  const end=n.slice(-2),start=cursor,control=match[1]==='Q'?n.slice(0,2):null;
  const length=control?Math.hypot(control[0]-start[0],control[1]-start[1])+Math.hypot(end[0]-control[0],end[1]-control[1]):Math.hypot(end[0]-start[0],end[1]-start[1]);
  const count=Math.max(1,Math.ceil(length/spacing));
  for(let i=1;i<=count;i++){const t=i/count;samples.push(control?[0,1].map(k=>(1-t)**2*start[k]+2*(1-t)*t*control[k]+t*t*end[k]):[0,1].map(k=>start[k]+(end[k]-start[k])*t));}
  cursor=end;
 }return samples;
}
