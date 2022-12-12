export const makeId = (Length) => {
  const charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < Length; i += 1) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    result += charSet.charAt(randomPoz);
  }
  return result;
};
