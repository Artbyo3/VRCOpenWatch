document.getElementById('downloadBtn').addEventListener('click', function() {
  var btn = this;
  var span = btn.querySelector('span');
  var originalText = span.textContent;
  var link = document.createElement('a');
  if (currentMode === 'flipbook') {
    link.download = 'flipbook-atlas.png';
    link.href = flipbookAtlasCanvas.toDataURL('image/png');
  } else {
    link.download = 'digit-atlas.png';
    link.href = canvas.toDataURL('image/png');
  }
  link.click();
  btn.classList.add('downloaded');
  span.textContent = I18N[currentLang].downloaded;
  setTimeout(function() {
    btn.classList.remove('downloaded');
    span.textContent = originalText;
  }, 1500);
});

var shaderToggle = document.getElementById('shaderToggle');
var shaderCodeWrap = document.getElementById('shaderCodeWrap');
shaderToggle.addEventListener('click', function() {
  var isOpen = shaderCodeWrap.classList.toggle('open');
  shaderToggle.textContent = isOpen ? I18N[currentLang].hideCode : I18N[currentLang].showCode;
  if (isOpen) refreshShaderPreview();
});

document.getElementById('copyBtn').addEventListener('click', function() {
  var src = getActiveShaderSource();
  var tag = document.getElementById('copiedTag');
  var done = function() {
    tag.classList.add('show');
    setTimeout(function() { tag.classList.remove('show'); }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(src).then(done).catch(done);
  } else {
    var ta = document.createElement('textarea');
    ta.value = src;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    done();
  }
});

document.getElementById('downloadShaderBtn').addEventListener('click', function() {
  var src = getActiveShaderSource();
  var blob = new Blob([src], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = currentMode === 'flipbook' ? 'VRCOpenWatch-Flipbook.shader' : (clockMapping === 'custom' ? 'VRCOpenWatch-CustomUV.shader' : 'VRCOpenWatch.shader');
  a.click();
  URL.revokeObjectURL(url);
});

var MIT_LICENSE = 'MIT License\n\nCopyright (c) 2026 VRCOpenWatch contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n';

function shaderFileName() {
  if (currentMode === 'flipbook') return 'VRCOpenWatch-Flipbook.shader';
  return clockMapping === 'custom' ? 'VRCOpenWatch-CustomUV.shader' : 'VRCOpenWatch.shader';
}
function atlasFileName() {
  return currentMode === 'flipbook' ? 'flipbook-atlas.png' : 'digit-atlas.png';
}
function atlasDataUrl() {
  return currentMode === 'flipbook' ? flipbookAtlasCanvas.toDataURL('image/png') : canvas.toDataURL('image/png');
}

function getLicenseText() {
  return fetch('./LICENSE.md').then(function(r) {
    if (r.ok) return r.text();
    throw new Error('no license');
  }).catch(function() { return MIT_LICENSE; });
}

function crc32(buf) {
  var c, table = [], n, k;
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function base64ToBytes(b64) {
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function buildZipFromFiles(files) {
  var enc = new TextEncoder();
  var parts = [], central = [];
  var localLen = 0, centralLen = 0, offset = 0;

  for (var fi = 0; fi < files.length; fi++) {
    var f = files[fi];
    var nameBytes = enc.encode(f.name);
    var size = f.data.length;
    var crc = crc32(f.data);

    var lh = new Uint8Array(30);
    var dvl = new DataView(lh.buffer);
    lh.set([0x50, 0x4b, 0x03, 0x04], 0);
    dvl.setUint16(4, 20, true);
    dvl.setUint16(6, 0, true);
    dvl.setUint16(8, 0, true);
    dvl.setUint16(10, 0, true);
    dvl.setUint16(12, 0x21, true);
    dvl.setUint32(14, crc, true);
    dvl.setUint32(18, size, true);
    dvl.setUint32(22, size, true);
    dvl.setUint16(26, nameBytes.length, true);
    dvl.setUint16(28, 0, true);
    parts.push(lh, nameBytes, f.data);
    localLen += 30 + nameBytes.length + f.data.length;

    var ch = new Uint8Array(46);
    var dvc = new DataView(ch.buffer);
    ch.set([0x50, 0x4b, 0x01, 0x02], 0);
    dvc.setUint16(4, 20, true);
    dvc.setUint16(6, 20, true);
    dvc.setUint16(8, 0, true);
    dvc.setUint16(10, 0, true);
    dvc.setUint16(12, 0, true);
    dvc.setUint16(14, 0x21, true);
    dvc.setUint32(16, crc, true);
    dvc.setUint32(20, size, true);
    dvc.setUint32(24, size, true);
    dvc.setUint16(28, nameBytes.length, true);
    dvc.setUint16(30, 0, true);
    dvc.setUint16(32, 0, true);
    dvc.setUint16(34, 0, true);
    dvc.setUint16(36, 0, true);
    dvc.setUint32(38, 0, true);
    dvc.setUint32(42, offset, true);
    central.push(ch, nameBytes);
    centralLen += 46 + nameBytes.length;

    offset += 30 + nameBytes.length + f.data.length;
  }

  var eocd = new Uint8Array(22);
  var dve = new DataView(eocd.buffer);
  eocd.set([0x50, 0x4b, 0x05, 0x06], 0);
  dve.setUint16(8, files.length, true);
  dve.setUint16(10, files.length, true);
  dve.setUint32(12, centralLen, true);
  dve.setUint32(16, localLen, true);

  var out = new Uint8Array(localLen + centralLen + 22);
  var p = 0, i;
  for (i = 0; i < parts.length; i++) { out.set(parts[i], p); p += parts[i].length; }
  for (i = 0; i < central.length; i++) { out.set(central[i], p); p += central[i].length; }
  out.set(eocd, p);
  return out;
}

document.getElementById('downloadPackBtn').addEventListener('click', function() {
  var btn = this;
  var label = btn.querySelector('span');
  var original = label.textContent;

  function done() {
    label.textContent = I18N[currentLang].downloaded;
    setTimeout(function() { label.textContent = original; }, 1500);
  }
  function fire(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = currentMode === 'flipbook' ? 'VRCOpenWatch-Flipbook-pack.zip' : (clockMapping === 'custom' ? 'VRCOpenWatch-CustomUV-pack.zip' : 'VRCOpenWatch-pack.zip');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 3000);
    done();
  }

  getLicenseText().then(function(lic) {
    var enc = new TextEncoder();
    var files = [
      { name: shaderFileName(), data: enc.encode(getActiveShaderSource()) },
      { name: atlasFileName(), data: base64ToBytes(atlasDataUrl().split(',')[1]) },
      { name: 'LICENSE.md', data: enc.encode(lic) }
    ];
    return new Blob([buildZipFromFiles(files)], { type: 'application/zip' });
  }).then(function(blob) {
    fire(blob);
  }).catch(function() {
    fire(new Blob([new TextEncoder().encode('Failed to build pack.')], { type: 'application/zip' }));
  });
});

/* ===== MODE SWITCHING & DEV MODE ===== */
var devMode = localStorage.getItem('vrcwatch_dev_mode') === 'true';
var devModeBtn = document.getElementById('devModeBtn');
var currentMode = 'clock';
var modeTabs = document.getElementById('modeTabs');
var clockMode = document.getElementById('clockMode');
var flipbookMode = document.getElementById('flipbookMode');
var clockConfig = document.getElementById('clockConfig');
var flipbookConfig = document.getElementById('flipbookConfig');
var modeNote = document.getElementById('modeNote');

function setDevMode(enabled) {
  devMode = !!enabled;
  localStorage.setItem('vrcwatch_dev_mode', devMode ? 'true' : 'false');
  if (devModeBtn) {
    devModeBtn.classList.toggle('active', devMode);
    devModeBtn.setAttribute('aria-pressed', devMode ? 'true' : 'false');
  }
  if (modeTabs) {
    modeTabs.style.display = devMode ? '' : 'none';
  }
  if (!devMode && currentMode === 'flipbook') {
    var clockBtn = modeTabs ? modeTabs.querySelector('button[data-mode="clock"]') : null;
    if (clockBtn) clockBtn.click();
  }
}

if (devModeBtn) {
  devModeBtn.addEventListener('click', function() {
    setDevMode(!devMode);
  });
}
setDevMode(devMode);

if (modeTabs) {
  modeTabs.addEventListener('click', function(e) {
    var btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    currentMode = btn.getAttribute('data-mode');
    modeTabs.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    clockMode.style.display = currentMode === 'clock' ? '' : 'none';
    flipbookMode.style.display = currentMode === 'flipbook' ? '' : 'none';
    clockConfig.style.display = currentMode === 'clock' ? '' : 'none';
    flipbookConfig.style.display = currentMode === 'flipbook' ? '' : 'none';
    if (currentMode === 'flipbook') {
      modeNote.setAttribute('data-i18n', 'flipbookNote');
      modeNote.textContent = I18N[currentLang].flipbookNote;
      stitchFlipbookAtlas();
    } else {
      updateClockNote();
    }
    refreshShaderPreview();
  });
}