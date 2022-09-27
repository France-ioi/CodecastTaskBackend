function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandomId(): string {
  let rand = String(randomIntFromInterval(100000, 999999999));
  rand += String(randomIntFromInterval(1000000, 999999999));

  return rand;
}