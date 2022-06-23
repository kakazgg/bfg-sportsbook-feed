import "./styles.css";
import React from "react";
import {
  MarketType,
  getMarket,
  Locale,
  getSportsName
} from "@cloudbet/market-helper";
function getSport(sport, apiKey) {
  return fetch(`https://sports-api.cloudbet.com/pub/v2/odds/sports/${sport}`, {
    headers: {
      "X-Api-Key": apiKey,
      "cache-control": "max-age=600"
    }
  });
}
function getCompetition(competition, apiKey) {
  return fetch(
    `https://sports-api.cloudbet.com/pub/v2/odds/competitions/${competition}`,
    {
      headers: {
        "X-Api-Key": apiKey,
        "cache-control": "max-age=600"
      }
    }
  );
}
const sports = ["soccer", "basketball", "tennis"];
const sportMarkets = {
  soccer: [MarketType.soccer_match_odds],
  basketball: [MarketType.basketball_1x2],
  tennis: [MarketType.tennis_winner]
};
export default function App() {
  const [apiKey, setApiKey] = React.useState("");
  const [sport, setSport] = React.useState(sports[0]);
  const [loading, setLoading] = React.useState(false);
  const [competitions, setCompetitions] = React.useState([]);
  React.useEffect(() => {
    if (!sport || !apiKey) {
      return;
    }
    setLoading(true);
    getSport(sport, apiKey)
      .then((response) => {
        setLoading(false);
        return response.json();
      })
      .then((body) => {
        setCompetitions(body.categories.flatMap((c) => c.competitions));
      });
  }, [apiKey, sport]);

  return (
    <div className="App">
      <div>
        <label for="apiKey">API Key</label>
        <input
          className="apikey-field"
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div>
        <label for="sport">Sport</label>
        <select value={sport} onChange={(e) => setSport(e.target.value)}>
          {sports.map((s) => (
            <option value={s}>{getSportsName(s, Locale.en)}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <Loading />
      ) : (
        competitions.map((c) => (
          <Competition
            competition={c}
            apiKey={apiKey}
            key={c.key}
            sportKey={sport}
          />
        ))
      )}
    </div>
  );
}

function Competition({ competition, apiKey, sportKey }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const loadEvents = (key) => {
    setExpanded((e) => !e);
    if (events.length || loading) {
      return;
    }
    setLoading(true);
    getCompetition(key, apiKey)
      .then((response) => response.json())
      .then((body) => {
        setEvents(body.events);
        setLoading(false);
      });
  };
  return (
    <div className="competition">
      <div
        className="competition-title"
        onClick={() => loadEvents(competition.key)}
      >
        {competition.name}
      </div>
      {expanded && (
        <div>
          {loading ? (
            <Loading />
          ) : (
            events.map((e) => (
              <Event event={e} key={e.id} sportKey={sportKey} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
function Event({ event, sportKey }) {
  const eventMarkets = React.useMemo(() => {
    const [markets, err] = getMarket(event, sportMarkets[sportKey][0]);
    if (err) {
      return [];
    }
    return markets;
  }, [event, sportKey]);
  if (!eventMarkets || !eventMarkets.length) {
    return null;
  }
  return (
    <div>
      <div className="event-title">{event.name}</div>
      {eventMarkets.map((m) => {
        const line = m.lines[0];
        if (!line) {
          return null;
        }
        return (
          <div className="selections">
            {line.map((outcome) => (
              <div className="selection">
                {outcome.name} <br />
                {outcome.back.price}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Loading() {
  return <div className="loading">Loading...</div>;
}
