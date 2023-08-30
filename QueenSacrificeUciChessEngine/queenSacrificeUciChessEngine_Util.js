
import { Chess } from "../ChessJs/chess.js"

let processGoCommand = function (commandStr) {
	commandStr = commandStr.trim().substring(2).trim();
	
	let searchmoves = null;
	let isPonder = false;
	let movetime = 50; // arbitrary
	let isInfinite = false;
	
	let getIndexOfNextToken = function (str) {
		let indexes = [
				str.indexOf("searchmoves", 1),
				str.indexOf("ponder", 1),
				str.indexOf("wtime", 1),
				str.indexOf("btime", 1),
				str.indexOf("winc", 1),
				str.indexOf("binc", 1),
				str.indexOf("movestogo", 1),
				str.indexOf("depth", 1),
				str.indexOf("nodes", 1),
				str.indexOf("mate", 1),
				str.indexOf("movetime", 1),
				str.indexOf("infinite", 1)
			].filter(x => x >= 0);
		
		indexes.sort((a, b) => a - b);
		
		if (indexes.length === 0)
			return null;
	
		return indexes[0];
	};
	
	while (true) {
		if (commandStr === "")
			break;
		
		if (commandStr.startsWith("searchmoves")) {			
			let indexOfNextToken = getIndexOfNextToken(commandStr);
					
			let searchmovesSubstring;
					
			if (indexOfNextToken !== null) {
				searchmovesSubstring = commandStr.substring(11, indexOfNextToken).trim();
				commandStr = commandStr.substring(indexOfNextToken).trim();
			} else {
				searchmovesSubstring = commandStr.substring(11).trim();
				commandStr = "";
			}
			
			searchmoves = searchmovesSubstring.split(/\s+/);
			continue;
		}
		
		if (commandStr.startsWith("ponder")) {
			isPonder = true;
			commandStr = commandStr.substring(6).trim();
			continue;
		}
		
		if (commandStr.startsWith("wtime")
				|| commandStr.startsWith("btime")
				|| commandStr.startsWith("winc")
				|| commandStr.startsWith("binc")
				|| commandStr.startsWith("movestogo")
				|| commandStr.startsWith("depth")
				|| commandStr.startsWith("nodes")
				|| commandStr.startsWith("mate")) {
			let indexOfNextToken = getIndexOfNextToken(commandStr);
			if (indexOfNextToken === null)
				commandStr = "";
			else
				commandStr = commandStr.substring(indexOfNextToken).trim();
			
			continue;
		}
		
		if (commandStr.startsWith("movetime")) {
			let indexOfNextToken = getIndexOfNextToken(commandStr);
			
			if (indexOfNextToken === null) {
				movetime = parseInt(commandStr.substring(8).trim(), 10);
				commandStr = "";
			} else {
				movetime = parseInt(commandStr.substring(8, indexOfNextToken).trim(), 10);
				commandStr = commandStr.substring(indexOfNextToken).trim();
			}
			
			continue;
		}
		
		if (commandStr.startsWith("infinite")) {
			isInfinite = true;
			movetime = null;
			commandStr = commandStr.substring(8).trim();
			continue;
		}
		
		throw new Error("unrecognized command: " + commandStr);
	}
	
	return {
		searchmoves: searchmoves,
		isPonder: isPonder,
		movetime: movetime,
		isInfinite: isInfinite
	};
};

let getMovesThatSacrificeTheQueen = function (chess) {
	
	let currentMoves = chess.moves({ verbose: true });
		
	let movesThatSacrificeTheQueen = [];

	for (let testMove of currentMoves) {
		let chess2 = new Chess(chess.fen());
		chess2.move(testMove);
		for (let opponentMove of chess2.moves({ verbose: true })) {
			if (opponentMove.captured && opponentMove.captured === "q") {
				movesThatSacrificeTheQueen.push(testMove);
				break;
			}
		}
	}
	
	return movesThatSacrificeTheQueen;
};

let getBestMoveFromBestMoveString = function (str) {
	str = str.trim();
	
	if (!str.startsWith("bestmove")) {
		throw new Error("Expected input to start with bestmove: " + str);
	}
	
	let ponderIndex = str.indexOf("ponder");
	
	if (ponderIndex >= 0)
		str = str.substring(0, ponderIndex);
	
	return str.substring(8).trim();
};

let getRandomElementFromArray = function (array) {
	return array[Math.floor(Math.random() * array.length)];
};

export { getRandomElementFromArray, getBestMoveFromBestMoveString, processGoCommand, getMovesThatSacrificeTheQueen };
