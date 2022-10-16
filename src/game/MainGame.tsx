import React from "react";
import "./MainGame.css";
import * as game from "./game";
import ProgressBar from "./ProgressBar";
import Scoreboard from "./Scoreboard";
import * as utils from "./utils";

interface InitialState {
  snake: game.Block[];
  moves: game.Direction[];
  fruit: game.Fruit;
  bomb: game.Bomb;
  bombIsActive: boolean;
  isPlaying: boolean;
  isGameOver: boolean;
  speed: number;
  score: number;
  appleTimeCounter: number;
  bombTimeCounter: number;
  intervals: number[];
  username: string;
  scoreSubmited: boolean;
}

const SCOREBOARD_KEY = "snake-scoreboard";
const BOARD_SIZE = 400;
const PIXEL_SIZE = BOARD_SIZE / 20;
const PIXEL_RADIUS = PIXEL_SIZE / 2;
const PIXELS = Math.floor(BOARD_SIZE / PIXEL_SIZE) - 2;

const APPLE = ["🍎"];
const BOMB = ["💣"];

const SNAKE_SPEED = 100;
const OPTIMAL_FRAME_RATE = (1 / 60) * 1000;

const SNAKE: game.Block[] = [
  { x: 5, y: 1, direction: "right", isCorner: false, radius: 0 },
  { x: 4, y: 1, direction: "right", isCorner: false, radius: 0 },
];

const INITIAL_STATE: InitialState = {
  snake: SNAKE,
  moves: [game.Directions.right],
  fruit: game.randomFruit(SNAKE, PIXELS, APPLE),
  bomb: {
    //making sure the bomb is not
    value: BOMB[0],
    x: -100,
    y: -100,
  },
  bombIsActive: false,
  isPlaying: false,
  isGameOver: false,
  speed: SNAKE_SPEED,
  score: 0,
  appleTimeCounter: 0,
  bombTimeCounter: 0,
  intervals: [], //used to clear intervals
  username: "",
  scoreSubmited: false,
};

let animationFrameId = 0;

export default class Game extends React.Component<{}, InitialState> {
  public state: InitialState = INITIAL_STATE;

  get ctx() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    return canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  constructor(props: {}) {
    super(props);
    this.move = utils.throttle(SNAKE_SPEED, this.move);
    this.draw = utils.throttle(OPTIMAL_FRAME_RATE, this.draw);
  }

