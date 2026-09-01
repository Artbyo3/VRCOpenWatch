var cellWInput = document.getElementById('cellW');
var cellHInput = document.getElementById('cellH');
var fontFamilyInput = document.getElementById('fontFamily');
var fontSizeInput = document.getElementById('fontSize');
var textColorInput = document.getElementById('textColor');
var bgColorInput = document.getElementById('bgColor');
var transparentBgInput = document.getElementById('transparentBg');
var boldToggle = document.getElementById('boldToggle');
var italicToggle = document.getElementById('italicToggle');
var offsetXInput = document.getElementById('offsetX');
var offsetYInput = document.getElementById('offsetY');
var strokeToggle = document.getElementById('strokeToggle');
var strokeGroup = document.getElementById('strokeGroup');
var strokeColorInput = document.getElementById('strokeColor');
var strokeWidthInput = document.getElementById('strokeWidth');
var customFontFile = document.getElementById('customFontFile');
var customFontOption = document.getElementById('customFontOption');
var customFontStatus = document.getElementById('customFontStatus');
var canvas = document.getElementById('atlasCanvas');
var ctx = canvas.getContext('2d');
var liveClockEl = document.getElementById('liveClock');

strokeToggle.addEventListener('change', function() {
  strokeGroup.classList.toggle('open', this.checked);
});
strokeGroup.classList.toggle('open', strokeToggle.checked);

var moreOptionsToggle = document.getElementById('moreOptionsToggle');
var moreOptionsBody = document.getElementById('moreOptionsBody');
moreOptionsToggle.addEventListener('click', function() {
  var open = moreOptionsBody.classList.toggle('open');
  this.classList.toggle('open', open);
  this.setAttribute('aria-expanded', open);
});

var customFontFamilyName = null;
var customFontName = null;

customFontFile.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  customFontStatus.textContent = I18N[currentLang].loadingFont;
  var reader = new FileReader();
  reader.onload = function(ev) {
    customFontFamilyName = 'CustomUploadedFont';
    customFontName = file.name;
    var fontFace = new FontFace(customFontFamilyName, ev.target.result);
    fontFace.load().then(function(loaded) {
      document.fonts.add(loaded);
      customFontOption.disabled = false;
      customFontOption.textContent = I18N[currentLang].fontPrefix + file.name;
      fontFamilyInput.value = '__custom__';
      customFontStatus.textContent = I18N[currentLang].fontLoaded + ' ' + file.name;
      drawAtlas();
    }).catch(function() {
      customFontStatus.textContent = I18N[currentLang].fontError;
    });
  };
  reader.readAsArrayBuffer(file);
});

var ATLAS_CHARS = ['0','1','2','3','4','5','6','7','8','9',':','A','P','M',''];

function drawAtlas() {
  var cellW = parseInt(cellWInput.value) || 80;
  var cellH = parseInt(cellHInput.value) || 120;
  var fontSize = parseInt(fontSizeInput.value) || 70;
  var font = fontFamilyInput.value;
  if (font === '__custom__') {
    font = customFontFamilyName ? "'" + customFontFamilyName + "'" : "'Orbitron', sans-serif";
  }
  var textColor = textColorInput.value;
  var bgColor = bgColorInput.value;
  var transparent = transparentBgInput.checked;
  var weight = boldToggle.checked ? 700 : 400;
  var style = italicToggle.checked ? 'italic' : 'normal';
  var offX = parseInt(offsetXInput.value) || 0;
  var offY = parseInt(offsetYInput.value) || 0;
  var useStroke = strokeToggle.checked;
  var strokeColor = strokeColorInput.value;
  var strokeWidth = parseInt(strokeWidthInput.value) || 3;

  canvas.width = cellW * ATLAS_CHARS.length;
  canvas.height = cellH;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!transparent) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.font = style + ' ' + weight + ' ' + fontSize + 'px ' + font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  ATLAS_CHARS.forEach(function(ch, idx) {
    if (ch === '') return;
    var x = idx * cellW + cellW / 2 + offX;
    var y = cellH / 2 + offY;

    if (useStroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(ch, x, y);
    }
    ctx.fillStyle = textColor;
    ctx.fillText(ch, x, y);
  });
  if (typeof paintUvPreview === "function") paintUvPreview();
}

