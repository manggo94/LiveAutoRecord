export const qualities = {
  'SD': '流畅',
  'HD': '高清',
  'TD': '超清',
  'BD': '原画'
}

export const circuits = {
  'primary': '主线',
  'standby1': '备线1',
  'standby2': '备线2',
  'standby3': '备线3'
}

export const preferred = {
  quality: 'BD',
  circuit: 'primary'
}

export function getUrl (address) {
  let base = 'https://live.bilibili.com/'
  return new URL(base + address)
}

export async function getInfo (address) {
  // todo 返回一个规定的对象
}

export async function getStream (address, quality, circuit) {
  // todo 返回指定的流地址
}

export function getDanmakuClient (address) {
  // todo 返回一个具有start/stop接口, 实现了event的弹幕client
}
