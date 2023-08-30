# Overview

This project includes two components:

* A [UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface) chess engine, available as a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
* A [Lichess bot](https://lichess.org/blog/WvDNticAAMu_mHKP/welcome-lichess-bots) that plays games on [Lichess](https://lichess.org/) using the above chess engine

The chess engine included in this project will attempt to sacrifice its queen whenever possible. However, once the queen is sacrificed, it plays normally from then onward. The specific algorithm the bot uses is as follows:

* For its first move, play a move at random. (This makes it more likely that each game will be different, instead of playing the same opening every time.)
* We define a "queen-sacrificing move" as a move that allows the opponent to immediately capture a queen. If one or more queen-sacrificing moves are possible, play the strongest such move. Otherwise (if no queen-sacrificing move exists), play the strongest move possible.
* A "base chess engine" is used to determine which moves are the strongest moves. This project currently uses [Stockfish](https://github.com/lichess-org/stockfish.js) as its base chess engine, although it is possible to substitute Stockfish with any other UCI chess engine. The base chess engine is given 250 milliseconds to think per move.
* Anytime the engine wants to promote a pawn to a queen, promote the pawn to a rook instead. (This ensures that we never promote a pawn to a queen, since then the bot would likely just sacrifice the newly-promoted queen on the next move.)

# How to run the bot

#### As a static website

The bot is implemented as a static website. Host the contents of this project as a static site (e.g. on localhost, GitHub Pages, or whichever server you'd like). Then, navigate to `index.html`, provide your [Lichess OAuth token](https://lichess.org/account/oauth/token) in the textbox, and click "Start bot". The bot will then be available on [Lichess](https://lichess.org/player/bots) and will accept challenges from other players and other bots. The bot will keep running as long as you keep the browser tab open. (Note, though, that browsers may throttle background tabs, which may prevent the bot from running properly if you minimize the browser tab or switch to a different tab.)

The bot will accept challenges under the following criteria:
* The game is a standard chess game (and not a chess variant).
* The time control is anything faster than "correspondence". (Correspondence chess can literally take days, so we avoid playing under this time control.)

For convenience, the bot is hosted at https://dtsudo.github.io/Dtsudo-Queen-Sacrifice-Bot/index.html using GitHub Pages. (You'll still have to provide your own Lichess account and OAuth token.)

#### As a command-line program

If you want to go with the more traditional route of running the bot as a command-line program, you'll likely have to make some changes to the codebase (and then run it in [Node.js](https://nodejs.org/en) or some other server environment).

#### Using Electron

You can also run the code in an [Electron](https://www.electronjs.org/) app. See the [Electron documentation](https://www.electronjs.org/docs/latest/) for details; in general, it is pretty easy to get a static site to run under Electron.

The following code can be used as a template for your main script:

    const { app, BrowserWindow, Menu } = require("electron");
    
    Menu.setApplicationMenu(null);
    
    const createWindow = () => {
    	let win = new BrowserWindow({
    		width: 1000,
    		height: 700,
    		useContentSize: true,
    		minWidth: 25,
    		minHeight: 25,
    		title: "Dtsudo Queen Sacrifice Bot",
    		webPreferences: {
    			backgroundThrottling: false
    		}
    	});
    	
    	win.loadFile("index.html");
    };
    
    app.whenReady().then(() => {
    	createWindow();
    });

# Licensing

See `LICENSE.txt` for licensing details.
