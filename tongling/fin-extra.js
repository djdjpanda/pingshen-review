(function(){
  if(!window.Chart)return;
  var Orig=window.Chart;
  var INST=[];
  function num(v){return (typeof v==='number'&&isFinite(v))?v:(v==null?null:parseFloat(String(v).replace(/[,\s]/g,'')));}
  function shift(cfg){
    try{
      var d=cfg&&cfg.data;if(!d||!d.datasets||!d.datasets.length)return;
      var ds=d.datasets;
      var net=null,rev=null,margin=null,cost=null;
      ds.forEach(function(x){
        var l=String(x.label||'');
        if(/成本|费用合计/.test(l))cost=x;
        else if(/收入|营收|营业额/.test(l)&&x.type!=='line')rev=x;
        else if(/净利润|利润/.test(l)&&!/率/.test(l)&&x.type!=='line')net=x;
        else if(/率/.test(l)&&x.type==='line')margin=x;
      });
      if(cost||!net)return;
      var n=(net.data||[]).map(num);
      var r=rev?((rev.data||[]).map(num)):null;
      if(!r&&margin){
        r=n.map(function(v,i){
          var m=num((margin.data||[])[i]);
          if(v==null||!m)return null;
          return Math.round(Math.abs(v/(m/100))*100)/100;
        });
        if(!r.every(function(x){return x==null;})){
          rev={type:'bar',label:'收入（万元）',data:r,backgroundColor:'rgba(79,110,247,0.65)',borderRadius:6};
          ds.splice(ds.indexOf(net),0,rev);
        }
      }
      if(!r||r.every(function(x){return x==null;}))return;
      r=r.map(function(v){return v==null?null:Math.abs(v);});
      if(rev)rev.data=r;
      var c=r.map(function(v,i){return (v==null||n[i]==null)?null:Math.round(Math.abs(v-n[i])*100)/100;});
      var item={type:'bar',label:'成本及费用（万元）',data:c,backgroundColor:'rgba(148,163,184,0.8)',borderRadius:6};
      ds.splice(ds.indexOf(net)+1,0,item);
    }catch(e){}
  }
  try{ Orig.defaults.animation=false; }catch(e){}
  window.Chart=new Proxy(Orig,{
    construct:function(t,args){
      try{ shift(args&&args[1]); }catch(e){}
      var inst=Reflect.construct(t,args);
      try{INST.push(inst);}catch(e){}
      return inst;
    }
  });
  function vis(el){var r=el.getBoundingClientRect();return r.width>60&&r.height>40;}
  function fix(){
    for(var i=INST.length-1;i>=0;i--){
      var c=INST[i];
      try{
        if(!c||!c.canvas){INST.splice(i,1);continue;}
        var cv=c.canvas,host=cv.parentElement;
        if(!vis(cv))continue;
        var hw=cv.clientWidth||(host?host.clientWidth:0);
        var hh=cv.clientHeight||(host?host.clientHeight:0);
        if(hw<40||hh<30)continue;
        if(cv.width<40||cv.height<30||Math.abs(cv.width-hw)>4||Math.abs(cv.height-hh)>4){
          c.resize();c.update('none');
        }
      }catch(e){}
    }
  }
  function boot(){
    fix();
    setTimeout(fix,80);setTimeout(fix,300);setTimeout(fix,800);
    document.addEventListener('click',function(){setTimeout(fix,120);setTimeout(fix,450);},true);
    window.addEventListener('resize',function(){setTimeout(fix,100);});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(fix,100);});
    setInterval(fix,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