function clampInputs() {
  var w = parseInt(cellWInput.value);
  if (isNaN(w) || w < 16) cellWInput.value = 16;
  if (w > 512) cellWInput.value = 512;
  var h = parseInt(cellHInput.value);
  if (isNaN(h) || h < 16) cellHInput.value = 16;
  if (h > 512) cellHInput.value = 512;
  var fs = parseInt(fontSizeInput.value);
  if (isNaN(fs) || fs < 8) fontSizeInput.value = 8;
  if (fs > 480) fontSizeInput.value = 480;
  var sw = parseInt(strokeWidthInput.value);
  if (isNaN(sw) || sw < 1) strokeWidthInput.value = 1;
  if (sw > 20) strokeWidthInput.value = 20;
  var ox = parseInt(offsetXInput.value);
  if (isNaN(ox)) offsetXInput.value = 0;
  if (ox < -256) offsetXInput.value = -256;
  if (ox > 256) offsetXInput.value = 256;
  var oy = parseInt(offsetYInput.value);
  if (isNaN(oy)) offsetYInput.value = 0;
  if (oy < -256) offsetYInput.value = -256;
  if (oy > 256) offsetYInput.value = 256;
}

[cellWInput, cellHInput, fontFamilyInput, fontSizeInput, textColorInput, bgColorInput, transparentBgInput,
 boldToggle, italicToggle, offsetXInput, offsetYInput, strokeToggle, strokeColorInput, strokeWidthInput]
  .forEach(function(el) { el.addEventListener('input', function() { clampInputs(); drawAtlas(); updateLiveClock(); }); });

document.querySelectorAll('.color-pick').forEach(function(pick) {
  var hidden = pick.querySelector('input[type="color"]');
  var swatch = pick.querySelector('.swatch');
  var hex = pick.querySelector('.hex');
  pick.addEventListener('click', function(e) {
    if (e.target === hidden) return;
    hidden.click();
  });
  pick.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      hidden.click();
    }
  });
  hidden.addEventListener('input', function() {
    swatch.style.background = hidden.value;
    hex.textContent = hidden.value;
    drawAtlas();
    updateLiveClock();
  });
});

document.fonts.ready.then(drawAtlas);
drawAtlas();

function updateLiveClock() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  var s = String(now.getSeconds()).padStart(2, '0');
  liveClockEl.innerHTML = h + '<span class="colon">:</span>' + m + '<span class="colon">:</span>' + s;
  var font = fontFamilyInput.value;
  if (font === '__custom__') {
    font = customFontFamilyName ? "'" + customFontFamilyName + "'" : "'Orbitron', sans-serif";
  }
  liveClockEl.style.fontFamily = font;
  liveClockEl.style.color = textColorInput.value;
  if (typeof paintUvPreview === "function") paintUvPreview();
}
updateLiveClock();
setInterval(updateLiveClock, 1000);
/* ===== CLOCK: CUSTOM UV MAPPING ===== */
var clockMapping = 'strip';
var CLOCK_LAYOUTS = {
  0: ['H', 'H', ':', 'M', 'M', ':', 'S', 'S'],
  1: ['H', 'H', ':', 'M', 'M'],
  2: ['M', 'M', ':', 'S', 'S'],
  3: ['H', 'H', ':', 'M', 'M', '', 'P', 'M']
};
var uvSlots = [];
var uvSelected = new Set([0]);
var uvPrimary = 0;
var uvDrag = null;
var uvMarqueeDrag = null;
var uvRefLoaded = false;
var uvMarquee = document.getElementById('uvMarquee');

