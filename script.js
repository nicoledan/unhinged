// ============================================================
// SETTINGS
// ============================================================
const TEMPLATE = 4;   // 1=8pg, 2=12pg, 3=14pg, 4=16pg, 5=24pg, 6=26pg, 7=32pg, 8=64pg
const ALT      = "Unhinged, Volume 1";
const SMOOTH   = false;

// ============================================================
// Zine reader
// ============================================================
const FOV = 45;
const REPO_BASE = 'https://raw.githubusercontent.com/nicoledan/unhinged/main/';
const ZINE_CONTAINER = document.querySelector('#zine-container');
let card_amount;
let current_state = 0;
let pages = [];
let activeFolder = 'pages';

document.body.ariaLabel = ALT;
document.body.style.imageRendering = SMOOTH ? 'auto' : 'pixelated';

function getTextures(folder) {
    const base = REPO_BASE + folder + '/';
    const inner = { 1:5, 2:9, 3:11, 4:13, 5:21, 6:23, 7:29, 8:61 }[TEMPLATE] || 5;
    card_amount  = { 1:4, 2:6, 3:7,  4:8,  5:12, 6:13, 7:16, 8:32 }[TEMPLATE] || 4;
    return [base + 'FRONT.png', base + 'INNERFRONT.png'].concat(
        new Array(inner).fill().map((_, i) => base + (i + 1) + '.png'),
        [base + 'BACK.png']
    );
}

function loadZine(folder) {
    ZINE_CONTAINER.innerHTML = '<p id="loading">loading zine...</p>';
    current_state = 0;
    pages = [];

    const textures = getTextures(folder);

    Promise.all(
        textures.map(src =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
                img.alt = src.split('/').pop().split('.')[0];
            })
        )
    )
    .then(imgs => {
        ZINE_CONTAINER.innerHTML = '';
        const list = document.createElement('ul');
        list.ariaHidden = true;
        pages = imgs.map((img, idx) => {
            const li = document.createElement('li');
            const flip = idx % 2;
            li.className = 'depth-' + Math.min(2, idx);
            li.style.transform = 'translateX(100%) rotateY(0deg) scaleZ(' + (flip ? -1 : 1) + ')';
            li.appendChild(img);
            list.appendChild(li);
            return li;
        });
        ZINE_CONTAINER.appendChild(list);

        function updatePerspective() {
            const w = ZINE_CONTAINER.offsetWidth;
            const h = ZINE_CONTAINER.offsetHeight;
            list.style.perspective = Math.sqrt(((w/2)*w)/2 + ((h/2)*h)/2) / Math.tan(((FOV/2)*Math.PI)/180) + 'px';
        }
        window.addEventListener('resize', updatePerspective);
        updatePerspective();

        activeFolder = folder;
        const btn = document.getElementById('flip-btn');
        btn.textContent = folder === 'pages' ? 'unfold & see the reverse ✨' : 'refold the zine ✨';
        hideOverlay();
    })
    .catch(err => {
        console.error(err);
        ZINE_CONTAINER.innerHTML = '<div id="loading">Something went wrong! Make sure your images are in the pages folder.</div>';
    });
}
//hide sparkles on load
document.getElementById('sparkle-canvas').style.display = 'none';
//hide zine-back on load
document.getElementById('zine-back').style.display = 'none';

// new flipping function for hater/lover graphic
//function flipBack() {
//    const btn = document.getElementById('flip-btn');
//    btn.textContent = folder === 'pages' ? 'unfold & see the reverse ✨' : 'refold the zine ✨';
//}

let lastReverse = 'blue'; // so first flip gives red

function handleFlip() {
    const overlay = document.getElementById('flip-overlay');
    const overlayText = document.getElementById('flip-overlay-text');

    document.getElementById('sparkle-canvas').style.display='inline';
    overlay.classList.add('active');
    overlayText.classList.remove('typing');
    void overlayText.offsetWidth;
    overlayText.classList.add('typing');
    sparkleRush = true;
    sparkleCanvas.style.zIndex = 101;

    let next;
    if (activeFolder !== 'pages') {
        next = 'pages';
    } else {
        next = lastReverse === 'blue' ? 'pages-red' : 'pages-blue';
        lastReverse = next === 'pages-red' ? 'red' : 'blue';
    }

    setTimeout(() => {
        loadZine(next);
    }, 2200);
}

function hideOverlay() {
    const overlay = document.getElementById('flip-overlay');
    if (overlay) overlay.classList.remove('active');
    sparkleRush = false;
    sparkleCanvas.style.zIndex = 0;
    //removes the sparkle after the transition
    document.getElementById('sparkle-canvas').style.display = 'none';
}

// Initial load
loadZine('pages');

document.addEventListener('keyup', function(key) {
    if (key.key === 'ArrowLeft'  || key.key === 'a') flipLeft();
    else if (key.key === 'ArrowRight' || key.key === 'd') flipRight();
});

document.addEventListener('pointerup', function(event) {
    if (event.button !== 0) return;
    if (event.clientX < window.innerWidth / 2) flipRight();
    else flipLeft();
});

