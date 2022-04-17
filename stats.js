const axios = require("axios");

const BLACKHAWKS_ID = 16;

const baseURL = `https://statsapi.web.nhl.com/api/v1`;

const playerIndex =
  process.argv.indexOf("-player") > -1
    ? process.argv.indexOf("-player")
    : process.argv.indexOf("-p");
const playerArg =
  playerIndex > -1 ? process.argv[playerIndex + 1].toLowerCase() : null;

const teamIndex =
  process.argv.indexOf("-team") > -1
    ? process.argv.indexOf("-team")
    : process.argv.indexOf("-t");
const teamArg = teamIndex ? process.argv[teamIndex + 1].toLowerCase() : null;

const expandedArg = process.argv.indexOf("--expanded") > -1 ? true : false;

const ploffsArg = process.argv.indexOf("--playoffs") > -1 ? true : false;

const onPaceArg = process.argv.indexOf("--onpace") > -1 ? true : false;

const yearArg =
  process.argv.indexOf("-year") > -1
    ? process.argv[process.argv.indexOf("-year") + 1]
    : null;

const main = async () => {
  const teamId = await getTeamId();
  const player = await getPlayer(teamId);
  getPlayerStats(player);
};

const getTeamId = async () => {
  if (!teamArg) {
    return BLACKHAWKS_ID;
  }

  const response = await axios.get(`${baseURL}/teams`);
  if (response && response.data && response.data.teams) {
    const team = response.data.teams.find((team) =>
      team.name.toLowerCase().includes(teamArg)
    );
    if (team) {
      return team.id;
    } else {
      return null;
    }
  } else {
    error();
  }
  console.log(response.data);
};

const getPlayer = async (teamId) => {
  if (!teamId) {
    console.log("Couldn't find team!");
    return null;
  }

  const response = await axios.get(`${baseURL}/teams/${teamId}/roster`);

  if (response && response.data && response.data.roster) {
    const player = response.data.roster.find((player) =>
      player.person.fullName.toLowerCase().includes(playerArg)
    );
    return player;
  } else {
    error();
  }
};

const getPlayerStats = async (player) => {
  if (!player) {
    return console.log("Couldn't find player!");
  }
  const playerId = player.person.id;

  let params = {};
  if (onPaceArg) {
    params.stats = "onPaceRegularSeason";
  } else if (ploffsArg) {
    params.stats = "statsSingleSeasonPlayoffs";
  } else {
    params.stats = "statsSingleSeason";
  }
  if (yearArg) {
    params.season = yearArg;
  } else {
    params.season = "20212022";
  }

  axios
    .get(`${baseURL}/people/${playerId}/stats`, { params: params })
    .then((response) => {
      if (
        response.data &&
        response.data.stats.length > 0 &&
        response.data.stats[0].splits.length > 0
      ) {
        const raw = response.data.stats[0].splits[0];
        formatResponse(raw, player);
      } else {
        console.log(`No stats for ${params.season}`);
      }
    });
};

fixDecimal = (number) => (Math.round(number * 100) / 100).toFixed(2);

formatResponse = (data, player) => {
  if (player.position.type === "Goalie") {
    return formatGoalieResponse(data, player);
  }
  const stats = data.stat;
  const season = `${data.season.substring(0, 4)}-${data.season.substring(4)}`;
  console.log(`----- ${player.person.fullName} ${season} -----`);
  console.log(`Goals:         ${stats.goals}`);
  console.log(`Assists:       ${stats.assists}`);
  console.log(`Points:        ${stats.points}`);
  console.log(`Games:         ${stats.games}`);
  console.log(`PPG:           ${fixDecimal(stats.points / stats.games)}`);
  console.log(`+/-:           ${stats.plusMinus}`);
};

formatGoalieResponse = (data, player) => {
  const stats = data.stat;
  const season = `${data.season.substring(0, 4)}-${data.season.substring(4)}`;
  console.log(`----- ${player.person.fullName} ${season} -----`);
  console.log(`Wins:          ${stats.wins}`);
  console.log(`Losses:        ${stats.losses}`);
  console.log(`Games:         ${stats.games}`);
  console.log(`Save %:        ${stats.savePercentage}`);
  console.log(`GAA:           ${stats.goalAgainstAverage}`);
  console.log(`Shutouts:      ${stats.shutouts}`);
};

const error = () => console.log("Connection error. Try again");

main();