var mappingToggle = document.getElementById('mappingToggle');
var customUvFields = document.getElementById('customUvFields');
var uvMappingPanel = document.getElementById('uvMappingPanel');
var liveClockElWrap = liveClockEl;
var uvEditorStage = document.getElementById('uvEditorStage');
var uvEditorImg = document.getElementById('uvEditorImg');
var uvSlotLayer = document.getElementById('uvSlotLayer');
var uvPreviewCanvas = document.getElementById('uvPreviewCanvas');
var uvPreviewCtx = uvPreviewCanvas.getContext('2d');
var uvCoords = document.getElementById('uvCoords');
var uvRefFile = document.getElementById('uvRefFile');
var uvUploadZone = document.getElementById('uvUploadZone');
var clockFormatInput = document.getElementById('clockFormat');

function updateClockNote() {
  if (currentMode !== 'clock') return;
  var key = clockMapping === 'custom' ? 'customUvNote' : 'atlasNote';
  modeNote.setAttribute('data-i18n', key);
  modeNote.textContent = I18N[currentLang][key];
}

function setClockMapping(mode) {
  clockMapping = mode;
  mappingToggle.querySelectorAll('button').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-mapping') === mode);
  });
  customUvFields.style.display = mode === 'custom' ? '' : 'none';
  uvMappingPanel.style.display = mode === 'custom' ? '' : 'none';
  liveClockElWrap.style.display = mode === 'custom' ? 'none' : '';
  if (mode === 'custom') {
    if (!uvSlots.length) resetUvSlots();
    else renderUvSlots();
    paintUvPreview();
  }
  updateClockNote();
  refreshShaderPreview();
}

mappingToggle.addEventListener('click', function(e) {
  var btn = e.target.closest('button[data-mapping]');
  if (!btn) return;
  setClockMapping(btn.getAttribute('data-mapping'));
});

uvUploadZone.addEventListener('click', function() { uvRefFile.click(); });
uvUploadZone.addEventListener('dragover', function(e) { e.preventDefault(); uvUploadZone.classList.add('dragover'); });
uvUploadZone.addEventListener('dragleave', function() { uvUploadZone.classList.remove('dragover'); });
uvUploadZone.addEventListener('drop', function(e) {
  e.preventDefault();
  uvUploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) loadUvReference(e.dataTransfer.files[0]);
});
uvRefFile.addEventListener('change', function() {
  if (this.files[0]) loadUvReference(this.files[0]);
  this.value = '';
});

