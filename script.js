const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

// --- 1. 地圖定義 ---
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
];
const TILE_SIZE = 64; // 地圖每一格的大小

// --- 2. 玩家狀態 ---
let player = {
    x: 150,
    y: 150,
    angle: 0,      // 玩家面對的角度（0 弧度是正右方）
    fov: Math.PI / 3 // 視角範圍（Field of View）視角 60 度
};

// --- 3. 渲染主程式 ---
function render() {
    // A. 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // B. 畫出 2D 地圖 (用於開發除錯)
    drawMap();

    // C. 發射射線 (Raycasting 核心)
    castRays();

    requestAnimationFrame(render);
}

function drawMap() {
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 1) {
                ctx.fillStyle = "#555"; // 牆壁灰色
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
            }
        }
    }
}

function castRays() {
    // 先畫出玩家本人 (一個紅點)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 發射一條測試射線
    let rayX = player.x;
    let rayY = player.y;
    let stepX = Math.cos(player.angle); // 根據角度算出 X 軸每一步要走多少
    let stepY = Math.sin(player.angle); // 根據角度算出 Y 軸每一步要走多少

    // 讓射線一直往前跑，直到撞牆
    while (true) {
        rayX += stepX;
        rayY += stepY;
        
        let mapX = Math.floor(rayX / TILE_SIZE);
        let mapY = Math.floor(rayY / TILE_SIZE);

        if (map[mapY][mapX] === 1) break; // 撞到牆了，停止

        // 畫出射線的路徑 (除錯用)
        ctx.fillStyle = "yellow";
        ctx.fillRect(rayX, rayY, 2, 2);
    }
}

render();

window.addEventListener('keydown', (e) => {
    if (e.key === 'a') player.angle -= 0.1; // 向左轉
    if (e.key === 'd') player.angle += 0.1; // 向右轉
    if (e.key === 'w') { // 向前走
        player.x += Math.cos(player.angle) * 5;
        player.y += Math.sin(player.angle) * 5;
    }
    if (e.key === 's') { // 向後退
        player.x -= Math.cos(player.angle) * 5;
        player.y -= Math.sin(player.angle) * 5;
    }
});