
import { Chess } from "../ChessJs/chess.js";
import { getBaseEngineWrapper } from "./queenSacrificeUciChessEngine_BaseEngineWrapper.js";
import {
	processGoCommand,
	getMovesThatSacrificeTheQueen,
	getRandomElementFromArray
} from "./queenSacrificeUciChessEngine_Util.js";

let baseEngineWrapper = getBaseEngineWrapper();

let determineMove = function (boardState, numPreviousMoves, searchmoves, movetime, isInfinite) {
	return new Promise((resolve, reject) => {
		let currentMoves = boardState.moves({ verbose: true });
		
		if (searchmoves !== null) 
			currentMoves = currentMoves.filter(x => searchmoves.includes(x.lan));
		
		if (numPreviousMoves === 0 || numPreviousMoves === 1) {
			let move = getRandomElementFromArray(currentMoves);
			resolve(move.lan);
			return;
		}
		
		let movesThatSacrificeTheQueen = getMovesThatSacrificeTheQueen(boardState)
			.filter(x => x.promotion !== "q");
		if (searchmoves !== null)
			movesThatSacrificeTheQueen = movesThatSacrificeTheQueen.filter(x => searchmoves.includes(x.lan));
		
		if (movesThatSacrificeTheQueen.length === 1) {
			resolve(movesThatSacrificeTheQueen[0].lan);
			return;
		}

		let movesToConsider;
		if (movesThatSacrificeTheQueen.length > 0)
			movesToConsider = movesThatSacrificeTheQueen;
		else
			movesToConsider = currentMoves;
				
		let promise = baseEngineWrapper.getBestMove(
			boardState.fen(), 
			isInfinite ? 250 : Math.min(movetime, 250),
			movesToConsider.map(x => x.lan));
			
		promise.then(bestMove => {
			if (bestMove.endsWith("q")) {
				let alternativeBestMove = bestMove.substring(0, 4) + "r";
				if (currentMoves.map(x => x.lan).includes(alternativeBestMove))
					resolve(alternativeBestMove);
				else
					resolve(bestMove);
			} else {
				resolve(bestMove);
			}
		});
	});
};

let boardState = null;
let numPreviousMoves = null;
let ponderGoCommand = null;

onmessage = function (e) {
	let line = e.data.trim();
	
	if (line.startsWith("uci") && !line.startsWith("ucinewgame")) {
		postMessage("id name QueenSacrificeEngine");
		postMessage("id author dtsudo");
		postMessage("uciok");
		return;
	}
	
	if (line.startsWith("isready")) {
		postMessage("readyok");
		return;
	}
	
	if (line.startsWith("quit")) {
		baseEngineWrapper.quit()
			.then(function (x) { 
				setTimeout(function () { close(); }, 0);
			});
		return;
	}
	
	if (line.startsWith("position")) {
		let args = line.split(/\s+/);
		
		let moves;
		let movesIndex = line.indexOf("moves");
		if (movesIndex < 0 || line.substring(movesIndex + 5).trim() === "")
			moves = [];
		else
			moves = line.substring(movesIndex + 5).trim().split(/\s+/);
		
		if (args[1] === "startpos") {
			boardState = new Chess();
		} else {
			let fenIndex = line.indexOf("fen");
			let fenString;
			if (movesIndex < 0)
				fenString = line.substring(fenIndex + 3).trim();
			else
				fenString = line.substring(fenIndex + 3, movesIndex).trim();
			
			boardState = new Chess(fenString);
		}
		
		numPreviousMoves = 0;
		for (let move of moves) {
			boardState.move(move);
			numPreviousMoves++;
		}
		
		return;
	}
	
	if (line.startsWith("stop") && ponderGoCommand !== null) {	
		determineMove(boardState, numPreviousMoves, ponderGoCommand.searchmoves, ponderGoCommand.movetime, ponderGoCommand.isInfinite)
			.then(bestMove => {
				postMessage("bestmove " + bestMove);
			});
		return;
	}
	
	if (line.startsWith("go")) {
		let goCommand = processGoCommand(line);
		
		if (goCommand.isPonder) {
			ponderGoCommand = goCommand;
			return;
		} else {
			ponderGoCommand = null;
		}
				
		determineMove(boardState, numPreviousMoves, goCommand.searchmoves, goCommand.movetime, goCommand.isInfinite)
			.then(bestMove => {
				postMessage("bestmove " + bestMove);
			});
		return;
	}
	
	if (line.startsWith("ponderhit")) {		
		let currentPonderGoCommand = ponderGoCommand;
		ponderGoCommand = null;
		determineMove(boardState, numPreviousMoves, currentPonderGoCommand.searchmoves, currentPonderGoCommand.movetime, currentPonderGoCommand.isInfinite)
			.then(bestMove => {
				postMessage("bestmove " + bestMove);
			});
		return;
	}
};
