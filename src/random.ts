export function range(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo)) + lo;
}

export function choice<T>(list: T[]): T {
  return list[range(0, list.length)];
}

export function shuffle<T>(list: T[]): T[] {
  const newList = [];
  const _list = [...list];
  while (_list.length > 0) {
    const index = range(0, _list.length);
    newList.push(_list.splice(index, 1)[0]);
  }
  return newList;
}
