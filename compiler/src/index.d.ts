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

export const COLOURS: Record<string, Colour>;

type GraphicsObject = { __tag: "GraphicsObject" };
type Colour = { __tag: "Colour" };

export function RECT_P(
  graphicsObject: GraphicsObject,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edgeColour: Colour,
  fillColour: Colour
): void;
