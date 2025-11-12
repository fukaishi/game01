// ゲームの状態
let board = [];
let currentPlayer = 'O';
let gameActive = true;
let currentMode = '3x3';

// モード設定
const modeConfigs = {
    '3x3': {
        rows: 3,
        cols: 3,
        winLength: 3,
        description: '3×3の盤面で3マス並べると勝利'
    },
    '5x5': {
        rows: 5,
        cols: 5,
        winLength: 5,
        description: '5×5の盤面で5マス並べると勝利'
    },
    '3x8': {
        rows: 3,
        cols: 8,
        verticalWin: 3,
        horizontalWin: 8,
        description: '3×8の盤面（縦・斜め3マス、横8マス並べると勝利）'
    }
};

// DOM要素の取得
const boardElement = document.getElementById('board');
const statusDisplay = document.getElementById('status');
const restartButton = document.getElementById('restart');
const modeButtons = document.querySelectorAll('.mode-btn');
const modeDescription = document.getElementById('modeDescription');

// メッセージの定義
const messages = {
    currentTurn: (player) => `プレイヤー ${player} の番です`,
    winner: (player) => `プレイヤー ${player} の勝利！`,
    draw: '引き分けです！'
};

// ボードの初期化
function initBoard() {
    const config = modeConfigs[currentMode];
    const totalCells = config.rows * config.cols;
    board = Array(totalCells).fill('');

    // ボードのHTML生成
    boardElement.innerHTML = '';
    boardElement.setAttribute('data-mode', currentMode);

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

// モード変更
function changeMode(mode) {
    currentMode = mode;
    modeDescription.textContent = modeConfigs[mode].description;

    // すべてのモードボタンのactiveクラスを削除
    modeButtons.forEach(btn => btn.classList.remove('active'));

    // 選択されたモードボタンにactiveクラスを追加
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // ゲームをリセット
    restartGame();
}

// 勝利条件の生成
function generateWinningConditions() {
    const config = modeConfigs[currentMode];
    const conditions = [];

    if (currentMode === '3x8') {
        // 3x8モード専用の勝利条件
        const { rows, cols, verticalWin, horizontalWin } = config;

        // 縦の勝利条件（各列で3マス）
        for (let col = 0; col < cols; col++) {
            const line = [];
            for (let row = 0; row < rows; row++) {
                line.push(row * cols + col);
            }
            conditions.push(line);
        }

        // 横の勝利条件（各行で8マス全て）
        for (let row = 0; row < rows; row++) {
            const line = [];
            for (let col = 0; col < cols; col++) {
                line.push(row * cols + col);
            }
            conditions.push(line);
        }

        // 対角線の勝利条件（3マス連続）
        // 左上から右下への対角線（3マス）
        for (let startCol = 0; startCol <= cols - rows; startCol++) {
            const line = [];
            for (let i = 0; i < rows; i++) {
                line.push(i * cols + (startCol + i));
            }
            conditions.push(line);
        }

        // 右上から左下への対角線（3マス）
        for (let startCol = rows - 1; startCol < cols; startCol++) {
            const line = [];
            for (let i = 0; i < rows; i++) {
                line.push(i * cols + (startCol - i));
            }
            conditions.push(line);
        }

    } else {
        // 3x3と5x5モードの勝利条件
        const { rows, cols, winLength } = config;

        // 横の勝利条件
        for (let row = 0; row < rows; row++) {
            const line = [];
            for (let col = 0; col < cols; col++) {
                line.push(row * cols + col);
            }
            conditions.push(line);
        }

        // 縦の勝利条件
        for (let col = 0; col < cols; col++) {
            const line = [];
            for (let row = 0; row < rows; row++) {
                line.push(row * cols + col);
            }
            conditions.push(line);
        }

        // 対角線の勝利条件（左上から右下）
        if (rows === cols) {
            const diagonal1 = [];
            for (let i = 0; i < rows; i++) {
                diagonal1.push(i * cols + i);
            }
            conditions.push(diagonal1);

            // 対角線の勝利条件（右上から左下）
            const diagonal2 = [];
            for (let i = 0; i < rows; i++) {
                diagonal2.push(i * cols + (cols - 1 - i));
            }
            conditions.push(diagonal2);
        }
    }

    return conditions;
}

// セルがクリックされた時の処理
function handleCellClick(event) {
    const cell = event.target;
    const index = parseInt(cell.getAttribute('data-index'));

    // すでにマークがある、またはゲームが終了している場合は何もしない
    if (board[index] !== '' || !gameActive) {
        return;
    }

    // セルを更新
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add('taken', currentPlayer.toLowerCase());

    // 勝敗をチェック
    checkResult();
}

// 勝敗のチェック
function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    const winningConditions = generateWinningConditions();

    // 勝利条件をチェック
    for (let condition of winningConditions) {
        const values = condition.map(index => board[index]);

        // すべてのマスが埋まっているかチェック
        if (values.includes('')) {
            continue;
        }

        // すべてのマスが同じプレイヤーのものかチェック
        if (values.every(val => val === values[0])) {
            roundWon = true;
            winningCombination = condition;
            break;
        }
    }

    if (roundWon) {
        // 勝者がいる場合
        statusDisplay.textContent = messages.winner(currentPlayer);
        gameActive = false;
        // 勝利したセルをハイライト
        const cells = document.querySelectorAll('.cell');
        winningCombination.forEach(index => {
            cells[index].classList.add('winner');
        });
        return;
    }

    // 引き分けチェック
    if (!board.includes('')) {
        statusDisplay.textContent = messages.draw;
        gameActive = false;
        return;
    }

    // プレイヤーを切り替え
    currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
    updateStatus();
}

// ステータスメッセージの更新
function updateStatus() {
    if (gameActive) {
        statusDisplay.textContent = messages.currentTurn(currentPlayer);
    }
}

// ゲームのリスタート
function restartGame() {
    currentPlayer = 'O';
    gameActive = true;
    initBoard();
    updateStatus();
}

// ゲームの初期化
function initGame() {
    // モードボタンのイベントリスナー
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.getAttribute('data-mode');
            changeMode(mode);
        });
    });

    // リスタートボタンのイベントリスナー
    restartButton.addEventListener('click', restartGame);

    // 初期ボードの生成
    initBoard();
    updateStatus();
}

// ゲーム開始
initGame();
