// レーンの 色 (左 空色 / まん中 黄 / 右 赤) を 1 か所に (11/9 社長: 色弱の 方には 緑と 黄色が 同じに 見える → 緑を やめて 空色に)
export const LANE_HEX = [0x39b8ff, 0xffd54a, 0xff5a5a];
export const LANE_CSS = LANE_HEX.map(c => '#' + c.toString(16).padStart(6, '0'));