function loadUvReference(file) {
  if (!file || !file.type.startsWith('image/')) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    uvEditorImg.onload = function() {
      uvRefLoaded = true;
      uvEditorImg.classList.remove('is-hidden');
      uvEditorStage.classList.add('has-image');
      paintUvPreview();
    };
    uvEditorImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function defaultUvSlots(count) {
  var pad = 0.06;
  var gap = 0.012;
  var usable = 1 - pad * 2 - gap * (count - 1);
  var w = Math.max(0.02, usable / count);
  var list = [];
  for (var i = 0; i < count; i++) {
    list.push({
      uMin: pad + i * (w + gap),
      vMin: 0.38,
      uMax: pad + i * (w + gap) + w,
      vMax: 0.62
    });
  }
  return list;
}

function currentLayoutLabels() {
  return CLOCK_LAYOUTS[parseInt(clockFormatInput.value) || 0] || CLOCK_LAYOUTS[0];
}

function selectSlot(idx, isShift) {
  if (isShift) {
    if (uvSelected.has(idx)) {
      if (uvSelected.size > 1) {
        uvSelected.delete(idx);
        if (uvPrimary === idx) {
          uvPrimary = uvSelected.values().next().value;
        }
      }
    } else {
      uvSelected.add(idx);
      uvPrimary = idx;
    }
  } else {
    uvSelected.clear();
    uvSelected.add(idx);
    uvPrimary = idx;
  }
  renderUvSlots();
  updateUvCoords();
}

function selectAllSlots() {
  uvSelected.clear();
  uvSlots.forEach(function(_, idx) { uvSelected.add(idx); });
  uvPrimary = 0;
  renderUvSlots();
  updateUvCoords();
}

function resetUvSlots() {
  uvSlots = defaultUvSlots(currentLayoutLabels().length);
  uvSelected = new Set([0]);
  uvPrimary = 0;
  renderUvSlots();
  paintUvPreview();
  refreshShaderPreview();
}

function alignSelectedRow() {
  var total = uvSlots.length;
  if (total === 0) return;
  if (uvSelected.size <= 1) {
    selectAllSlots();
  }
  var selectedIndices = Array.from(uvSelected).sort(function(a, b) { return a - b; });
  if (selectedIndices.length <= 1) return;

  var avgCenterV = 0;
  var minU = 1;
  var maxU = 0;
  var totalW = 0;

  selectedIndices.forEach(function(i) {
    var s = uvSlots[i];
    avgCenterV += (s.vMin + s.vMax) / 2;
    if (s.uMin < minU) minU = s.uMin;
    if (s.uMax > maxU) maxU = s.uMax;
    totalW += (s.uMax - s.uMin);
  });
  avgCenterV /= selectedIndices.length;

  var N = selectedIndices.length;
  var gap = (maxU - minU > totalW) ? (maxU - minU - totalW) / (N - 1) : 0.012;
  var spanNeeded = totalW + gap * (N - 1);
  if (minU + spanNeeded > 1) {
    minU = Math.max(0, 1 - spanNeeded);
  }

  var currU = minU;
  selectedIndices.forEach(function(i) {
    var slot = uvSlots[i];
    var w = slot.uMax - slot.uMin;
    var h = slot.vMax - slot.vMin;
    slot.uMin = Math.max(0, Math.min(1 - w, currU));
    slot.uMax = slot.uMin + w;
    slot.vMin = Math.max(0, Math.min(1 - h, avgCenterV - h / 2));
    slot.vMax = slot.vMin + h;
    currU += w + gap;
  });

  renderUvSlots();
  paintUvPreview();
  refreshShaderPreview();
}

function equalSizeSelected() {
  var total = uvSlots.length;
  if (total === 0) return;
  if (uvSelected.size <= 1) {
    selectAllSlots();
  }
  var selectedIndices = Array.from(uvSelected);
  var refIdx = (uvPrimary !== undefined && uvSlots[uvPrimary]) ? uvPrimary : selectedIndices[0];
  var refSlot = uvSlots[refIdx];
  if (!refSlot) return;

  var refW = refSlot.uMax - refSlot.uMin;
  var refH = refSlot.vMax - refSlot.vMin;

  selectedIndices.forEach(function(i) {
    var slot = uvSlots[i];
    var cx = (slot.uMin + slot.uMax) / 2;
    var cy = (slot.vMin + slot.vMax) / 2;
    var uMin = Math.max(0, Math.min(1 - refW, cx - refW / 2));
    var vMin = Math.max(0, Math.min(1 - refH, cy - refH / 2));
    slot.uMin = uMin;
    slot.uMax = uMin + refW;
    slot.vMin = vMin;
    slot.vMax = vMin + refH;
  });

  renderUvSlots();
  paintUvPreview();
  refreshShaderPreview();
}

document.getElementById('uvResetBtn').addEventListener('click', resetUvSlots);
document.getElementById('uvSelectAllBtn').addEventListener('click', selectAllSlots);
document.getElementById('uvAlignRowBtn').addEventListener('click', alignSelectedRow);
document.getElementById('uvEqualSizeBtn').addEventListener('click', equalSizeSelected);

clockFormatInput.addEventListener('change', function() {
  resetUvSlots();
  refreshShaderPreview();
});

function slotStyle(slot) {
  return 'left:' + (slot.uMin * 100) + '%;bottom:' + (slot.vMin * 100) + '%;width:' + ((slot.uMax - slot.uMin) * 100) + '%;height:' + ((slot.vMax - slot.vMin) * 100) + '%;';
}

function renderUvSlots() {
  var labels = currentLayoutLabels();
  uvSlotLayer.innerHTML = '';
  uvSlots.forEach(function(slot, idx) {
    var isSel = uvSelected.has(idx);
    var isPrim = (idx === uvPrimary);
    var el = document.createElement('div');
    el.className = 'uv-slot' + (isSel ? ' selected' : '') + (isPrim ? ' primary' : '');
    el.setAttribute('data-idx', idx);
    el.setAttribute('style', slotStyle(slot));
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'UV slot ' + (idx + 1) + ' ' + (labels[idx] || ''));

    var lab = document.createElement('span');
    lab.className = 'uv-slot-label';
    lab.textContent = labels[idx] === '' ? '·' : (labels[idx] || String(idx + 1));

    var handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'uv-resize';
    handle.setAttribute('aria-label', 'Resize slot ' + (idx + 1));

    el.appendChild(lab);
    el.appendChild(handle);

    el.addEventListener('pointerdown', function(e) {
      if (e.target === handle) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        selectSlot(idx, true);
      } else {
        if (!uvSelected.has(idx)) {
          selectSlot(idx, false);
        } else {
          uvPrimary = idx;
          updateUvCoords();
        }
      }

      var r = uvEditorStage.getBoundingClientRect();
      var items = [];
      uvSelected.forEach(function(sIdx) {
        if (uvSlots[sIdx]) {
          items.push({
            idx: sIdx,
            orig: Object.assign({}, uvSlots[sIdx])
          });
        }
      });

      uvDrag = {
        type: 'move',
        primaryIdx: idx,
        startX: e.clientX,
        startY: e.clientY,
        stageW: r.width,
        stageH: r.height,
        items: items
      };
      el.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!uvSelected.has(idx)) {
        selectSlot(idx, false);
      } else {
        uvPrimary = idx;
      }
      var r = uvEditorStage.getBoundingClientRect();
      uvDrag = {
        type: 'resize',
        idx: idx,
        startX: e.clientX,
        startY: e.clientY,
        orig: Object.assign({}, uvSlots[idx]),
        stageW: r.width,
        stageH: r.height
      };
      handle.setPointerCapture(e.pointerId);
    });

    uvSlotLayer.appendChild(el);
  });
  updateUvCoords();
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

