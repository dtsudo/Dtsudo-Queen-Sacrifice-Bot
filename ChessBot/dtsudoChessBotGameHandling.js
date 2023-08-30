
let readStream = processLine => response => {
	let stream = response.body.getReader();
	let matcher = /\r?\n/;
	let decoder = new TextDecoder();
	let buf = "";

	let loop = () =>
		stream.read().then(({ done, value }) => {
			if (done) {
				if (buf.length > 0) processLine(JSON.parse(buf));
			} else {
				let chunk = decoder.decode(value, {
					stream: true
				});
				buf += chunk;

				let parts = buf.split(matcher);
				buf = parts.pop();
				for (let i of parts.filter(p => p))
					processLine(JSON.parse(i));
				return loop();
			}
		});

	return loop();
};

let processLichessGame = function (gameId, isWhite, lichessToken, webWorkerFileForUciChessEngine, webWorkerFileType) {
		
	let chessEngineWorker = new Worker(webWorkerFileForUciChessEngine, { type: webWorkerFileType });

	let chessEngineBestMove = null;
	
	chessEngineWorker.addEventListener("message", function (e) {
		let str = e.data.trim();
		
		if (!str.startsWith("bestmove"))
			return;
		
		chessEngineBestMove = str.split(/\s+/)[1];
		processChessEngineCommandQueue();
	});

	chessEngineWorker.postMessage("uci");
	chessEngineWorker.postMessage("isready");
		
	let chessEngineCommandQueue = [];
		
	let processChessEngineCommandQueue;
	processChessEngineCommandQueue = function () {
		
		if (chessEngineCommandQueue.length === 0) 
			return;
		
		if (chessEngineCommandQueue[0].shouldQuit) {
			chessEngineCommandQueue.shift();
			chessEngineWorker.postMessage("quit");
			return;
		}
		
		if (!chessEngineCommandQueue[0].hasStartedProcessing) {
			chessEngineCommandQueue[0].hasStartedProcessing = true;
			chessEngineWorker.postMessage("ucinewgame");
			chessEngineWorker.postMessage("isready");
			if (chessEngineCommandQueue[0].previousMoves === "")
				chessEngineWorker.postMessage("position startpos");
			else
				chessEngineWorker.postMessage("position startpos moves " + chessEngineCommandQueue[0].previousMoves.trim());
			chessEngineWorker.postMessage("go movetime " + chessEngineCommandQueue[0].numMillisToThink);
			return;
		}
		
		if (chessEngineBestMove === null)
			return;
				
		let promiseResolveFunction = chessEngineCommandQueue[0].promiseResolveFunction;
		let bestMove = chessEngineBestMove;
		chessEngineBestMove = null;
		chessEngineCommandQueue.shift();
		promiseResolveFunction(bestMove);
		setTimeout(processChessEngineCommandQueue, 0);
	};
		
	let enqueueChessEngineCommand = function (previousMoves, numMillisToThink) {
		let promise = new Promise((resolve, reject) => {
			chessEngineCommandQueue.push({
				shouldQuit: false,
				previousMoves: previousMoves,
				numMillisToThink: numMillisToThink,
				promiseResolveFunction: resolve,
				hasStartedProcessing: false
			});		
			processChessEngineCommandQueue();
		});
		
		return promise;
	};
		
	let makeBotMove = function (previousMoves, numMillisToThink) {
		enqueueChessEngineCommand(previousMoves, numMillisToThink)
			.then(bestMove => {
				fetch("https://lichess.org/api/bot/game/" + gameId + "/move/" + bestMove, {
					method: "POST",
					headers: {
						Authorization: lichessToken
					}
				});
			});
	};
	
	const NUM_MILLISECONDS_TO_THINK_PER_MOVE = 250;

	let processLichessGameEvent = function (gameEvent) {
	
		if (gameEvent.type === "gameFull") {
			if (isWhite) {
				makeBotMove("", NUM_MILLISECONDS_TO_THINK_PER_MOVE);
			}
		} else if (gameEvent.type === "gameState") {
			let moves = gameEvent.moves.trim();
			let numMoves = moves.split(/\s+/).length;
			let isBotTurn = isWhite && (numMoves % 2 === 0) || !isWhite && (numMoves % 2 !== 0);
			if (isBotTurn) {
				if (gameEvent.status === "started") {
					let numMillisToThink = NUM_MILLISECONDS_TO_THINK_PER_MOVE;
					if (isWhite && gameEvent.wtime < 3000 || !isWhite && gameEvent.btime < 3000)
						numMillisToThink = Math.min(NUM_MILLISECONDS_TO_THINK_PER_MOVE, 25);
					makeBotMove(moves, numMillisToThink);
				}
			}
		}
	};
		
	let response = fetch("https://lichess.org/api/bot/game/stream/" + gameId, {
		method: "GET",
		headers: {
			Authorization: lichessToken
		}
	});
	
	response
		.then(readStream(gameEvent => processLichessGameEvent(gameEvent)))
		.then(() => {
			chessEngineCommandQueue.push({ shouldQuit: true });
			processChessEngineCommandQueue();
		});
};

export default processLichessGame;
