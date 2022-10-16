import React from "react";

const ProgressBar = (props: any) => {
  return (
    <div className="w-full bg-emerald-500 rounded-full h-1.5">
      <div
        className="bg-emerald-300 h-1.5 rounded-full "
        style={{ width: `${props.percent}%` }}
      ></div>
    </div>
  );
};
export default ProgressBar;
