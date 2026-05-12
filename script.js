const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

// 1. 地圖：1是牆，0是路
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
const TILE_SIZE = 64;

// 2. 玩家狀態
let player = {
    x: 80,
    y: 80,
    angle: 0
};

// 3. 鍵盤狀態
const keys = {}; // 建立一個儲存箱，用來記住現在哪些按鍵被按住了。
window.onkeydown = (e) => keys[e.key.toLowerCase()] = true; // 按下鍵盤，記為「true」（正在按）。
window.onkeyup = (e) => keys[e.key.toLowerCase()] = false; // 放開鍵盤，記為「false」（沒在按）。

// 點擊畫布時，請求鎖定滑鼠 (按 Esc 退出)
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

// 當滑鼠移動時，改變玩家角度
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
        // e.movementX 是滑鼠左右移動的距離
        // 0.002 是靈敏度，你可以調整這個數值
        player.angle += e.movementX * 0.002;
        // 讓角度永遠維持在 0 到 2*PI 之間，就像時鐘轉完一圈回到 0
        player.angle %= Math.PI * 2;
    }
});

function render() {
    // 預計移動後的 X 和 Y 座標
    let nextX = player.x;
    let nextY = player.y;

    if (keys['w']) {
        nextX += Math.cos(player.angle) * 3;
        nextY += Math.sin(player.angle) * 3;
    }
    if (keys['s']) {
        nextX -= Math.cos(player.angle) * 3;
        nextY -= Math.sin(player.angle) * 3;
    }

    // 分開檢查 X，如果 X 沒撞牆，就更新 X
    let checkX = Math.floor(nextX / TILE_SIZE);
    let currentY = Math.floor(player.y / TILE_SIZE);
    if (map[currentY][checkX] === 0) {
        player.x = nextX;
    }

    // 分開檢查 Y，如果 Y 沒撞牆，就更新 Y
    let checkY = Math.floor(nextY / TILE_SIZE);
    let currentX = Math.floor(player.x / TILE_SIZE);
    if (map[checkY][currentX] === 0) {
        player.y = nextY;
    }

    if (keys['a']) player.angle -= 0.05;
    if (keys['d']) player.angle += 0.05;

    // --- 開始繪圖 ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 畫天花板(深灰)與地板(淺灰)
    ctx.fillStyle = "#222"; ctx.fillRect(0, 0, canvas.width, canvas.height/2);
    ctx.fillStyle = "#555"; ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height/2);

    // 核心：發射射線
    const numRays = 160; // 畫面由 160 根柱子組成
    for (let i = 0; i < numRays; i++) {
        // 計算這一條射線的角度（從玩家視野的左邊掃到右邊）
        let rayAngle = (player.angle - 0.5) + (i / numRays);
        let rayX = player.x;
        let rayY = player.y;
        let dist = 0;

        // 射線往前跑，直到撞到地圖上的 1
        while (dist < 500) {
            dist += 0.5;
            let testX = rayX + Math.cos(rayAngle) * dist;
            let testY = rayY + Math.sin(rayAngle) * dist;
            
            let mX = Math.floor(testX / TILE_SIZE);
            let mY = Math.floor(testY / TILE_SIZE);

            if (map[mY][mX] === 1) {
                // 撞牆了！算出牆的高度（已修正魚眼失真）
                let h = (TILE_SIZE * canvas.height) / (dist * Math.cos(player.angle - rayAngle));
                
                // 1. 取得撞擊點在單一格子內的相對位置 (用來判斷撞到哪一面)
                let blockX = testX % TILE_SIZE; 
                let blockY = testY % TILE_SIZE;

                // 2. 根據距離計算基礎亮度（線性霧化：越遠越黑）
                let colorValue = 200 - (dist / 2);

                // 3. 判斷撞擊方位並套用陰影
                // 如果撞擊點在 X 邊界（左右兩側），則調暗顏色
                if (Math.abs(blockX) < 2 || Math.abs(blockX) > TILE_SIZE - 2) {
                    colorValue *= 0.7; 
                }

                // 4. 正式套用顏色與畫出柱子
                ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
                
                // 這裡使用剛剛計算好、含陰影的 colorValue
                ctx.fillRect(
                    i * (canvas.width / numRays), // 螢幕上的 X 位置
                    (canvas.height - h) / 2,      // 繪製起點（置中）
                    (canvas.width / numRays) + 1, // 柱子寬度（+1 避免縫隙）
                    h                             // 牆壁高度
                );
                
                break; // 停止射線步進
            }
        }
    }

    // 畫左上角的小地圖
    drawMiniMap();
    requestAnimationFrame(render);
}

function drawMiniMap() {
    const s = 0.1; // 縮放比例
    for(let y=0; y<map.length; y++) {
        for(let x=0; x<map[y].length; x++) {
            if(map[y][x] === 1) {
                ctx.fillStyle = "white";
                ctx.fillRect(x*TILE_SIZE*s, y*TILE_SIZE*s, TILE_SIZE*s-1, TILE_SIZE*s-1);
            }
        }
    }
    ctx.fillStyle = "red";
    ctx.fillRect(player.x*s-2, player.y*s-2, 4, 4);
}

render();