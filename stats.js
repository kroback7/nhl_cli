const axios = require("axios");

const BLACKHAWKS_ID = 16;
const CHAR_BEFORE_STATS = 17;

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

const expandedArg =
  process.argv.indexOf("--expanded") > -1 || process.argv.indexOf("--e") > -1;

const ploffsArg = process.argv.indexOf("--playoffs") > -1;

const onPaceArg = process.argv.indexOf("--onpace") > -1;

const helpArg = process.argv.indexOf("--help") > -1;

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
noDecimal = (number) => (Math.round(number * 100) / 100).toFixed(0);

formatResponse = (data, player) => {
  if (player.position.type === "Goalie") {
    return formatGoalieResponse(data, player);
  }
  const stats = data.stat;
  const season = `${data.season.substring(0, 4)}-${data.season.substring(4)}`;
  printHeader(player, season);
  p(`Goals`, stats.goals);
  p(`Assists`, stats.assists);
  p(`Points`, stats.points);
  p(`Games`, stats.games);
  p(`PPG`, fixDecimal(stats.points / stats.games));
  p(`+/-`, stats.plusMinus);
  formatExpandedResponse(stats);
};

const formatExpandedResponse = (stats) => {
  if (!expandedArg) {
    return;
  }

  p(`PIM`, stats.pim);
  p(`Hits`, stats.hits);
  p(`Blocks`, stats.blocked);
  p(`Shots`, stats.shots);
  p(`Shooting %`, fixDecimal(stats.goals / stats.shots));
  p(`PP Goals`, stats.powerPlayGoals);
  p(`PP Points`, stats.powerPlayPoints);
  p(`PK Goals`, stats.shortHandedGoals);
  p(`PK Points`, stats.shortHandedPoints);
  p(
    `5v5 Points`,
    stats.points - (stats.shortHandedPoints + stats.powerPlayPoints)
  );
  p(`Shifts`, stats.shifts);

  p(`TOI`, stats.timeOnIce);
  p(`5v5 TOI`, stats.evenTimeOnIce);
  p(`PP TOI`, stats.powerPlayTimeOnIce);
  p(`PK TOI`, stats.shortHandedTimeOnIce);
  p(`Avg TOI`, stats.timeOnIcePerGame);
  p(`Avg 5v5 TOI`, stats.evenTimeOnIcePerGame);
  p(`Avg PP TOI`, stats.powerPlayTimeOnIcePerGame);
  p(`Avg PK TOI`, stats.shortHandedTimeOnIcePerGame);
};

const formatGoalieResponse = (data, player) => {
  const stats = data.stat;
  const season = `${data.season.substring(0, 4)}-${data.season.substring(4)}`;
  printHeader(player, season);
  p(`Wins`, stats.wins);
  p(`Losses`, stats.losses);
  p(`OT Losses`, stats.ot);
  stats.ties ? p(`Ties`, stats.ties) : null;
  p(`Games`, stats.games);
  p(`Save %`, stats.savePercentage);
  p(`GAA`, stats.goalAgainstAverage);
  p(`Shutouts`, stats.shutouts);
  formatExpandedGoalieResponse(stats);
};

formatExpandedGoalieResponse = (stats) => {
  if (!expandedArg) {
    return;
  }

  p(`Saves`, stats.saves);
  p(`Goals Against`, stats.goalsAgainst);
  p(`Shots Faced`, stats.shotsAgainst);
  p(`PP Saves`, stats.powerPlaySaves);
  p(`PK Saves`, stats.shortHandedSaves);
  p(`5v5 Saves`, stats.evenSaves);
  p(`PP Save %`, `0.${noDecimal(stats.powerPlaySavePercentage * 10)}`);
  p(`PK Save %`, `0.${noDecimal(stats.shortHandedSavePercentage * 10)}`);
  p(`5v5 Save %`, `0.${noDecimal(stats.evenStrengthSavePercentage * 10)}`);
  p(`Started`, stats.gamesStarted);
};

const error = () => console.log("Connection error. Try again");

const p = (statName, stat) => {
  const spaceCount = CHAR_BEFORE_STATS - (statName.length + 1);
  let spaces = " ".repeat(spaceCount > 0 ? spaceCount : 1);
  console.log(`${statName}:${spaces}${stat}`);
};

const printHeader = (player, season) => {
  console.log(
    `----- ${player.person.fullName} ${player.jerseyNumber} (${player.position.abbreviation}) ${season} -----`
  );
};

main();
