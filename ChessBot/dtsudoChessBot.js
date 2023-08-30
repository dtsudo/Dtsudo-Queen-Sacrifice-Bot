
import processLichessGame from "./dtsudoChessBotGameHandling.js"

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

let startDtsudoChessBot = function (lichessToken, webWorkerFileForUciChessEngine, webWorkerFileType) {
	
	let processLichessEvent = function (lichessEvent) {
		if (lichessEvent.type === "challenge") {
			let challengeDeclineReason = null;
			if (lichessEvent.challenge.variant.key !== "standard")
				challengeDeclineReason = "standard";
			if (lichessEvent.challenge.speed === "correspondence")
				challengeDeclineReason = "tooSlow";
			if (challengeDeclineReason === null)
				fetch("https://lichess.org/api/challenge/" + lichessEvent.challenge.id + "/accept", {
					method: "POST",
					headers: {
						Authorization: lichessToken
					}
				});
			else
				fetch("https://lichess.org/api/challenge/" + lichessEvent.challenge.id + "/decline", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: lichessToken
					},
					body: "reason=" + challengeDeclineReason
				});
		} else if (lichessEvent.type === "gameStart") {
			let gameId = lichessEvent.game.gameId;
			let isWhite = lichessEvent.game.color === "white";
			if (lichessEvent.game.fen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
				processLichessGame(gameId, isWhite, lichessToken, webWorkerFileForUciChessEngine, webWorkerFileType);
		}
	};

	let response = fetch("https://lichess.org/api/stream/event", {
		method: "GET",
		headers: {
			Authorization: lichessToken
		}
	});
	
	response
		.then(readStream(lichessEvent => processLichessEvent(lichessEvent)));
};

export default startDtsudoChessBot; 
