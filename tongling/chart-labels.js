/* 全站图表统一数值 + 单位标注（Chart.js 4） */
(function () {
  if (typeof Chart === 'undefined') return;

  var FONT = '700 9.5px "Microsoft YaHei","PingFang SC",system-ui,sans-serif';
  var FONT_UNIT = '600 8.5px "Microsoft YaHei","PingFang SC",system-ui,sans-serif';
  var COLOR = '#334155';

  function num(v, unit) {
    if (v === null || v === undefined || isNaN(v)) return '';
    var av = Math.abs(v), d;
    if (unit === '%') {
      d = av >= 100 ? 0 : 2;
    } else if (unit === '万元' || unit === '万㎡') {
      d = av >= 10000 ? 0 : (av >= 100 ? 1 : 2);
    } else {
      d = Number.isInteger(v) ? 0 : 1;
    }
    return Number(v).toLocaleString('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: d
    });
  }

  function hasMixedUnits(t) {
    return /人[员数]?\s*[\/、与和及]\s*车辆?|车辆?\s*[\/、与和及]\s*人[员数]?/.test(t);
  }

  function parseUnit(text) {
    if (text === null || text === undefined) return '';
    var t = String(text);
    if (hasMixedUnits(t)) return '';
    if (/%/.test(t)) return '%';
    if (/万㎡/.test(t)) return '万㎡';
    if (/㎡/.test(t)) return '㎡';
    if (/万元/.test(t)) return '万元';
    if (/部\s*\/\s*套/.test(t)) return '部/套';
    if (/部\s*\/\s*台/.test(t)) return '部/台';
    if (/辆/.test(t)) return '辆';
    if (/部|台/.test(t)) return '部';
    if (/人/.test(t)) return '人';
    if (/元/.test(t)) return '元';
    return '';
  }

  function unitFromLabel(label) {
    if (label === null || label === undefined) return '';
    var t = String(label);
    if (/%/.test(t)) return '%';
    if (/万元/.test(t)) return '万元';
    if (/万㎡/.test(t)) return '万㎡';
    if (/㎡/.test(t)) return '㎡';
    if (/车辆数|车辆/.test(t)) return '辆';
    if (/人员|人数/.test(t)) return '人';
    return '';
  }

  function unitFromDatasetLabel(label) {
    if (label === null || label === undefined) return '';
    var t = String(label);
    if (/%/.test(t)) return '%';
    if (/万元/.test(t)) return '万元';
    if (/万㎡/.test(t)) return '万㎡';
    if (/㎡/.test(t)) return '㎡';
    if (/人数|人员/.test(t)) return '人';
    if (/车辆数|车辆/.test(t)) return '辆';
    if (/金额/.test(t)) return '万元';
    return '';
  }

  function unitFromCategoryLabel(label) {
    if (label === null || label === undefined) return '';
    var t = String(label);
    if (/^人员/.test(t)) return '人';
    if (/^车辆/.test(t)) return '辆';
    var m = t.match(/(\d[\d,.]*)\s*(万元|万㎡|㎡|人|辆|部|台)/);
    return m ? m[2] : '';
  }

  function resolveUnit(chart, ds, di, dataIndex, skipLabels) {
    var canvas = chart.canvas;
    var unitsAttr = canvas.getAttribute('data-units');
    if (unitsAttr) {
      var arr = unitsAttr.split(',');
      var a = (arr[di] || arr[0] || '').trim();
      if (a) return a;
    }
    var attr = canvas.getAttribute('data-unit');
    if (attr) return attr.trim();
    if (ds.unit) return ds.unit;
    var u = unitFromDatasetLabel(ds.label);
    if (u) return u;

    var scales = chart.options.scales || {};
    var scaleId = chart.options.indexAxis === 'y' ? 'x' : (ds.yAxisID || 'y');
    var sc = scales[scaleId];
    if (sc) {
      u = parseUnit(sc.title && sc.title.text);
      if (u) return u;
      var cb = sc.ticks && sc.ticks.callback;
      if (cb) {
        try {
          u = parseUnit(String(cb));
          if (u) return u;
        } catch (e) { /* ignore */ }
      }
    }

    var box = null;
    if (canvas.closest) {
      box = canvas.closest('.chart-box');
      if (!box) box = canvas.closest('.card');
    }
    if (box) {
      var h = box.querySelector('h4,h3');
      if (h) {
        u = parseUnit(h.textContent);
        if (u) return u;
      }
    }

    if (!skipLabels) {
      if (dataIndex !== undefined) {
        var lab = chart.data.labels && chart.data.labels[dataIndex];
        u = unitFromLabel(lab);
        if (u) return u;
      }
      var labels = chart.data.labels || [];
      for (var i = 0; i < labels.length; i++) {
        u = unitFromLabel(labels[i]);
        if (u) return u;
      }
    }
    return '';
  }

  function textFor(v, unit, fullUnit) {
    var s = num(v, unit);
    if (!s) return s;
    if (unit === '%') return s + '%';
    if (fullUnit && unit) return s + ' ' + unit;
    if (unit === '人' || unit === '部' || unit === '辆' || unit === '台' || unit === '㎡') {
      return s + ' ' + unit;
    }
    return s;
  }

  function compactNum(v, unit) {
    var av = Math.abs(v), d;
    if (unit === '%') {
      d = av >= 10 ? 1 : 2;
    } else if (unit === '万元' || unit === '万㎡') {
      d = av >= 1000 ? 0 : (av >= 100 ? 1 : 2);
    } else {
      d = Number.isInteger(v) ? 0 : 1;
    }
    return Number(v).toLocaleString('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: d
    });
  }

  function textCompact(v, unit, fullUnit) {
    var s = compactNum(v, unit);
    if (!s) return s;
    if (unit === '%') return s + '%';
    if (fullUnit && unit) return s + ' ' + unit;
    if (unit === '人' || unit === '部' || unit === '辆' || unit === '台' || unit === '㎡') {
      return s + ' ' + unit;
    }
    return s;
  }

  function luminance(color) {
    if (!color) return 0.5;
    var c = String(color);
    var r, g, b;
    var m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
      r = +m[1]; g = +m[2]; b = +m[3];
    } else if (c.charAt(0) === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    } else {
      return 0.5;
    }
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function drawLabel(ctx, text, x, y, align, baseline, rotate) {
    if (!text) return;
    ctx.save();
    ctx.font = FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = baseline || 'bottom';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.fillStyle = COLOR;
    if (rotate) {
      ctx.translate(x, y);
      ctx.rotate(rotate);
      x = 0; y = 0;
    }
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawBars(chart, ds, di, meta, ctx, area) {
    if (ds.valueLabels === false) return;
    var horizontal = chart.options.indexAxis === 'y';
    var scales = chart.options.scales || {};
    var stacked = !!(scales.y && scales.y.stacked) || !!(scales.x && scales.x.stacked);

    for (var i = 0; i < meta.data.length; i++) {
      var el = meta.data[i];
      if (!el) continue;
      var raw = ds.data[i];
      var v = (raw && typeof raw === 'object') ? raw.y : raw;
      v = Number(v);
      if (!isFinite(v)) continue;

      var unit = resolveUnit(chart, ds, di, i);
      var text = textFor(v, unit, horizontal || stacked);

      if (horizontal) {
        var bh = Math.abs(el.height || 0);
        if (bh < 7) continue;
        ctx.save();
        ctx.font = FONT;
        var tw0 = ctx.measureText(text).width;
        ctx.restore();
        var positive = v >= 0;
        var lx = positive ? el.x + 4 : el.x - 4;
        var align = positive ? 'left' : 'right';
        if (positive && lx + tw0 > area.right - 2) { lx = el.x - 4; align = 'right'; }
        if (!positive && lx - tw0 < area.left + 2) { lx = el.x + 4; align = 'left'; }
        drawLabel(ctx, text, lx, el.y, align, 'middle', 0);
        continue;
      }

      var top = Math.min(el.y, el.base);
      var bottom = Math.max(el.y, el.base);
      var h = bottom - top;
      var w = Math.abs(el.width || 0);
      if (h < 5) {
        if (v !== 0) {
          var tinyUp = v >= 0;
          drawLabel(ctx, text, el.x, tinyUp ? top - 3 : bottom + 12,
            'center', tinyUp ? 'bottom' : 'top', 0);
        }
        continue;
      }

      if (stacked) {
        if (h < 14) continue;
        drawLabel(ctx, text, el.x, top + h / 2 + 3, 'center', 'middle', 0);
        continue;
      }

      if (h < 24 && w > 0 && w < 30) {
        var iy = el.y - 4, ib = 'bottom';
        if (iy < area.top + 10) { iy = el.y + 11; ib = 'top'; }
        drawLabel(ctx, text, el.x, iy, 'center', ib, 0);
        continue;
      }

      if (v < 0) {
        var ny = h >= 18 ? el.y - 6 : el.base + 11;
        drawLabel(ctx, text, el.x, ny, 'center', h >= 18 ? 'bottom' : 'top', 0);
        continue;
      }

      var ly = el.y - 4;
      var lb = 'bottom';
      if (ly < area.top + 9) { ly = el.y + 12; lb = 'top'; }

      ctx.save();
      ctx.font = FONT;
      var tw = ctx.measureText(text).width;
      ctx.restore();

      if (w > 0 && tw > w - 2) {
        var ctext = textCompact(v, unit, false);
        var ctw = 0;
        if (ctext !== text) {
          ctx.save();
          ctx.font = FONT;
          ctw = ctx.measureText(ctext).width;
          ctx.restore();
        }
        if (ctext !== text && ctw <= w - 2) {
          drawLabel(ctx, ctext, el.x, ly, 'center', lb, 0);
        } else if (w < 34) {
          if (el.y - 6 - tw > area.top + 2) {
            drawLabel(ctx, text, el.x, el.y - 4, 'left', 'middle', -Math.PI / 2);
          } else {
            drawLabel(ctx, text, el.x, el.y + 5, 'right', 'middle', -Math.PI / 2);
          }
        } else {
          drawLabel(ctx, text, el.x + w / 2 - 1, ly, 'right', lb, -Math.PI / 3);
        }
      } else {
        drawLabel(ctx, text, el.x, ly, 'center', lb, 0);
      }
    }
  }

  function chartHasBars(chart) {
    var list = chart.data.datasets || [];
    for (var i = 0; i < list.length; i++) {
      var m = chart.getDatasetMeta(i);
      if (m && !m.hidden && (m.type || (chart.config && chart.config.type)) === 'bar') return true;
    }
    return false;
  }

  function barHalfWidth(chart, idx) {
    var list = chart.data.datasets || [];
    for (var i = 0; i < list.length; i++) {
      var m = chart.getDatasetMeta(i);
      if (!m || m.hidden) continue;
      var t = m.type || (chart.config && chart.config.type);
      if (t !== 'bar') continue;
      var el = m.data && m.data[idx];
      if (el && el.width) return Math.abs(el.width) / 2;
    }
    return 0;
  }

  function drawLine(chart, ds, di, meta, ctx, area) {
    if (ds.valueLabels === false) return;
    if (ds.borderDash && ds.borderDash.length && !ds.pointRadius) return;
    var mixed = chartHasBars(chart);
    var opts = (chart.options.plugins && chart.options.plugins.valueLabels) || {};
    var placeTop = opts.linePlacement === 'top';
    for (var i = 0; i < meta.data.length; i++) {
      var el = meta.data[i];
      if (!el) continue;
      var raw = ds.data[i];
      var v = (raw && typeof raw === 'object') ? raw.y : raw;
      v = Number(v);
      if (!isFinite(v)) continue;
      var unit = resolveUnit(chart, ds, di, i);
      var text = textFor(v, unit, true);
      if (mixed && !placeTop) {
        ctx.save();
        ctx.font = FONT;
        var tw = ctx.measureText(text).width;
        ctx.restore();
        var half = barHalfWidth(chart, i);
        var gap = half ? half + 5 : 8;
        var lx = el.x + gap, align = 'left';
        if (lx + tw > area.right - 2) { lx = el.x - gap; align = 'right'; }
        drawLabel(ctx, text, lx, el.y, align, 'middle', 0);
        continue;
      }
      var y = el.y - 8;
      var baseline = 'bottom';
      if (y < area.top + 10) { y = el.y + 8; baseline = 'top'; }
      drawLabel(ctx, text, el.x, y, 'center', baseline, 0);
    }
  }

  function drawDoughnut(chart, ds, di, meta, ctx) {
    for (var i = 0; i < meta.data.length; i++) {
      var arc = meta.data[i];
      if (!arc) continue;
      var v = Number(ds.data[i]);
      if (!isFinite(v)) continue;
      var angle = Math.abs((arc.endAngle || 0) - (arc.startAngle || 0));
      if (angle < Math.PI * 2 * 0.03) continue;
      var unit = resolveUnit(chart, ds, di, i);
      var mid = ((arc.startAngle || 0) + (arc.endAngle || 0)) / 2;
      var r = ((arc.innerRadius || 0) + (arc.outerRadius || 0)) / 2;
      var x = arc.x + Math.cos(mid) * r;
      var y = arc.y + Math.sin(mid) * r;
      var bg = ds.backgroundColor;
      var color = luminance(bg && bg[i]) > 0.66 ? '#1e293b' : '#ffffff';
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.font = FONT;
      ctx.fillText(num(v, unit), x, y - 5);
      if (unit) {
        ctx.globalAlpha = 0.92;
        ctx.font = FONT_UNIT;
        ctx.fillText(unit, x, y + 7);
      }
      ctx.restore();
    }
  }

  function collectUnits(chart) {
    var out = [], seen = {};
    function add(u) {
      if (u && !seen[u]) { seen[u] = 1; out.push(u); }
    }
    (chart.data.datasets || []).forEach(function (ds, di) {
      add(resolveUnit(chart, ds, di, undefined, true));
    });
    if (!out.length) {
      (chart.data.labels || []).forEach(function (lab) {
        add(unitFromCategoryLabel(lab));
      });
    }
    return out;
  }

  function addUnitTag(chart) {
    var canvas = chart.canvas;
    if (!canvas || !canvas.parentNode) return;
    var card = canvas.closest ? (canvas.closest('.card') || canvas.closest('.chart-box')) : null;
    if (card) {
      var badges = card.querySelectorAll('.badge');
      for (var bi = 0; bi < badges.length; bi++) {
        if (/单位/.test(badges[bi].textContent)) return;
      }
    }
    var units = collectUnits(chart);
    if (!units.length) return;
    var text = '单位：' + units.join(' / ');
    var host = canvas.closest ? (canvas.closest('.cv') || canvas.closest('.chart-container')) : null;
    if (!host) host = canvas;
    var prev = host.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('chart-unit-tag')) {
      if (prev.textContent !== text) prev.textContent = text;
      return;
    }
    var tag = document.createElement('div');
    tag.className = 'chart-unit-tag';
    tag.textContent = text;
    host.parentNode.insertBefore(tag, host);
  }

  if (!document.getElementById('chartUnitTagStyle')) {
    var style = document.createElement('style');
    style.id = 'chartUnitTagStyle';
    style.textContent = '.chart-unit-tag{font-size:.72rem;line-height:1.2;color:#64748b;text-align:right;margin:-4px 0 6px;font-weight:500;letter-spacing:.2px}';
    (document.head || document.documentElement).appendChild(style);
  }

  Chart.register({
    id: 'valueLabels',
    afterInit: function (chart) {
      try { addUnitTag(chart); } catch (e) { /* ignore */ }
    },
    afterDatasetsDraw: function (chart) {
      var opts = (chart.options.plugins && chart.options.plugins.valueLabels) || {};
      if (opts.display === false) return;
      var ctx = chart.ctx, area = chart.chartArea;
      if (!ctx || !area) return;
      (chart.data.datasets || []).forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (!meta || meta.hidden) return;
        var type = meta.type || (chart.config && chart.config.type);
        if (type === 'bar') drawBars(chart, ds, di, meta, ctx, area);
        else if (type === 'line') drawLine(chart, ds, di, meta, ctx, area);
        else if (type === 'doughnut' || type === 'pie') drawDoughnut(chart, ds, di, meta, ctx);
      });
    }
  });
})();


/* 图表自适应刷新：页面完成布局后统一重绘，避免初始化早于布局导致空白 */
;(function(){
  if (window.__chartAutoRefresh) return;
  window.__chartAutoRefresh = 1;
  function refreshCharts(){
    try{
      if (!window.Chart || typeof Chart.getChart !== 'function') return;
      var nodes = document.querySelectorAll('canvas');
      for (var i = 0; i < nodes.length; i++) {
        var ch = Chart.getChart(nodes[i]);
        if (!ch) continue;
        try { ch.resize(); ch.update(); } catch (e) { /* 单图失败不影响其他图 */ }
      }
    }catch(e){}
  }
  function scheduleRefresh(){
    refreshCharts();
    setTimeout(refreshCharts, 120);
    setTimeout(refreshCharts, 600);
    setTimeout(refreshCharts, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRefresh);
  else scheduleRefresh();
  window.addEventListener('load', scheduleRefresh);
  document.addEventListener('click', function(){ setTimeout(refreshCharts, 260); }, true);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) setTimeout(refreshCharts, 150); });
})();
