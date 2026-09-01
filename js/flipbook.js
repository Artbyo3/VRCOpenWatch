/* ===== FLIPBOOK: STATE ===== */
var flipbookFrames = [];
var flipbookAnimPlaying = false;
var flipbookAnimId = null;
var flipbookAnimTime = 0;
var flipbookLastFrameTime = 0;

/* ===== FLIPBOOK: INPUT MODE TOGGLE ===== */
var inputModeToggle = document.getElementById('inputModeToggle');
var framesInput = document.getElementById('framesInput');
var sheetInput = document.getElementById('sheetInput');
inputModeToggle.addEventListener('click', function(e) {
  var btn = e.target.closest('button[data-input]');
  if (!btn) return;
  inputModeToggle.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var mode = btn.getAttribute('data-input');
  framesInput.style.display = mode === 'frames' ? '' : 'none';
  sheetInput.style.display = mode === 'sheet' ? '' : 'none';
});

/* ===== FLIPBOOK: FILE UPLOAD (FRAMES) ===== */
var frameFileInput = document.getElementById('frameFileInput');
var uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('click', function() { frameFileInput.click(); });
uploadZone.addEventListener('dragover', function(e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', function() { uploadZone.classList.remove('dragover'); });
uploadZone.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  addFrameFiles(e.dataTransfer.files);
});
frameFileInput.addEventListener('change', function() { addFrameFiles(this.files); this.value = ''; });

