import * as hp_prime from "hp_prime";
import { ISKEYDOWN } from "hp_prime";

const black = hp_prime.COLOURS["#000000"];
const white = hp_prime.COLOURS["#ffffff"];
let x1 = 10;
let y1 = 10;
let x2 = 20;
let y2 = 20;

function ON_TICK() {
  hp_prime.RECT_P(hp_prime.G0, 0, 0, 320, 240, black, black);

  if (ISKEYDOWN(hp_prime.KEYS.Up)) {
    y1 += 1;
    y2 += 1;
  }

  if (ISKEYDOWN(hp_prime.KEYS.Down)) {
    y1 -= 1;
    y2 -= 1;
  }

  if (ISKEYDOWN(hp_prime.KEYS.Left)) {
    x1 -= 1;
    x2 -= 1;
  }

  if (ISKEYDOWN(hp_prime.KEYS.Right)) {
    x1 += 1;
    x2 += 1;
  }

  hp_prime.RECT_P(hp_prime.G0, x1, y1, x2, y2, white, white);
}
