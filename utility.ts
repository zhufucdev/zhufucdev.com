export function getHumanReadableTime(time: Date): string {
  function prefix(units: number): string | undefined {
    switch (units) {
      case 1:
        return "昨";
      case 2:
        return "前";
      default:
        return undefined;
    }
  }

  function fix(num: number): string {
    if (num == 0) {
      return "00";
    } else if (num < 10) {
      return "0" + num;
    } else {
      return num.toString();
    }
  }

  const clock = fix(time.getHours()) + ":" + fix(time.getMinutes());
  const now = new Date();
  if (time.getFullYear() == now.getFullYear()) {
    if (time.getMonth() == now.getMonth()) {
      if (time.getDate() == now.getDate()) {
        // same day
        return clock;
      } else {
        const dateElasped = now.getDate() - time.getDate();
        return `${
          prefix(dateElasped) + "天" || time.getDate() + "日"
        } ${clock}`;
      }
    } else {
      return `${time.getMonth().toLocaleString("zh-CN")}月${time
        .getDate()
        .toLocaleString("zh-CN")}日 ${clock}`;
    }
  } else {
    const yearElasped = now.getFullYear() - time.getFullYear();
    return `${prefix(yearElasped) || time.getFullYear()}年${
      time.getMonth() + 1
    }月${time.getDate()}日 ${clock}`;
  }
}

const imageCache = new Map<string, boolean>();
export async function cacheImage(src: string) {
  if (src in imageCache) {
    return;
  }
  const cache = new Image();
  const promise = new Promise(
    (resolve) =>
      (cache.onload = () => {
        imageCache.set(src, true);
        resolve(true);
      })
  );
  cache.src = src;
  await promise;
}

export function getImageUri(id: string) {
  return `/api/images/${id}`;
}