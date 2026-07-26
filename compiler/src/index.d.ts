type GraphicsObject = { __tag: "GraphicsObject" };
export const G0: GraphicsObject;
export const G1: GraphicsObject;
export const G2: GraphicsObject;
export const G3: GraphicsObject;
export const G4: GraphicsObject;
export const G5: GraphicsObject;
export const G6: GraphicsObject;
export const G7: GraphicsObject;
export const G8: GraphicsObject;
export const G9: GraphicsObject;

type Colour = { __tag: "Colour" };
export const COLOURS: Record<string, Colour>;

type Key =
  | "Apps"
  | "Symb"
  | "Up"
  | "Help"
  | "Esc"
  | "Home"
  | "Plot"
  | "Left"
  | "Right"
  | "View"
  | "CAS"
  | "Num"
  | "Down"
  | "Menu"
  | "Vars"
  | "Toolbox"
  | "Template"
  | "Define"
  | "Fraction"
  | "Backspace"
  | "Power"
  | "Sin"
  | "Cos"
  | "Tan"
  | "Ln"
  | "Log"
  | "Square"
  | "PlusMinus"
  | "Parentheses"
  | "Comma"
  | "Enter"
  | "EEX"
  | "7"
  | "8"
  | "9"
  | "Divide"
  | "Alpha"
  | "4"
  | "5"
  | "6"
  | "Multiply"
  | "Shift"
  | "1"
  | "2"
  | "3"
  | "Minus"
  | "On"
  | "0"
  | "Dot"
  | "Space"
  | "Plus";

export const KEYS: Record<Key, number>;

export function RECT_P(
  graphicsObject: GraphicsObject,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edgeColour: Colour,
  fillColour: Colour
): void;

export function ISKEYDOWN(key: number): boolean;
