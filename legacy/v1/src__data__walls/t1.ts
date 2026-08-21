import type { DestinationPoint, WallDataJson } from "@/types";
import t1Json from "@/data/map/T1_gabungan.json";

export const COLS = 300;
export const ROWS = 100;
export const START_R = 90;
export const START_C = 183;

export const FLOOR1_ROW_MIN = 38;
export const FLOOR1_ROW_MAX = 90;
export const FLOOR2_ROW_MIN = 0;
export const FLOOR2_ROW_MAX = 32;

export const STAIRCASE_L1: DestinationPoint = {
  id: "l1_ld1", label: "tangga1", r: 84, c: 185, color: "#B1B1B1",
};
export const STAIRCASE_L2: DestinationPoint = {
  id: "l2_ld3", label: "tangga3", r: 26, c: 172, color: "#B1B1B1",
};

function buildWalls(): string[] {
  const wallSet = new Set<string>();

  const W = (r: number, c: number): void => {
    if (r >= 36) c += 1; // Lantai 1: geser kanan 4 poin, lalu kiri 3 poin (net +1)
    c -= 1; // geser semua walls (semua lantai) ke kiri 1 poin
    wallSet.add(`${r + 1},${c}`); // geser semua walls ke bawah 1 poin
  };
  const row = (r: number, c1: number, c2: number): void => { for (let c = c1; c <= c2; c++) W(r, c); };
  const col = (c: number, r1: number, r2: number): void => { for (let r = r1; r <= r2; r++) W(r, c); };
  const box = (r1: number, c1: number, r2: number, c2: number): void => {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) W(r, c);
  };
  void box;

  row(0, 0, COLS - 1);
  row(ROWS - 1, 0, COLS - 1);
  col(0, 0, ROWS - 1);
  col(COLS - 1, 0, ROWS - 1);

  row(98, 4, 293);  // tenant: food10
  row(45, 4, 293);  // tenant: kantor27
  col(294, 45, 97);  // tenant: retail_new
  col(4, 45, 97);  // tenant: kantor25

  col(279, 96, 98);  // tenant: retail_new
  row(91, 273, 278);  // tenant: retail_new
  col(273, 67, 90);  // tenant: retail_new
  row(67, 245, 293);  // tenant: kan_new

  row(62, 249, 267);  // tenant: toilet1
  row(54, 249, 265);  // tenant: toilet1
  col(267, 54, 61);  // tenant: kantor1
  col(249, 54, 61);  // tenant: kantor4

  col(240, 70, 72);  // tenant: kan_new
  row(71, 241, 243);  // tenant: kan_new
  col(240, 68, 79);  // tenant: kan_new
  row(68, 240, 243);  // tenant: kan_new
  row(74, 241, 243);  // tenant: nolabel3
  col(243, 74, 79);  // tenant: nolabel3

  col(243, 55, 71);  // tenant: kan_new
  row(54, 241, 243);  // tenant: Mechanical Room
  row(54, 236, 238);  // tenant: toilet2
  col(235, 54, 70);  // tenant: nolabel2

  row(67, 190, 235);  // tenant: toilet2
  row(67, 163, 188);  // tenant: nolabel15
  col(190, 68, 71);  // tenant: nolabel15
  col(188, 68, 71);  // tenant: nolabel15

  col(163, 64, 69);  // tenant: nolabel20
  row(64, 133, 163);  // tenant: toilet19
  col(133, 64, 77);  // tenant: toilet14

  row(64, 194, 199);  // tenant: toilet18
  row(64, 168, 192);  // tenant: toilet19
  row(51, 168, 199);  // tenant: kantor40
  col(199, 51, 63);  // tenant: nolabel11
  col(168, 51, 63);  // tenant: kantor39

  row(86, 263, 273);  // tenant: toilet5
  col(262, 85, 87);  // tenant: toilet5
  row(92, 245, 273);  // tenant: promo1
  row(92, 233, 240);  // tenant: food3
  row(92, 221, 226);  // tenant: promo2
  row(92, 193, 210);  // tenant: retail2
  row(92, 159, 175);  // tenant: retail3
  row(92, 111, 145);  // tenant: toilet6
  row(92, 94, 107);  // tenant: food15
  row(92, 70, 92);  // tenant: food17
  row(92, 56, 66);  // tenant: food18
  row(92, 42, 55);  // tenant: toilet8
  row(92, 24, 36);  // tenant: lain8

  row(82, 236, 250);  // tenant: kantor6
  col(234, 82, 87);  // tenant: kantor5
  row(87, 234, 250);  // tenant: retail1
  col(250, 84, 87);  // tenant: lain2

  row(61, 222, 230);  // tenant: kantor14
  row(58, 206, 221);  // tenant: kantor14
  row(54, 204, 230);  // tenant: kantor15
  col(230, 54, 61);  // tenant: kantor13
  col(221, 58, 61);  // tenant: kantor14
  col(203, 54, 61);  // tenant: kantor20

  row(86, 230, 233);  // tenant: food23
  row(87, 204, 210);  // tenant: food31
  row(84, 201, 210);  // tenant: nolabel37
  col(210, 85, 86);  // tenant: food31
  col(204, 85, 86);  // tenant: nolabel37

  col(200, 84, 87);  // tenant: toilet22
  col(191, 75, 82);  // tenant: food24
  col(177, 75, 86);  // tenant: lain10
  col(172, 83, 86);  // tenant: food25
  col(196, 82, 86);  // tenant: toilet23
  col(190, 82, 86);  // tenant: food24
  row(75, 164, 205);  // tenant: musholla1
  col(205, 75, 83);  // tenant: nolabel37
  col(164, 75, 87);  // tenant: food9

  col(205, 71, 71);  // tenant: kantor20
  col(161, 71, 71);  // tenant: nolabel21
  row(71, 190, 204);  // tenant: nolabel15
  row(71, 162, 188);  // tenant: nolabel15
  row(69, 161, 162);  // tenant: nolabel20
  col(205, 68, 71);  // tenant: kantor20

  col(235, 71, 78);  // tenant: nolabel2

  row(87, 156, 164);  // tenant: nolabel23
  row(87, 114, 143);  // tenant: toilet9
  row(87, 70, 104);  // tenant: retail4
  row(87, 42, 58);  // tenant: toilet15
  row(87, 20, 33);  // tenant: lift1
  row(87, 4, 20);  // tenant: retail15
  row(82, 187, 193);  // tenant: food24
  row(82, 175, 181);  // tenant: tangga1

  col(157, 83, 86);  // tenant: nolabel24
  row(83, 157, 162);  // tenant: nolabel23

  col(129, 71, 77);  // tenant: toilet13
  row(70, 127, 129);  // tenant: lain11
  col(127, 53, 69);  // tenant: lain11
  col(147, 53, 63);  // tenant: kantor21
  row(53, 123, 146);  // tenant: kantor22
  col(122, 53, 77);  // tenant: lain12
  row(71, 123, 128);  // tenant: lain12

  row(70, 134, 161);  // tenant: nolabel21
  row(67, 56, 121);  // tenant: nolabel29

  row(67, 32, 53);  // tenant: nolabel29
  row(68, 4, 23);  // tenant: kantor24

  col(58, 73, 80);  // tenant: nolabel29
  col(56, 67, 71);  // tenant: nolabel29
  col(57, 61, 66);  // tenant: nolabel29
  col(59, 57, 60);  // tenant: kantor41
  row(60, 57, 59);  // tenant: nolabel31
  col(54, 57, 67);  // tenant: nolabel29

  row(80, 42, 58);  // tenant: toilet16
  col(50, 67, 86);  // tenant: toilet16
  col(42, 79, 92);  // tenant: lain6

  col(101, 84, 87);  // tenant: toilet12
  col(104, 67, 73);  // tenant: nolabel28
  col(99, 67, 72);  // tenant: nolabel28

  col(38, 51, 77);  // tenant: nolabel33
  col(29, 51, 72);  // tenant: nolabel36
  row(77, 31, 37);  // tenant: nolabel36
  row(51, 29, 37);  // tenant: nolabel33
  row(81, 24, 36);  // tenant: musholla3
  col(23, 51, 86);  // tenant: lift1
  row(51, 20, 22);  // tenant: toilet17

  col(108, 56, 61);  // tenant: musholla4
  col(115, 56, 61);  // tenant: nolabel35
  row(61, 108, 113);  // tenant: musholla4
  row(56, 108, 115);  // tenant: musholla4

  col(100, 56, 59);  // tenant: kantor45
  col(85, 56, 59);  // tenant: kantor43
  row(59, 85, 100);  // tenant: kantor43
  row(56, 85, 98);  // tenant: kantor45

  col(71, 56, 59);  // tenant: kantor42
  col(64, 56, 59);  // tenant: kantor41
  row(55, 64, 71);  // tenant: kantor42

  col(50, 55, 60);  // tenant: nolabel31
  col(44, 55, 60);  // tenant: nolabel33
  row(60, 44, 50);  // tenant: nolabel32
  row(55, 44, 50);  // tenant: nolabel32

  col(38, 82, 87);  // tenant: food19
  row(87, 30, 38);  // tenant: musholla3

  row(35, 0, 298);
  row(3, 293, 298);
  row(3, 272, 291);
  row(3, 249, 270);
  row(3, 224, 247);
  row(3, 204, 222);
  row(3, 181, 202);
  row(3, 155, 179);
  row(3, 132, 153);
  row(3, 107, 130);
  row(3, 84, 105);
  row(3, 60, 82);
  row(3, 38, 58);
  row(3, 11, 36);
  row(3, 0, 9);

  col(29, 0, 3);
  col(29, 97, 99);
  col(49, 0, 3);
  col(49, 97, 99);
  col(69, 0, 3);
  col(69, 97, 99);
  col(99, 0, 3);
  col(99, 97, 99);
  col(109, 0, 3);
  col(109, 97, 99);
  col(139, 0, 3);
  col(139, 97, 99);
  col(159, 0, 3);
  col(159, 97, 99);
  col(189, 0, 3);
  col(189, 97, 99);
  col(219, 0, 3);
  col(219, 97, 99);
  col(229, 0, 3);
  col(229, 97, 99);
  col(259, 0, 3);
  col(259, 97, 99);
  col(284, 0, 3);
  col(284, 97, 99);

  row(15, 252, 298);
  col(252, 15, 23);
  row(25, 252, 255);
  col(255, 25, 34);

  col(290, 6, 11);
  col(283, 6, 11);
  row(11, 284, 293);
  row(6, 284, 293);

  col(281, 6, 11);
  col(274, 6, 11);
  row(11, 275, 281);
  row(6, 275, 281);

  col(268, 6, 11);
  col(261, 6, 11);
  row(11, 261, 267);
  row(6, 261, 268);

  col(259, 6, 11);
  col(252, 6, 11);
  row(11, 253, 259);
  row(6, 253, 259);

  col(245, 6, 11);
  col(239, 6, 11);
  row(11, 240, 245);
  row(6, 240, 245);

  col(237, 6, 11);
  col(231, 6, 11);
  row(11, 231, 236);
  row(6, 231, 236);

  col(222, 6, 11);
  col(215, 6, 11);
  row(11, 215, 222);
  row(6, 215, 222);

  col(213, 6, 11);
  col(206, 6, 11);
  row(11, 206, 213);
  row(6, 206, 213);

  col(201, 6, 11);
  col(195, 6, 11);
  row(11, 195, 201);
  row(6, 195, 201);

  col(192, 6, 11);
  col(183, 6, 11);
  row(11, 183, 192);
  row(6, 183, 192);

  col(176, 6, 11);
  col(158, 6, 11);
  row(11, 158, 176);
  row(6, 158, 176);

  col(146, 6, 11);
  col(139, 6, 11);
  row(11, 139, 146);
  row(6, 139, 146);

  col(137, 6, 11);
  col(130, 6, 11);
  row(11, 130, 137);
  row(6, 130, 137);

  col(123, 6, 11);
  col(116, 6, 11);
  row(11, 116, 123);
  row(6, 116, 123);

  col(114, 6, 11);
  col(107, 6, 11);
  row(11, 107, 114);
  row(6, 107, 114);

  col(102, 6, 11);
  col(80, 6, 8);
  row(6, 80, 102);

  col(75, 6, 11);
  col(68, 6, 11);
  row(11, 68, 75);
  row(6, 68, 75);

  col(66, 6, 11);
  col(59, 6, 11);
  row(11, 59, 66);
  row(6, 59, 66);

  col(52, 6, 11);
  col(37, 6, 11);
  row(11, 37, 52);
  row(6, 37, 52);

  col(30, 6, 11);
  col(23, 9, 11);
  row(11, 23, 30);
  row(6, 26, 30);
  col(26, 6, 8);
  row(8, 23, 26);

  col(19, 8, 11);
  col(9, 6, 11);
  row(11, 9, 19);
  row(6, 9, 16);
  col(17, 6, 8);
  row(8, 17, 19);

  col(250, 15, 18);
  col(222, 15, 19);
  row(15, 222, 223);
  row(15, 225, 229);
  row(15, 231, 232);
  row(15, 234, 237);
  row(15, 239, 241);
  row(15, 243, 245);
  row(15, 247, 250);

  col(225, 15, 18);
  col(231, 15, 18);
  col(234, 15, 18);
  col(239, 15, 18);
  col(243, 15, 18);

  row(19, 229, 250);
  col(229, 17, 18);
  row(17, 225, 229);
  col(225, 17, 19);
  row(19, 222, 225);

  col(220, 15, 22);
  col(192, 15, 18);
  row(15, 192, 193);
  row(15, 195, 196);
  row(15, 198, 200);
  row(15, 202, 202);
  row(15, 205, 207);
  row(15, 209, 215);
  row(15, 217, 217);
  row(15, 219, 219);

  col(195, 15, 18);
  col(198, 15, 18);
  col(202, 15, 18);
  col(205, 15, 18);
  col(209, 15, 18);
  col(217, 15, 18);

  row(19, 192, 217);
  col(217, 19, 22);
  row(22, 217, 220);

  col(179, 15, 24);
  col(161, 15, 24);
  row(24, 174, 179);
  row(24, 161, 169);
  row(15, 161, 164);
  row(15, 166, 171);
  row(15, 173, 177);
  row(15, 179, 179);

  col(169, 15, 24);
  col(174, 15, 24);
  row(19, 169, 174);

  col(152, 15, 24);
  col(149, 15, 24);
  row(24, 149, 152);
  row(15, 149, 150);
  row(15, 152, 152);

  col(147, 15, 24);
  col(129, 15, 18);
  row(15, 129, 130);
  row(15, 132, 134);
  row(15, 136, 137);
  row(15, 139, 141);
  row(15, 143, 144);
  row(15, 146, 146);

  col(132, 15, 18);
  col(136, 15, 18);
  col(139, 15, 18);
  col(143, 15, 18);

  row(19, 129, 144);
  col(144, 18, 24);

  col(129, 15, 24);
  col(119, 15, 22);
  row(22, 119, 129);
  row(15, 123, 129);
  row(24, 129, 147);

  col(116, 15, 18);
  col(98, 15, 18);
  row(19, 98, 116);
  row(15, 98, 100);
  row(15, 102, 104);
  row(15, 106, 108);
  row(15, 110, 112);
  row(15, 114, 114);
  row(15, 116, 116);

  col(102, 15, 18);
  col(107, 15, 18);
  col(110, 15, 18);
  col(114, 15, 18);

  row(15, 91, 95);
  col(91, 12, 15);
  row(15, 28, 31);
  row(15, 33, 36);
  row(15, 38, 41);
  row(15, 43, 44);
  row(15, 46, 50);
  row(15, 52, 59);
  row(15, 61, 63);
  row(15, 65, 68);
  row(15, 70, 75);
  row(15, 77, 78);
  row(15, 80, 82);
  row(18, 72, 80);

  col(33, 15, 18);
  col(39, 15, 18);
  col(44, 15, 18);
  col(47, 15, 18);
  col(53, 15, 24);
  col(58, 15, 18);
  col(62, 15, 18);
  col(65, 15, 18);
  col(78, 15, 18);
  col(80, 15, 18);

  col(71, 15, 18);
  row(19, 56, 71);
  col(56, 18, 24);
  row(24, 47, 56);
  col(47, 19, 24);
  row(19, 32, 47);
  col(32, 19, 26);
  row(26, 28, 32);

  row(15, 0, 13);
  row(15, 15, 16);
  row(15, 18, 20);
  col(16, 15, 31);
  col(28, 15, 26);
  col(20, 15, 31);

  col(82, 12, 15);
  col(95, 15, 31);

  row(25, 224, 252);
  row(25, 192, 222);
  row(25, 187, 190);

  col(227, 19, 25);
  col(222, 22, 25);
  col(220, 22, 25);
  row(19, 228, 229);
  col(187, 25, 31);
  row(31, 187, 255);
  col(200, 25, 31);

  col(250, 15, 25);
  col(190, 15, 25);
  col(192, 15, 25);

  col(152, 25, 31);
  row(31, 0, 152);
  col(132, 25, 31);
  col(98, 19, 31);
  col(116, 19, 25);
  row(25, 98, 116);

  col(71, 19, 31);
  col(89, 19, 23);
  row(23, 81, 89);
  row(19, 89, 91);
  col(49, 25, 29);

  row(11, 294, 298);

  col(279, 4, 5);
  col(255, 4, 5);
  col(231, 4, 5);
  col(207, 4, 5);
  col(183, 4, 5);
  col(159, 4, 5);
  col(135, 4, 5);
  col(111, 4, 5);
  col(87, 4, 5);
  col(63, 4, 5);
  col(39, 4, 5);
  col(15, 4, 5);

  return Array.from(wallSet);
}

export const T1_WALL_DATA: WallDataJson = {
  rows: ROWS,
  cols: COLS,
  startRow: START_R,
  startCol: START_C,
  walls: buildWalls(),
};

type RoomBox = {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
};

type DestinationWithRoom = DestinationPoint & {
  room?: RoomBox;
};

type T1MapJson = {
  destinations: DestinationWithRoom[];
};

const t1MapData = t1Json as T1MapJson;

export const DESTINATIONS: DestinationWithRoom[] = t1MapData.destinations;