function getPages(state) {
    return [pages[state * 2], pages[state * 2 + 1]].filter(i => i);
    // added for flipping zine zine = "visible"
}
function replaceTransformPerPage(state, search, replace) {
    getPages(state).forEach(page => { page.style.transform = page.style.transform.replace(search, replace); });
}
function setDepth(state, depth) {
    getPages(state).forEach(page => { page.className = page.className.replace(/depth-\d+/, 'depth-' + Math.min(depth, 2)); });
}
function flipLeft() {
    if (current_state >= card_amount) return;
    replaceTransformPerPage(current_state, '0deg', '-180deg');
    setDepth(current_state - 1, 1);
    setDepth(current_state - 2, 2);
    setDepth(current_state + 1, 0);
    setDepth(current_state + 2, 1);
    ++current_state;
}
function flipRight() {
    if (current_state <= 0) return;
    replaceTransformPerPage(current_state - 1, '-180deg', '0deg');
    setDepth(current_state - 3, 1);
    setDepth(current_state - 2, 0);
    setDepth(current_state + 1, 2);
    setDepth(current_state, 1);
    --current_state;
}

// ============================================================
// Sparkle animation
// ============================================================
const sparkleCanvas = document.getElementById('sparkle-canvas');
const sparkleCtx    = sparkleCanvas.getContext('2d');
let sparkles = [];
let sparkleRush = false;



function resizeCanvas() {
    sparkleCanvas.width  = window.innerWidth;
    sparkleCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function createSparkle(rush) {
    return {
        x: randomBetween(0, sparkleCanvas.width),
        y: rush ? sparkleCanvas.height + 10 : randomBetween(0, sparkleCanvas.height),
        size: rush ? randomBetween(4, 10) : randomBetween(2, 6),
        opacity: randomBetween(0.4, 1),
        speedY: rush ? randomBetween(-8, -20) : randomBetween(-0.4, -1.2),
        speedX: rush ? randomBetween(-1, 1) : randomBetween(-0.3, 0.3),
        twinkleSpeed: randomBetween(0.01, 0.03),
        twinkleDir: 1,
        shape: Math.random() > 0.5 ? 'star' : 'dot'
    };
}

for (let i = 0; i < 60; i++) sparkles.push(createSparkle(false));

function drawStar(x, y, size, opacity) {
    sparkleCtx.save();
    sparkleCtx.translate(x, y);
    sparkleCtx.globalAlpha = opacity;
    sparkleCtx.fillStyle = '#fff';
    sparkleCtx.beginPath();
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const inner = size * 0.3;
        sparkleCtx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        sparkleCtx.lineTo(Math.cos(angle + Math.PI / 4) * inner, Math.sin(angle + Math.PI / 4) * inner);
    }
    sparkleCtx.closePath();
    sparkleCtx.fill();
    sparkleCtx.restore();
}

function animateSparkles() {
    sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

    if (sparkleRush && sparkles.length < 300) {
        for (let i = 0; i < 8; i++) sparkles.push(createSparkle(true));
    } else if (!sparkleRush && sparkles.length > 60) {
        sparkles = sparkles.slice(0, 60);
    }

    sparkles.forEach(s => {
        s.opacity += s.twinkleSpeed * s.twinkleDir;
        if (s.opacity >= 1 || s.opacity <= 0.1) s.twinkleDir *= -1;
        s.y += s.speedY;
        s.x += s.speedX;
        if (s.y < -10) {
            s.y = sparkleCanvas.height + 10;
            s.x = randomBetween(0, sparkleCanvas.width);
        }
        if (s.shape === 'star') {
            drawStar(s.x, s.y, s.size, s.opacity);
        } else {
            sparkleCtx.save();
            sparkleCtx.globalAlpha = s.opacity;
            sparkleCtx.fillStyle = '#fff';
            sparkleCtx.beginPath();
            sparkleCtx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
            sparkleCtx.fill();
            sparkleCtx.restore();
        }
    });
    requestAnimationFrame(animateSparkles);
}
animateSparkles();

//change based on URL parameter
/* var getUrlParameter = function getUrlParameter(a) {
    var d = window.location.search.substring(1),
        c = d.split("&"),
        e, b;
    for (b = 0; b < c.length; b++) {
       e = c[b].split("=");
        if (e[0] === a) {
            return e[1] === undefined ? true : decodeURIComponent(e[1])
        }
    }
};

if(getUrlParameter("cursor") === 'green'){
       $("html, body").css({cursor: url('cursors/cursor_1.png') 4 4, auto !important;});   
};*/


/* const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('cursor');

if(myParam !== null) {
  var styles = 
    html, body {cursor: url('cursors/cursor_1.png') 4 4, auto;}
};

var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet) */

/*if (window.location.search == "cursor=green") {
   document.getElementById('body').style = 'cursor: url('cursors/cursor_1.png') 4 4, auto;';
};
*/

const params = new URLSearchParams(window.location.search);
const cursorColor = params.get('cursor');

if (cursorColor) {
  // Base cursor
  document.body.style.cursor = `url('${cursorColor}.png'), auto`;

  // Inject a <style> tag for hover states
  const style = document.createElement('style');
  style.textContent = `a, button { cursor: url('${cursorColor}-hover.png'), pointer !important; }`;
  document.head.appendChild(style);
}