uvEditorStage.addEventListener('pointerdown', function(e) {
  if (e.target.closest('.uv-slot') || e.target.closest('.uv-resize')) return;
  e.preventDefault();

  var r = uvEditorStage.getBoundingClientRect();
  var startStageX = e.clientX - r.left;
  var startStageY = e.clientY - r.top;
  var initialSelection = e.shiftKey ? new Set(uvSelected) : new Set();

  uvMarqueeDrag = {
    startX: startStageX,
    startY: startStageY,
    stageW: r.width,
    stageH: r.height,
    initialSelection: initialSelection
  };

  uvMarquee.style.display = 'block';
  uvMarquee.style.left = startStageX + 'px';
  uvMarquee.style.top = startStageY + 'px';
  uvMarquee.style.width = '0px';
  uvMarquee.style.height = '0px';

  uvEditorStage.setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', function(e) {
  if (uvMarqueeDrag) {
    var r = uvEditorStage.getBoundingClientRect();
    var currStageX = Math.max(0, Math.min(uvMarqueeDrag.stageW, e.clientX - r.left));
    var currStageY = Math.max(0, Math.min(uvMarqueeDrag.stageH, e.clientY - r.top));

    var minX = Math.min(uvMarqueeDrag.startX, currStageX);
    var maxX = Math.max(uvMarqueeDrag.startX, currStageX);
    var minY = Math.min(uvMarqueeDrag.startY, currStageY);
    var maxY = Math.max(uvMarqueeDrag.startY, currStageY);

    uvMarquee.style.left = minX + 'px';
    uvMarquee.style.top = minY + 'px';
    uvMarquee.style.width = (maxX - minX) + 'px';
    uvMarquee.style.height = (maxY - minY) + 'px';

    var m_uMin = minX / uvMarqueeDrag.stageW;
    var m_uMax = maxX / uvMarqueeDrag.stageW;
    var m_vMin = (uvMarqueeDrag.stageH - maxY) / uvMarqueeDrag.stageH;
    var m_vMax = (uvMarqueeDrag.stageH - minY) / uvMarqueeDrag.stageH;

    var newSelection = new Set(uvMarqueeDrag.initialSelection);
    uvSlots.forEach(function(slot, idx) {
      var intersects = !(slot.uMax < m_uMin || slot.uMin > m_uMax || slot.vMax < m_vMin || slot.vMin > m_vMax);
      if (intersects) {
        newSelection.add(idx);
      }
    });

    if (newSelection.size > 0) {
      uvSelected = newSelection;
      if (!uvSelected.has(uvPrimary)) {
        uvPrimary = uvSelected.values().next().value;
      }
    }

    uvSlotLayer.querySelectorAll('.uv-slot').forEach(function(slotEl) {
      var sIdx = parseInt(slotEl.getAttribute('data-idx'));
      slotEl.classList.toggle('selected', uvSelected.has(sIdx));
      slotEl.classList.toggle('primary', sIdx === uvPrimary);
    });
    updateUvCoords();
    return;
  }

  if (!uvDrag) return;

  var dx = (e.clientX - uvDrag.startX) / uvDrag.stageW;
  var dy = (uvDrag.startY - e.clientY) / uvDrag.stageH;

  if (uvDrag.type === 'move') {
    var minDx = -1, maxDx = 1, minDy = -1, maxDy = 1;
    uvDrag.items.forEach(function(item) {
      var o = item.orig;
      var maxLeft = -o.uMin;
      var maxRight = 1 - o.uMax;
      var maxDown = -o.vMin;
      var maxUp = 1 - o.vMax;
      if (maxLeft > minDx) minDx = maxLeft;
      if (maxRight < maxDx) maxDx = maxRight;
      if (maxDown > minDy) minDy = maxDown;
      if (maxUp < maxDy) maxDy = maxUp;
    });

    var clampedDx = Math.max(minDx, Math.min(maxDx, dx));
    var clampedDy = Math.max(minDy, Math.min(maxDy, dy));

    uvDrag.items.forEach(function(item) {
      var slot = uvSlots[item.idx];
      var o = item.orig;
      slot.uMin = o.uMin + clampedDx;
      slot.uMax = o.uMax + clampedDx;
      slot.vMin = o.vMin + clampedDy;
      slot.vMax = o.vMax + clampedDy;
      var slotEl = uvSlotLayer.querySelector('[data-idx="' + item.idx + '"]');
      if (slotEl) slotEl.setAttribute('style', slotStyle(slot));
    });
  } else if (uvDrag.type === 'resize') {
    var minSize = 0.02;
    var slot = uvSlots[uvDrag.idx];
    var o = uvDrag.orig;
    slot.uMax = Math.max(o.uMin + minSize, Math.min(1, o.uMax + dx));
    slot.vMin = Math.min(o.vMax - minSize, Math.max(0, o.vMin + dy));
    var slotEl = uvSlotLayer.querySelector('[data-idx="' + uvDrag.idx + '"]');
    if (slotEl) slotEl.setAttribute('style', slotStyle(slot));
  }

  updateUvCoords();
  paintUvPreview();
});