function addFrameFiles(files) {
  var arr = Array.from(files).filter(function(f) { return f.type.startsWith('image/'); });
  var loaded = 0;
  arr.forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = new Image();
      img.onload = function() {
        flipbookFrames.push({ src: ev.target.result, img: img, name: file.name });
        loaded++;
        if (loaded === arr.length) {
          sortFrames();
          renderFrameStrip();
          stitchFlipbookAtlas();
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function sortFrames() {
  flipbookFrames.sort(function(a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
}

/* ===== FLIPBOOK: SPRITE SHEET SLICE ===== */
var sheetFileInput = document.getElementById('sheetFileInput');
var sheetUploadZone = document.getElementById('sheetUploadZone');
var sheetColsInput = document.getElementById('sheetCols');
var sheetRowsInput = document.getElementById('sheetRows');

sheetUploadZone.addEventListener('click', function() { sheetFileInput.click(); });
sheetUploadZone.addEventListener('dragover', function(e) { e.preventDefault(); sheetUploadZone.classList.add('dragover'); });
sheetUploadZone.addEventListener('dragleave', function() { sheetUploadZone.classList.remove('dragover'); });
sheetUploadZone.addEventListener('drop', function(e) {
  e.preventDefault();
  sheetUploadZone.classList.remove('dragover');
  sliceSpriteSheet(e.dataTransfer.files[0]);
});
sheetFileInput.addEventListener('change', function() { sliceSpriteSheet(this.files[0]); this.value = ''; });
sheetColsInput.addEventListener('input', function() { resliceSheet(); });
sheetRowsInput.addEventListener('input', function() { resliceSheet(); });

var sheetImage = null;
function sliceSpriteSheet(file) {
  if (!file || !file.type.startsWith('image/')) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      sheetImage = img;
      resliceSheet();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function resliceSheet() {
  if (!sheetImage) return;
  var cols = parseInt(sheetColsInput.value) || 4;
  var rows = parseInt(sheetRowsInput.value) || 1;
  var cellW = Math.floor(sheetImage.width / cols);
  var cellH = Math.floor(sheetImage.height / rows);
  flipbookFrames = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var cv = document.createElement('canvas');
      cv.width = cellW;
      cv.height = cellH;
      var cx = cv.getContext('2d');
      cx.drawImage(sheetImage, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
      var dataUrl = cv.toDataURL('image/png');
      var fImg = new Image();
      fImg.src = dataUrl;
      flipbookFrames.push({ src: dataUrl, img: fImg, name: 'frame_' + (r * cols + c) });
    }
  }
  renderFrameStrip();
  stitchFlipbookAtlas();
}

/* ===== FLIPBOOK: FRAME STRIP ===== */
var frameStrip = document.getElementById('frameStrip');
var emptyFrames = document.getElementById('emptyFrames');
var frameCountInfo = document.getElementById('frameCountInfo');

function renderFrameStrip() {
  frameStrip.innerHTML = '';
  if (flipbookFrames.length === 0) {
    frameStrip.appendChild(emptyFrames);
    emptyFrames.style.display = '';
    frameCountInfo.innerHTML = '<span data-i18n="noFrames">' + I18N[currentLang].noFrames + '</span>';
    stopFlipbookAnim();
    animPreview.style.display = 'none';
    return;
  }
  emptyFrames.style.display = 'none';
  frameCountInfo.innerHTML = I18N[currentLang].frameCount.replace('{n}', '<strong>' + flipbookFrames.length + '</strong>');
  flipbookFrames.forEach(function(frame, idx) {
    var thumb = document.createElement('div');
    thumb.className = 'frame-thumb';
    thumb.draggable = true;
    thumb.setAttribute('data-idx', idx);
    thumb.innerHTML = '<img src="' + frame.src + '" alt="Frame ' + (idx + 1) + '"><span class="frame-num">' + (idx + 1) + '</span><button class="frame-del" title="Remove">&times;</button>';
    thumb.querySelector('.frame-del').addEventListener('click', function(e) {
      e.stopPropagation();
      flipbookFrames.splice(idx, 1);
      renderFrameStrip();
      stitchFlipbookAtlas();
    });
    thumb.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', idx);
      thumb.classList.add('dragging');
    });
    thumb.addEventListener('dragend', function() { thumb.classList.remove('dragging'); });
    thumb.addEventListener('dragover', function(e) { e.preventDefault(); thumb.classList.add('drag-over'); });
    thumb.addEventListener('dragleave', function() { thumb.classList.remove('drag-over'); });
    thumb.addEventListener('drop', function(e) {
      e.preventDefault();
      thumb.classList.remove('drag-over');
      var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      var toIdx = idx;
      if (fromIdx === toIdx) return;
      var item = flipbookFrames.splice(fromIdx, 1)[0];
      flipbookFrames.splice(toIdx, 0, item);
      renderFrameStrip();
      stitchFlipbookAtlas();
    });
    frameStrip.appendChild(thumb);
  });
  updateGridRows();
}

/* ===== FLIPBOOK: GRID ===== */
var gridColsInput = document.getElementById('gridCols');
var gridRowsInput = document.getElementById('gridRows');
gridColsInput.addEventListener('input', function() { updateGridRows(); stitchFlipbookAtlas(); updateFlipbookShader(); });

function updateGridRows() {
  var cols = parseInt(gridColsInput.value) || 4;
  var total = flipbookFrames.length;
  gridRowsInput.value = total > 0 ? Math.ceil(total / cols) : 1;
}

/* ===== FLIPBOOK: ATLAS STITCHING ===== */
var flipbookAtlasCanvas = document.getElementById('flipbookAtlasCanvas');
var flipbookCtx = flipbookAtlasCanvas.getContext('2d');

function stitchFlipbookAtlas() {
  var total = flipbookFrames.length;
  if (total === 0) {
    flipbookAtlasCanvas.width = 1;
    flipbookAtlasCanvas.height = 1;
    flipbookCtx.clearRect(0, 0, 1, 1);
    stopFlipbookAnim();
    return;
  }
  var cols = parseInt(gridColsInput.value) || 4;
  var rows = Math.ceil(total / cols);
  var cellW = flipbookFrames[0].img.naturalWidth || 64;
  var cellH = flipbookFrames[0].img.naturalHeight || 64;
  flipbookAtlasCanvas.width = cellW * cols;
  flipbookAtlasCanvas.height = cellH * rows;
  flipbookCtx.clearRect(0, 0, flipbookAtlasCanvas.width, flipbookAtlasCanvas.height);
  flipbookFrames.forEach(function(frame, idx) {
    var col = idx % cols;
    var row = Math.floor(idx / cols);
    flipbookCtx.drawImage(frame.img, col * cellW, row * cellH, cellW, cellH);
  });
  startFlipbookAnim();
}

/* ===== FLIPBOOK: ANIMATION PREVIEW ===== */
var animPreview = document.getElementById('animPreview');
var animCanvas = document.getElementById('animCanvas');
var animCtx = animCanvas.getContext('2d');
var animPlayBtn = document.getElementById('animPlayBtn');
var animFrameInfo = document.getElementById('animFrameInfo');
var animFpsInput = document.getElementById('animFps');
var animLoopInput = document.getElementById('animLoop');
var animPingPongInput = document.getElementById('animPingPong');

[animFpsInput, animLoopInput, animPingPongInput].forEach(function(el) {
  el.addEventListener('input', function() { updateFlipbookShader(); if (flipbookAnimPlaying) startFlipbookAnim(); });
});

animPlayBtn.addEventListener('click', function() {
  if (flipbookAnimPlaying) { stopFlipbookAnim(); } else { startFlipbookAnim(); }
});

function startFlipbookAnim() {
  if (flipbookFrames.length < 1) return;
  stopFlipbookAnim();
  flipbookAnimPlaying = true;
  flipbookAnimTime = 0;
  flipbookLastFrameTime = performance.now();
  animPreview.style.display = '';
  animPlayBtn.textContent = I18N[currentLang].pauseAnimation;
  animCanvas.width = flipbookFrames[0].img.naturalWidth || 64;
  animCanvas.height = flipbookFrames[0].img.naturalHeight || 64;
  flipbookAnimId = requestAnimationFrame(animLoop);
}

function stopFlipbookAnim() {
  flipbookAnimPlaying = false;
  if (flipbookAnimId) cancelAnimationFrame(flipbookAnimId);
  flipbookAnimId = null;
  animPlayBtn.textContent = I18N[currentLang].playAnimation;
  if (flipbookFrames.length >= 1) {
    animPreview.style.display = '';
    animCanvas.width = flipbookFrames[0].img.naturalWidth || 64;
    animCanvas.height = flipbookFrames[0].img.naturalHeight || 64;
    animCtx.drawImage(flipbookFrames[0].img, 0, 0);
    animFrameInfo.textContent = 'Frame 1 / ' + flipbookFrames.length;
  }
}

function animLoop(now) {
  if (!flipbookAnimPlaying) return;
  var delta = (now - flipbookLastFrameTime) / 1000;
  flipbookLastFrameTime = now;
  flipbookAnimTime += delta;
  var fps = parseInt(animFpsInput.value) || 12;
  var total = flipbookFrames.length;
  var frameIdx;
  if (animPingPongInput.checked) {
    var cycle = flipbookAnimTime * fps;
    var period = (total - 1) * 2;
    var pos = cycle % period;
    frameIdx = pos < total ? Math.floor(pos) : period - Math.floor(pos);
  } else {
    frameIdx = Math.floor(flipbookAnimTime * fps) % total;
  }
  if (!animLoopInput.checked && !animPingPongInput.checked) {
    if (Math.floor(flipbookAnimTime * fps) >= total) {
      frameIdx = total - 1;
      stopFlipbookAnim();
      animFrameInfo.textContent = 'Frame ' + (frameIdx + 1) + ' / ' + total;
      return;
    }
  }
  animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);
  animCtx.drawImage(flipbookFrames[frameIdx].img, 0, 0);
  animFrameInfo.textContent = 'Frame ' + (frameIdx + 1) + ' / ' + total;
  flipbookAnimId = requestAnimationFrame(animLoop);
}
