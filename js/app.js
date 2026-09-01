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

document.getElementById('downloadPackBtn').addEventListener('click', function() {
  var btn = this;
  var label = btn.querySelector('span');
  var original = label.textContent;
  if (typeof JSZip === 'undefined') {
    label.textContent = I18N[currentLang].downloaded;
    return;
  }
  var zip = new JSZip();
  zip.file(shaderFileName(), getActiveShaderSource());
  var base = atlasDataUrl().split(',')[1];
  zip.file(atlasFileName(), base, { base64: true });
  getLicenseText().then(function(lic) {
    zip.file('LICENSE.md', lic);
    return zip.generateAsync({ type: 'blob' });
  }).then(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = currentMode === 'flipbook' ? 'VRCOpenWatch-Flipbook-pack.zip' : (clockMapping === 'custom' ? 'VRCOpenWatch-CustomUV-pack.zip' : 'VRCOpenWatch-pack.zip');
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 3000);
    label.textContent = I18N[currentLang].downloaded;
    setTimeout(function() { label.textContent = original; }, 1500);
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