const axios = require("axios");

const BLACKHAWKS_ID = 16;

const playerArg =
  process.argv.indexOf("-player") > -1
    ? process.argv[process.argv.indexOf("-player") + 1]
    : null;

const expandedArg = process.argv.indexOf("-expanded") > -1 ? true : false;

const onPaceArg = process.argv.indexOf("-onpace") > -1 ? true : false;

const yearArg =
  process.argv.indexOf("-year") > -1
    ? process.argv[process.argv.indexOf("-year") + 1]
    : null;

axios
  .get(`https://statsapi.web.nhl.com/api/v1/teams/${BLACKHAWKS_ID}/roster`)
  .then((response) => {
    const player = response.data.roster.find((player) =>
      player.person.fullName.toLowerCase().includes(playerArg)
    );
    //console.log(response.data.stats[0].splits);
    let params = {};
    if (onPaceArg) {
      params.stats = "onPaceRegularSeason";
    } else {
      params.stats = "statsSingleSeason";
    }
    if (yearArg) {
      params.season = yearArg;
    } else {
      params.season = "20212022";
    }

    axios
      .get(
        `https://statsapi.web.nhl.com/api/v1/people/${player.person.id}/stats`,
        { params: params }
      )
      .then((response) => {
        const raw = response.data.stats[0].splits[0];
        formatResponse(raw, player);
      });
  });

fixDecimal = (number) => (Math.round(number * 100) / 100).toFixed(2);

formatResponse = (data, player) => {
  const stats = data.stat;
  const season = `${data.season.substring(0, 4)}-${data.season.substring(4)}`;
  console.log(`----- ${player.person.fullName} ${season} -----`);
  console.log(`Goals:       ${stats.goals}`);
  console.log(`Assists:     ${stats.assists}`);
  console.log(`Points:      ${stats.points}`);
  console.log(`Games:       ${stats.games}`);
  console.log(`PPG:         ${fixDecimal(stats.points / stats.games)}`);
};