window.addEventListener('pointerup', function(e) {
  if (uvMarqueeDrag) {
    uvMarquee.style.display = 'none';
    if (uvSelected.size === 0) {
      uvSelected.add(0);
      uvPrimary = 0;
    }
    uvMarqueeDrag = null;
    renderUvSlots();
    refreshShaderPreview();
    return;
  }
  if (!uvDrag) return;
  uvDrag = null;
  refreshShaderPreview();
});

window.addEventListener('keydown', function(e) {
  if (clockMapping !== 'custom') return;
  if (['INPUT', 'SELECT', 'TEXTAREA'].indexOf(e.target.tagName) !== -1) return;

  var step = e.shiftKey ? 0.01 : (e.altKey ? 0.0005 : 0.002);
  var du = 0, dv = 0;
  if (e.key === 'ArrowLeft') du = -step;
  else if (e.key === 'ArrowRight') du = step;
  else if (e.key === 'ArrowUp') dv = step;
  else if (e.key === 'ArrowDown') dv = -step;
  else return;

  e.preventDefault();

  var minDu = -1, maxDu = 1, minDv = -1, maxDv = 1;
  uvSelected.forEach(function(idx) {
    var slot = uvSlots[idx];
    if (!slot) return;
    if (-slot.uMin > minDu) minDu = -slot.uMin;
    if (1 - slot.uMax < maxDu) maxDu = 1 - slot.uMax;
    if (-slot.vMin > minDv) minDv = -slot.vMin;
    if (1 - slot.vMax < maxDv) maxDv = 1 - slot.vMax;
  });

  var clampedDu = Math.max(minDu, Math.min(maxDu, du));
  var clampedDv = Math.max(minDv, Math.min(maxDv, dv));

  uvSelected.forEach(function(idx) {
    var slot = uvSlots[idx];
    if (!slot) return;
    slot.uMin += clampedDu;
    slot.uMax += clampedDu;
    slot.vMin += clampedDv;
    slot.vMax += clampedDv;
    var slotEl = uvSlotLayer.querySelector('[data-idx="' + idx + '"]');
    if (slotEl) slotEl.setAttribute('style', slotStyle(slot));
  });

  updateUvCoords();
  paintUvPreview();
  refreshShaderPreview();
});

