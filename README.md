# nhl_cli

CLI for getting NHL stats. Currently supports retrieving stats for one player at a time.

## Setup

`$ npm i`

## Use

### Example call

`$ node stats.js -team Blackhawks -player Kane --onpace --expanded`

### Arguments

- `-team [team]` or `-t [team]`: Team player is on (*required).
- `-player [player]` or `-p [player]`: Player (*required).
- `-year [year]`: Stats for a previous season. Ex: 20152016
- `--onpace`: On-pace stats. Only works for current regular season.
- `--expanded`: Show more detailed stats.
- `--playoffs`: Playoff stats.
- `--help`: Show all options.
