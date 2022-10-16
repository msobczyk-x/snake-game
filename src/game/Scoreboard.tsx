import React from "react";
import "./MainGame.css";
import { useEffect, useState } from "react";

const Scoreboard = (props: any) => {
  const [score, setScore] = useState([]);
  useEffect(() => {
    const data = localStorage.getItem("snake-scoreboard");
    if (data !== null) {
      setScore(JSON.parse(data));
    }
  }, [props.update]);

  return (
    <div className="flex flex-col items-center scoreboard w-48 h-128 text-white text-3xl border-l-2 border-green-900 font-sans ">
      <div className="scoreboard-header py-3 font-bold drop-shadow-lg border-b-2 border-green-900 pb-0">
        Scoreboard
      </div>
      <div className="scoreboard-body flex flex-col w-44">
        <div className="scoreboard-item flex flex-row justify-between text-sm w-44 font-bold drop-shadow-lg pt-2">
          <div className="username">Username</div>
          <div className="score">Score</div>
        </div>
        {score
          ? score.map((val: any, key: any) => {
              return (
                <div
                  key={key}
                  className="scoreboard-item flex flex-row justify-between text-sm w-44"
                >
                  <div className="username">{val.username}</div>
                  <div className="score">{val.score}</div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
};
export default Scoreboard;