  public componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyUp);
    this.stop();
  }

  public componentDidMount() {
    document.addEventListener("keyup", this.handleKeyUp);
    this.draw();
  }

  //keyboard input handler
  private handleKeyUp = ({ code }: KeyboardEvent) => {
    const move = game.decodeDirectionKey(code);
    if (move) {
      this.setDirection(move);
    }
  };

  //canvas rendering
  public render() {
    return (
      <div className="game flex flex-row items-center justify-center">
        <div className="container flex flex-row items-center justify-center bg-green-700 w-128 h-128 ">
          <div
            className="canvas-container relative"
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          >
            {this.state.isPlaying && this.renderScore()}
            {this.renderOverlay()}
            <div>
              <canvas
                className="text-center border-solid border-2 border-green-900"
                id="canvas"
                width={BOARD_SIZE}
                height={BOARD_SIZE}
              />
            </div>
          </div>
        </div>
        <Scoreboard key={this.state.scoreSubmited} />
      </div>
    );
  }

  //render score and apple/bomb timers at the top of the screen
  private renderScore() {
    return (
      <div className="absolute flex flex-row justify-between items-center text-white text-2xl font-bold -top-10 w-96">
        <div className="score">Score: {this.state.score * 100}</div>
        {this.state.bombIsActive && (
          <div className="timeBomb w-24 flex flex-row justify-center items-center">
            <div className="mr-2">💣</div>
            <ProgressBar
              percent={((30000 - this.state.bombTimeCounter) / 1000) * 3.33}
            />
          </div>
        )}
        <div className="timeApple w-24 flex flex-row justify-center items-center">
          <div className="mr-2">🍎</div>
          <ProgressBar percent={(10000 - this.state.appleTimeCounter) / 100} />
        </div>
      </div>
    );
  }

  //submit the score to the localStorage
  private submitScore = () => {
    const score = this.state.score * 100;
    const username = this.state.username;
    const scoreboard = { username: username, score: score };
    const scoreboardArray = [];

    if (localStorage.getItem(SCOREBOARD_KEY) === null) {
      scoreboardArray.push(scoreboard);
      localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(scoreboardArray));
    } else {
      const scoreboardArray = JSON.parse(
        localStorage.getItem(SCOREBOARD_KEY) || "[]"
      );
      scoreboardArray.push(scoreboard);
      localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(scoreboardArray));
    }
    this.setState({ scoreSubmited: true });
  };

  //render overlay when game is over or not started
  private renderOverlay() {
    if (!this.state.isGameOver && this.state.isPlaying) {
      return null;
    }
    return (
      <div>
        <div className="canvas-overlay flex flex-col items-center justify-center relative">
          <div className="overlay-message absolute flex flex-col items-center justify-center text-white text-4xl font-bold top-10 drop-shadow-lg">
            <div className="py-10">
              {this.state.isGameOver ? "GAME OVER" : "SNAKE GAME"}
            </div>
            <div className="flex flex-col">
              {this.state.isGameOver ? (
                this.state.scoreSubmited ? (
                  <>
                    <div className="text-center pb-4 text-2xl">
                      Score: {this.state.score * 100}
                    </div>
                    <button
                      className="overlay-button font-mono bg-green-700 p-2 rounded-lg hover:bg-green-500"
                      onClick={this.reset}
                    >
                      NEW GAME
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center pb-4 text-2xl">
                      Score: {this.state.score * 100}
                    </div>
                    <div className="flex flex-row">
                      <input
                        placeholder="Username"
                        type="text"
                        className="my-2 placeholder:italic placeholder:text-slate-400 block bg-white w-full text-black border border-slate-300 rounded-md py-2 pl-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
                        onChange={(e) =>
                          this.setState({ username: e.target.value })
                        }
                      />
                      <button
                        className="overlay-button font-mono  text-base rounded-lg  my-2 py-2 px-2 ml-4 "
                        onClick={this.submitScore}
                      >
                        Submit
                      </button>
                    </div>
                    <button
                      className="overlay-button font-mono  p-2 w-max self-center rounded-lg text-3xl  my-2"
                      onClick={this.reset}
                    >
                      NEW GAME
                    </button>
                  </>
                )
              ) : (
                <button
                  className="overlay-button font-mono  p-2 text-3xl rounded-lg  "
                  onClick={this.start}
                >
                  {animationFrameId ? null : "START"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  //sets direction of snake movement and adds to moves array, determines if player input is valid
  private setDirection(direction: game.Direction) {
    const move =
      utils.last(this.state.moves) || utils.head(this.state.snake).direction;

    const isIllegalMove =
      move === direction || move === game.OppositeDirections[direction];

    if (isIllegalMove) {
      return;
    }

    this.setState(
      (state) => ({ moves: state.moves.concat(direction) }),
      this.move
    );
  }

  //draws grid of pixels 20x20
  private drawGrid = () => {
    const context = this.ctx;

    context.fillStyle = "black";
    context.lineWidth = 0.01 * PIXEL_RADIUS;

    for (let x = 0; x <= BOARD_SIZE; x += PIXEL_SIZE) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BOARD_SIZE);
      context.stroke();
    }

    for (let y = 0; y <= BOARD_SIZE; y += PIXEL_SIZE) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BOARD_SIZE, y);
      context.stroke();
    }
  };

  //draw the snake, determines direction of movement and changes their border radius
  private drawPixel = (block: game.Block, i: number, snake: game.Block[]) => {
    const { direction } = block;
    const { up, down, left, right } = game.Directions;

    const isHead = i === 0;
    const isLast = i === snake.length - 1;

    if (isHead) {
      return utils.roundRect(
        this.ctx,
        block.x * PIXEL_SIZE,
        block.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE,
        {
          tl: direction === up || direction === left ? PIXEL_RADIUS : 0,
          tr: direction === up || direction === right ? PIXEL_RADIUS : 0,
          bl: direction === down || direction === left ? PIXEL_RADIUS : 0,
          br: direction === down || direction === right ? PIXEL_RADIUS : 0,
        },
        true,
        false
      );
    }
    if (block.isCorner && typeof block.radius === "object") {
      return utils.roundRect(
        this.ctx,
        block.x * PIXEL_SIZE,
        block.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE,
        block.radius,
        true,
        false
      );
    }
    if (isLast) {
      return utils.roundRect(
        this.ctx,
        block.x * PIXEL_SIZE,
        block.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE,
        {
          tl: direction === down || direction === right ? PIXEL_RADIUS : 0,
          tr: direction === down || direction === left ? PIXEL_RADIUS : 0,
          bl: direction === up || direction === right ? PIXEL_RADIUS : 0,
          br: direction === up || direction === left ? PIXEL_RADIUS : 0,
        },
        true,
        false
      );
    }
    this.ctx.fillRect(
      block.x * PIXEL_SIZE,
      block.y * PIXEL_SIZE,
      PIXEL_SIZE,
      PIXEL_SIZE
    );
  };

  //scales the canvas to the size of the window depending on the device
  private scaleCanvas = () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    utils.scaleCanvas(canvas, ctx, BOARD_SIZE, BOARD_SIZE);
  };

  //draw function is called every frame
  private draw = () => {
    this.scaleCanvas();
    this.clear();
    this.drawGrid();
    this.state.snake.forEach((block, i) => {
      const isHead = !i;
      this.ctx.fillStyle = isHead ? "#06283D" : i % 2 ? `#47B5FF` : "#1363DF";
      this.drawPixel(block, i, this.state.snake);
    });
    this.ctx.font = `${PIXEL_SIZE * 1.2}px Segoe UI Emoji`;
    if (this.state.bombTimeCounter >= 30000) {
      this.setState({ bombTimeCounter: 0 });
    }
    if (this.state.appleTimeCounter >= 10000) {
      this.setState({
        appleTimeCounter: 0,

        fruit: game.randomFruit(SNAKE, PIXELS, APPLE),
      });
    }
    this.ctx.fillText(
      this.state.fruit.value,
      this.state.fruit.x * PIXEL_SIZE - 2,
      this.state.fruit.y * PIXEL_SIZE + 16
    );
    if (this.state.bombIsActive) {
      this.ctx.fillText(
        this.state.bomb.value,
        this.state.bomb.x * PIXEL_SIZE - 2,
        this.state.bomb.y * PIXEL_SIZE + 16
      );
    }
  };

  //play
  private play = () => {
    if (this.state.isPlaying && !this.state.isGameOver) {
      this.move();

      this.draw();
    }

    animationFrameId = window.requestAnimationFrame(this.play);
  };

  //clear the canvas
  private clear = () => this.ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  //reload initial state
  private reset = () => {
    this.setState(
      {
        ...INITIAL_STATE,
      },
      this.draw
    );
  };

  //stop the game
  private stop = () => {
    window.cancelAnimationFrame(animationFrameId);
    //clear intervals of timers
    for (let i = 0; i < this.state.intervals.length; i++) {
      window.clearInterval(this.state.intervals[i]);
    }
    animationFrameId = 0;
  };

  //start game
  private start = () => {
    if (animationFrameId) {
      this.stop();
    }
    //counter of time for apple and bomb
    this.state.intervals.push(
      window.setInterval(() => {
        this.setState({
          appleTimeCounter: this.state.appleTimeCounter + 1000,
          bombTimeCounter: this.state.bombTimeCounter + 1000,
        });
      }, 1000)
    );
    //counter of time and generate new bomb randomly
    this.state.intervals.push(
      window.setInterval(() => {
        this.setState({
          bombIsActive: true,
          bomb: game.randomBomb(SNAKE, PIXELS, BOMB),
        });
      }, 30000)
    );

    this.setState({ isPlaying: true }, this.play);
  };

  //speed multiplier based on score, higher score = faster by *1.25
  private speedMultiplier = () => {
    if (this.state.score > 0) {
      if (Number.isInteger((this.state.score + 1) / 5)) {
        this.setState({
          speed: this.state.speed * 1.25,
        });
      }
    }
  };

  //move of the snake
  private move = () => {
    this.setState((state) => {
      // move snake
      const move = state.moves.shift();
      const snake = [...state.snake];
      const direction = move || utils.head(state.snake).direction;

      snake.unshift({
        ...game.moveBlock(direction, utils.head(state.snake), {
          board: BOARD_SIZE,
          pixel: PIXEL_SIZE,
        }),
        direction,
      });
      snake.pop();

      const [head, ...tail] = snake;
      const isCollision = game.hasCollidedWith(head);
      const isCollisionWall = game.hasCollidedWithWall(head);
      // collided with self or wall
      if (tail.some(isCollision) || isCollisionWall) {
        this.stop();
        this.setState({
          isGameOver: true,
        });
        return { ...state, snake, move, isPlaying: false, isGameOver: true };
      }
      //colided with bomb
      if (isCollision(state.bomb)) {
        this.stop();
        this.setState({
          isGameOver: true,
        });
        return { ...state, snake, move, isPlaying: false, isGameOver: true };
      }

      // collided with fruit
      if (isCollision(state.fruit)) {
        this.setState({
          appleTimeCounter: 0,
        });
        // add new block to snake's end
        const last = utils.last(snake);
        snake.push(
          game.moveBlock(game.OppositeDirections[last.direction], last, {
            board: BOARD_SIZE,
            pixel: PIXEL_SIZE,
          })
        );

        // increment score
        const score = state.score + 1;
        this.speedMultiplier();

        return {
          ...state,
          snake,
          move,
          score,
          fruit: game.randomFruit(snake, PIXELS, APPLE),
        };
      }

      // just moved
      return { ...state, snake, move };
    });
  };
}
