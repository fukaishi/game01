// ゲームの状態
let board = [];
let currentPlayer = 'O';
let humanPlayer = 'O';
let aiPlayer = 'X';
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

// プレイヤー名の取得
function getPlayerName(player) {
    return player === humanPlayer ? 'プレイヤー' : 'コンピュータ';
}

// メッセージの定義
const messages = {
    currentTurn: (player) => `${getPlayerName(player)}の番です`,
    winner: (player) => `${getPlayerName(player)}の勝利！`,
    draw: '引き分けです！',
    thinking: 'コンピュータが考え中...'
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
        const { rows, cols } = config;

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
        const { rows, cols } = config;

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

// 勝者をチェック
function checkWinner(testBoard) {
    const winningConditions = generateWinningConditions();

    for (let condition of winningConditions) {
        const values = condition.map(index => testBoard[index]);

        if (values.includes('')) {
            continue;
        }

        if (values.every(val => val === values[0])) {
            return { winner: values[0], combination: condition };
        }
    }

    // 引き分けチェック
    if (!testBoard.includes('')) {
        return { winner: 'draw', combination: null };
    }

    return { winner: null, combination: null };
}

// AIの評価関数
function evaluate(testBoard) {
    const result = checkWinner(testBoard);

    if (result.winner === aiPlayer) {
        return 10;
    } else if (result.winner === humanPlayer) {
        return -10;
    } else {
        return 0;
    }
}

// ミニマックスアルゴリズム（アルファベータ枝刈り付き）
function minimax(testBoard, depth, isMaximizing, alpha, beta) {
    const result = checkWinner(testBoard);

    // 終了状態のチェック
    if (result.winner !== null) {
        if (result.winner === 'draw') {
            return 0;
        }
        const score = evaluate(testBoard);
        // 深さによるペナルティ（早く勝つ方が良い）
        return score > 0 ? score - depth : score + depth;
    }

    // 深さ制限（5x5と3x8モード用）
    const maxDepth = currentMode === '3x3' ? 9 : (currentMode === '5x5' ? 4 : 3);
    if (depth >= maxDepth) {
        return 0;
    }

    const availableMoves = testBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let move of availableMoves) {
            testBoard[move] = aiPlayer;
            const score = minimax(testBoard, depth + 1, false, alpha, beta);
            testBoard[move] = '';
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                break; // ベータカット
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let move of availableMoves) {
            testBoard[move] = humanPlayer;
            const score = minimax(testBoard, depth + 1, true, alpha, beta);
            testBoard[move] = '';
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) {
                break; // アルファカット
            }
        }
        return minScore;
    }
}

// AIの最適な手を見つける
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    const availableMoves = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

    // 3x3モードの最初の手は中央または角を優先（高速化）
    if (currentMode === '3x3' && availableMoves.length === 9) {
        const strategicMoves = [4, 0, 2, 6, 8]; // 中央、角
        for (let move of strategicMoves) {
            if (availableMoves.includes(move)) {
                return move;
            }
        }
    }

    for (let move of availableMoves) {
        board[move] = aiPlayer;
        const score = minimax([...board], 0, false, -Infinity, Infinity);
        board[move] = '';

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

// AIのターン処理
function aiMove() {
    if (!gameActive || currentPlayer !== aiPlayer) {
        return;
    }

    statusDisplay.textContent = messages.thinking;

    // 少し待ってから手を打つ（自然に見せるため）
    setTimeout(() => {
        const bestMove = findBestMove();

        if (bestMove !== -1) {
            makeMove(bestMove);
        }
    }, 500);
}

// 手を打つ
function makeMove(index) {
    if (board[index] !== '' || !gameActive) {
        return;
    }

    board[index] = currentPlayer;
    const cells = document.querySelectorAll('.cell');
    cells[index].textContent = currentPlayer;
    cells[index].classList.add('taken', currentPlayer.toLowerCase());

    checkResult();
}

// セルがクリックされた時の処理
function handleCellClick(event) {
    // プレイヤーのターンでない場合は何もしない
    if (currentPlayer !== humanPlayer || !gameActive) {
        return;
    }

    const cell = event.target;
    const index = parseInt(cell.getAttribute('data-index'));

    makeMove(index);
}

// 勝敗のチェック
function checkResult() {
    const result = checkWinner(board);

    if (result.winner) {
        gameActive = false;
        const cells = document.querySelectorAll('.cell');

        if (result.winner === 'draw') {
            statusDisplay.textContent = messages.draw;
        } else {
            statusDisplay.textContent = messages.winner(result.winner);
            // 勝利したセルをハイライト
            result.combination.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
        return;
    }

    // プレイヤーを切り替え
    currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
    updateStatus();

    // AIのターンなら自動で打つ
    if (currentPlayer === aiPlayer) {
        aiMove();
    }
}

// ステータスメッセージの更新
function updateStatus() {
    if (gameActive) {
        statusDisplay.textContent = messages.currentTurn(currentPlayer);
    }
}

// ゲームのリスタート
function restartGame() {
    // ランダムに先攻後攻を決定
    const playerGoesFirst = Math.random() < 0.5;
    humanPlayer = playerGoesFirst ? 'O' : 'X';
    aiPlayer = playerGoesFirst ? 'X' : 'O';
    currentPlayer = 'O'; // Oが常に先攻

    gameActive = true;
    initBoard();
    updateStatus();

    // AIが先攻の場合は自動で打つ
    if (currentPlayer === aiPlayer) {
        aiMove();
    }
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
    restartGame();
}

// ゲーム開始
initGame();
