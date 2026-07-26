A game engine designed to make games for the HP Prime G2 Graphing Calculator. Consists of a compiler that compiles from JavaScript to HPPPL (HP Prime Programming Language) and an online web interface to aid with miscellaneous tasks, such as sprite creation.

# How to Use

1. Download the [HP Connectivity Kit](https://www.hpcalc.org/details/8938) and, if you don't have a physical calculator, the [HP Prime Emulator](https://www.hpcalc.org/details/8939).
2. Write a JavaScript file. Currently, only a very, very limited subset of the language is supported. Some types have been provided in `compiler/src/index.d.ts`
3. Install dependencies with `pnpm i`
4. Build the compiler with `pnpm --filter compiler build`
5. Run the compiler with `pnpm --filter compiler start path/to/file` where `path/to/file` is relative to the project root. That is, where this `README.md` file is.
6. Connect your physical calculator to your device with a USB cable OR open the calculator emulator
7. Open the connectivity kit application and create a new program on your calculator
8. Paste the contents of `build.hpppl` into the new program and save
9. Run the program
