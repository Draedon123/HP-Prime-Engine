/* eslint-disable @typescript-eslint/no-explicit-any */

export const on: () => void;

export type EventListenerType = "keydown";
export type KeydownEventListener = (
  type: "keydown",
  key: Key,
  callback: (...args: any[]) => any
) => void;

export type Key =
  `K_${KeyName}` | `KS_${KeyName}` | `KA_${KeyName}` | `KSA_${KeyName}`;
export type KeyName =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "Abc"
  | "Alpha"
  | "Apps"
  | "Bpsk"
  | "Comma"
  | "Cos"
  | "Div"
  | "Dot"
  | "Down"
  | "Enter"
  | "Home"
  | "Left"
  | "Right"
  | "Ln"
  | "Log"
  | "Minus"
  | "Neg"
  | "Num"
  | "On"
  | "Plot"
  | "Plus"
  | "Power"
  | "Sin"
  | "Sq"
  | "Symb"
  | "Tan"
  | "Up"
  | "Vars"
  | "View"
  | "Xttn"
  | "Help"
  | "Menu"
  | "Esc"
  | "Cas"
  | "Math"
  | "Templ"
  | "Paren"
  | "Eex"
  | "Mul"
  | "Space";