function updateUvCoords() {
  if (uvSelected.size === 1) {
    var idx = uvSelected.values().next().value;
    var s = uvSlots[idx];
    var labels = currentLayoutLabels();
    var label = labels[idx] === '' ? '·' : (labels[idx] || '#' + (idx + 1));
    if (!s) { uvCoords.textContent = ''; return; }
    uvCoords.textContent = '#' + (idx + 1) + ' [' + label + ']  U ' + s.uMin.toFixed(3) + '\u2013' + s.uMax.toFixed(3) + '  V ' + s.vMin.toFixed(3) + '\u2013' + s.vMax.toFixed(3);
  } else if (uvSelected.size > 1) {
    var countText = (I18N[currentLang] && I18N[currentLang].slotsSelected) ?
      I18N[currentLang].slotsSelected.replace('{n}', uvSelected.size) :
      (uvSelected.size + ' slots selected');
    uvCoords.textContent = countText;
  } else {
    uvCoords.textContent = '';
  }
}

function currentTimeCharIndices() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var fmt = parseInt(clockFormatInput.value) || 0;
  if (fmt === 0) {
    return [Math.floor(hours / 10), hours % 10, 10, Math.floor(minutes / 10), minutes % 10, 10, Math.floor(seconds / 10), seconds % 10];
  }
  if (fmt === 1) {
    return [Math.floor(hours / 10), hours % 10, 10, Math.floor(minutes / 10), minutes % 10];
  }
  if (fmt === 2) {
    return [Math.floor(minutes / 10), minutes % 10, 10, Math.floor(seconds / 10), seconds % 10];
  }
  var h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  return [Math.floor(h12 / 10), h12 % 10, 10, Math.floor(minutes / 10), minutes % 10, 14, hours >= 12 ? 12 : 11, 13];
}

function paintUvPreview() {
  if (clockMapping !== 'custom' || !uvPreviewCanvas) return;
  var w = uvEditorStage.clientWidth;
  var h = uvEditorStage.clientHeight;
  if (w < 2 || h < 2) return;
  uvPreviewCanvas.width = w;
  uvPreviewCanvas.height = h;
  uvPreviewCtx.clearRect(0, 0, w, h);
  if (!canvas.width) return;
  var chars = currentTimeCharIndices();
  var cellW = canvas.width / ATLAS_CHARS.length;
  uvSlots.forEach(function(slot, i) {
    var ci = chars[i];
    if (ci === undefined) return;
    var x = slot.uMin * w;
    var y = (1 - slot.vMax) * h;
    var sw = (slot.uMax - slot.uMin) * w;
    var sh = (slot.vMax - slot.vMin) * h;
    uvPreviewCtx.globalAlpha = 0.92;
    uvPreviewCtx.drawImage(canvas, ci * cellW, 0, cellW, canvas.height, x, y, sw, sh);
  });
}

window.addEventListener('resize', function() {
  if (clockMapping === 'custom') paintUvPreview();
});