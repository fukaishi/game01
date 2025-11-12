// ゲームの状態
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'O';
let gameActive = true;

// 勝利条件のパターン
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM要素の取得
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const restartButton = document.getElementById('restart');

// メッセージの定義
const messages = {
    currentTurn: (player) => `プレイヤー ${player} の番です`,
    winner: (player) => `プレイヤー ${player} の勝利！`,
    draw: '引き分けです！'
};

// ゲームの初期化
function initGame() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    restartButton.addEventListener('click', restartGame);
    updateStatus();
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

    // 勝利条件をチェック
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] === '' || board[b] === '' || board[c] === '') {
            continue;
        }
        if (board[a] === board[b] && board[b] === board[c]) {
            roundWon = true;
            winningCombination = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        // 勝者がいる場合
        statusDisplay.textContent = messages.winner(currentPlayer);
        gameActive = false;
        // 勝利したセルをハイライト
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
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'O';
    gameActive = true;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });

    updateStatus();
}

// ゲーム開始
initGame();
