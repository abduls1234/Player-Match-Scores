const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Is Running At http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayersDbToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API - 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;

  const playersArray = await db.all(getPlayersQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayersDbToResponseObject(eachPlayer)
    )
  );
});

// API - 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);

  response.send(convertPlayersDbToResponseObject(player));
});

// API - 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
        
    WHERE
        player_id = ${playerId};`;

  await db.run(updatePlayerQuery);

  response.send("Player Details Updated");
});

// API - 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);

  response.send(convertMatchDbToResponseObject(match));
});

// API - 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerMatchesQuery = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id = ${playerId};`;

  const playerMatchesArray = await db.all(getPlayerMatchesQuery);

  response.send(
    playerMatchesArray.map((eachPlayer) =>
      convertMatchDbToResponseObject(eachPlayer)
    )
  );
});

//API - 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchPlayerQuery = `
  SELECT
    * 
  FROM
    player_details NATURAL JOIN player_match_score
  WHERE
    match_id = ${matchId};`;

  const specificMatchPlayer = await db.all(getSpecificMatchPlayerQuery);

  response.send(
    specificMatchPlayer.map((player) =>
      convertPlayersDbToResponseObject(player)
    )
  );
});

// API - 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getStatsOfSpecificPlayerQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        
    FROM
        player_match_score
        NATURAL JOIN player_details
    WHERE
        player_id = ${playerId};`;

  const stats = await db.get(getStatsOfSpecificPlayerQuery);
  response.send(stats);
});

module.exports = app;
