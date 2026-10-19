export interface Lot {
  id: string;
  name: string;
  blurb: string;
  price: number;
  house: string;
  year: number;
  note: string;
  swatch: string;
}

/** Sale prices include the buyer's premium unless the note says otherwise. */
export const LOTS: Lot[] = [
  { id: 'salvator', name: 'Salvator Mundi', blurb: 'A painting of Christ attributed to Leonardo da Vinci.', price: 450312500, house: "Christie's, New York", year: 2017, note: 'Sold on 15 November 2017.', swatch: '#c7a3ff' },
  { id: 'marilyn', name: 'Shot Sage Blue Marilyn', blurb: "Andy Warhol's 1964 silk-screen portrait of Marilyn Monroe.", price: 195040000, house: "Christie's, New York", year: 2022, note: 'Sold on 9 May 2022.', swatch: '#6cc8ff' },
  { id: 'alger', name: "Les Femmes d'Alger", blurb: "Pablo Picasso's 1955 painting, version O.", price: 179365000, house: "Christie's, New York", year: 2015, note: 'Sold on 11 May 2015.', swatch: '#ffac57' },
  { id: 'modigliani', name: 'Nu couché', blurb: "Amedeo Modigliani's 1917 reclining nude.", price: 170405000, house: "Christie's, New York", year: 2015, note: 'Sold on 9 November 2015.', swatch: '#ffa3d1' },
  { id: 'scream', name: 'The Scream', blurb: "Edvard Munch's 1895 pastel version of the famous face.", price: 119922500, house: "Sotheby's, New York", year: 2012, note: 'Sold on 2 May 2012.', swatch: '#ff7466' },
  { id: 'rabbit', name: 'Rabbit', blurb: "Jeff Koons's stainless-steel bunny from 1986.", price: 91075000, house: "Christie's, New York", year: 2019, note: 'Sold on 15 May 2019.', swatch: '#d7dde6' },
  { id: 'pink', name: 'The Pink Star', blurb: 'A 59.6-carat pink diamond, later renamed The CTF Pink Star.', price: 71200000, house: "Sotheby's, Hong Kong", year: 2017, note: 'Sold in April 2017.', swatch: '#ffa3d1' },
  { id: 'blue', name: 'The Oppenheimer Blue', blurb: 'A 14.62-carat vivid blue diamond.', price: 57500000, house: "Christie's, Geneva", year: 2016, note: 'Sold in May 2016 for about $57.5 million.', swatch: '#6cc8ff' },
  { id: 'stan', name: 'Stan the T. rex', blurb: 'A nearly complete Tyrannosaurus rex skeleton.', price: 31847500, house: "Christie's, New York", year: 2020, note: 'Sold on 6 October 2020.', swatch: '#ffac57' },
  { id: 'patek', name: 'Grandmaster Chime', blurb: 'A one-of-a-kind Patek Philippe watch, reference 6300A.', price: 31000000, house: "Christie's, Geneva", year: 2019, note: 'Sold in November 2019.', swatch: '#ffd447' },
  { id: 'codex', name: 'Codex Leicester', blurb: "Leonardo da Vinci's notebook of science notes.", price: 30800000, house: "Christie's, New York", year: 1994, note: 'Sold on 11 November 1994.', swatch: '#6be3a8' },
  { id: 'magna', name: 'A 1297 Magna Carta', blurb: 'One of the surviving copies of the 1297 Magna Carta.', price: 21300000, house: "Sotheby's, New York", year: 2007, note: 'Sold in December 2007 for about $21.3 million.', swatch: '#fffdf7' },
  { id: 'jordan', name: 'Michael Jordan 1998 jersey', blurb: 'The Chicago Bulls jersey from his last title season.', price: 10100000, house: "Sotheby's", year: 2022, note: 'Sold in 2022 for $10.1 million.', swatch: '#ff7466' },
  { id: 'stamp', name: 'British Guiana 1c stamp', blurb: 'The 1856 one-cent magenta, one of the rarest stamps.', price: 8307000, house: "Sotheby's, New York", year: 2021, note: 'Sold on 8 June 2021.', swatch: '#ff7466' },
  { id: 'sue', name: 'Sue the T. rex', blurb: 'The famous Tyrannosaurus rex now at the Field Museum.', price: 8362500, house: "Sotheby's, New York", year: 1997, note: 'Sold on 4 October 1997.', swatch: '#c7a3ff' },
  { id: 'banana', name: 'Comedian', blurb: "Maurizio Cattelan's banana duct-taped to a wall.", price: 6200000, house: "Sotheby's, New York", year: 2024, note: 'Sold on 20 November 2024, with fees.', swatch: '#ffd447' },
  { id: 'dress', name: 'Marilyn Monroe dress', blurb: 'The dress she wore to sing Happy Birthday, Mr. President.', price: 4800000, house: "Julien's Auctions", year: 2016, note: 'Sold on 17 November 2016.', swatch: '#fffdf7' },
];

export const usd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)} billion` : `$${Math.round(n).toLocaleString('en-US')}`;
