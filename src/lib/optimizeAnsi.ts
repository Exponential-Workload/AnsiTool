export const optimizeAnsi = (ansi: string) => {
  // optimize the ansi string by removing duplicate codes immediately following eachother (even if text is between)
  let lastCode = '\x1b[0m';
  const optimized = ansi.replace(/\[[0-9;]+m/gu, (code) => {
    if (code === lastCode) return '';
    // parse the code into it's numbers
    let numbers = code.match(/[0-9]+/gu)?.map((v) => v);
    // if there are no numbers, return the code
    if (!numbers) {
      lastCode = code;
      return code;
    }
    // if there are numbers, remove everything before the last zero, excluding the last zero
    const zeroIdx = numbers.lastIndexOf('0');
    if (zeroIdx >= 0) numbers = numbers.slice(zeroIdx);
    // return them joined
    code = `[${numbers.join(';')}m`;

    if (code === lastCode) return '';
    lastCode = code;
    return code;
  });
  return optimized;
};
export default optimizeAnsi;