// 両条件で共有する決定論的な描画。経過時間やconditionを参照しない。
import { CONFIG } from './config.js';
const W = 400, H = 500;
export function createRenderer(canvas) {
  const c = canvas.getContext('2d');
  function glassPath() {
    c.beginPath(); c.moveTo(115, 181); c.bezierCurveTo(119, 227, 125, 369, 135, 402);
    c.bezierCurveTo(147, 426, 253, 426, 265, 402); c.lineTo(285, 181); c.closePath();
  }
  function ellipse(x,y,rx,ry,fill) { c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fillStyle=fill; c.fill(); }
  function draw(progress, angle) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
    if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
    c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    const bg=c.createLinearGradient(0,0,400,500); bg.addColorStop(0,'#ebe6db'); bg.addColorStop(.55,'#e0d7c7'); bg.addColorStop(1,'#cbbb9f');
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    c.save();c.filter='blur(22px)';c.fillStyle='#a3ac8c';c.globalAlpha=.28;c.beginPath();c.ellipse(395,40,75,170,-.6,0,Math.PI*2);c.fill();c.restore();
    c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(0,168);c.lineTo(400,90);c.lineTo(400,140);c.lineTo(0,218);c.fill();
    c.save();c.translate(202,430);c.rotate(-.12);ellipse(0,0,130,26,'rgba(78,53,29,.12)');ellipse(0,0,101,18,'rgba(78,53,29,.09)');c.restore();
    // Linen coaster remains fixed across all frames.
    c.fillStyle='#d1c2a8'; c.beginPath();c.moveTo(90,393);c.lineTo(271,365);c.lineTo(321,440);c.lineTo(134,474);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=.6;
    for(let i=0;i<16;i++){c.beginPath();c.moveTo(100+i*11,396-i*1.7);c.lineTo(139+i*11,465-i*1.7);c.stroke();}
    ellipse(200,405,73,18,'rgba(70,45,24,.16)');
    c.save();glassPath();c.clip();
    c.fillStyle='rgba(255,255,255,.25)';c.fillRect(110,170,180,255);
    // 1px strips: layer boundary and marbling collapse to exactly the same final color.
    const {milk,coffee,latte}=CONFIG.palette;
    for(let y=201;y<421;y++) {
      const boundary=266 + Math.sin(angle*1.4+y*.035)*19*Math.sin(progress*Math.PI);
      const blend=Math.max(0,Math.min(1,(y-boundary)/Math.max(1,progress*78)+.5));
      const swirl=Math.sin(y*.12+angle*1.8)*Math.sin(progress*Math.PI)*.14;
      const rgb=milk.map((m,i)=>{
        const layered=coffee[i]*(1-blend)+m*blend;
        return Math.round(layered*(1-progress)+latte[i]*progress+swirl*(1-progress)*30);
      });
      c.fillStyle=`rgb(${rgb.join(',')})`;c.fillRect(110,y,180,1.5);
    }
    ellipse(200,204,82,21,`rgba(85,48,27,${.45*(1-progress)})`);
    // Submerged spoon: the same projected circular trajectory at every progress.
    const tipX=200+48*Math.cos(angle), tipY=282+17*Math.sin(angle);
    const handleX=221+40*Math.cos(angle), handleY=133+14*Math.sin(angle);
    c.strokeStyle='rgba(99,83,65,.45)';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(handleX,handleY);c.lineTo(tipX,tipY);c.stroke();
    ellipse(tipX,tipY,9,17,'rgba(171,166,151,.55)');
    // Static ice geometry prevents condition-specific decorative motion.
    [[150,211,-.23],[199,205,.12],[243,219,.28],[174,238,.12]].forEach(([x,y,r])=>{
      c.save();c.translate(x,y);c.rotate(r);c.fillStyle='rgba(255,255,255,.24)';c.strokeStyle='rgba(255,255,255,.48)';c.lineWidth=1.3;c.beginPath();c.roundRect(-20,-14,38,30,7);c.fill();c.stroke();c.beginPath();c.moveTo(-14,-8);c.lineTo(11,-8);c.stroke();c.restore();
    });
    const sheen=c.createLinearGradient(115,0,285,0);sheen.addColorStop(0,'rgba(255,255,255,.35)');sheen.addColorStop(.14,'rgba(255,255,255,.04)');sheen.addColorStop(.7,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(255,255,255,.27)');c.fillStyle=sheen;c.fillRect(110,180,180,250);
    c.restore();
    // Upper handle is drawn outside the glass clip.
    c.strokeStyle='#b9b5a8';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(handleX,handleY);c.lineTo(handleX+(tipX-handleX)*.45,handleY+(tipY-handleY)*.45);c.stroke();
    c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.7;c.beginPath();c.moveTo(handleX-1,handleY);c.lineTo(handleX+(tipX-handleX)*.45-1,handleY+(tipY-handleY)*.45);c.stroke();
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=2;glassPath();c.stroke();
    c.beginPath();c.ellipse(200,181,85,23,0,0,Math.PI*2);c.stroke();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=4;c.beginPath();c.moveTo(127,220);c.lineTo(141,388);c.stroke();
    c.beginPath();c.ellipse(200,402,63,14,0,0,Math.PI);c.stroke();
  }
  return { draw };
}
