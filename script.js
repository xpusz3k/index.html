function loadDoc() {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
      document.getElementById("demo").innerHTML = this.responseText;
    }
    xhttp.open("GET", "send");
    xhttp.send();
  }
  // cookie section
// =======================================================================
function setCookie() {
  let cName = "language";
  let cValue = "langSelected";
  let exDays = 182;
  var d = new Date();
  d.setTime(d.getTime() + exDays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toUTCString();
  document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
  console.log("cookie has been set");
  }
  
  function getCookie(cName) {
  var name = cName + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
  var c = ca[i];
  while (c.charAt(0) == " ") {
  c = c.substring(1);
  }
  if (c.indexOf(name) == 0) {
  return c.substring(name.length, c.length);
  }
  }
  return "";
  }
  
  function checkCookie() {
  var user = getCookie("language");
  if (user != null && user) {
  return;
  } else {
  langaugeDirect();
  }
  }
  // =======================================================================
  
  // If language was not selected by user direct to the website
  // =======================================================================
  function langaugeDirect() {
  let linksDetect = document.getElementsByTagName("link");
  let arrayOfLangTags = [];
  let twIsoCode = window.twik_user_data.location.iso_code;
  for (let index = 0; index < linksDetect.length; index++) {
  if (linksDetect[index].attributes.getNamedItem("hreflang")) {
  arrayOfLangTags.push(linksDetect[index]);
  for (let index = 0; index < arrayOfLangTags.length; index++) {
  if (
  arrayOfLangTags[index].attributes.getNamedItem("hreflang").value ==
  countryList[twIsoCode]
  ) {
  let refUrl = arrayOfLangTags[index].attributes.getNamedItem("href")
  .value;
  window.location.replace(refUrl);
  }
  }
  }
  }
  }
  // =======================================================================
  
  if (
  document.referrer == null ||
  document.referrer == undefined ||
  document.referrer == ""
  ) {
  setCookie();
  } else {
  checkCookie();
  }
  
  // country list
  // =======================================================================
  
  const countryList = {
  AD: "ca",
  AE: "ar",
  AF: "ps",
  AG: "en",
  AI: "en",
  AL: "sq",
  AM: "hy",
  AO: "pt",
  AR: "es",
  AS: "en",
  AT: "de",
  AU: "en",
  AW: "nl",
  AX: "sv",
  AZ: "az",
  BA: "bs",
  BB: "en",
  BD: "bn",
  BE: "fr",
  BF: "fr",
  BG: "bg",
  BH: "ar",
  BI: "rn",
  BJ: "fr",
  BL: "fr",
  BM: "en",
  BN: "ms",
  BO: "es",
  BQ: "nl",
  BR: "pt",
  BS: "en",
  BT: "dz",
  BV: "nb",
  BW: "en",
  BY: "ru",
  BZ: "en",
  CA: "en",
  CC: "en",
  CD: "fr",
  CF: "fr",
  CG: "fr",
  CH: "de",
  CI: "fr",
  CK: "en",
  CL: "es",
  CM: "en",
  CN: "zh",
  CO: "es",
  CR: "es",
  CU: "es",
  CV: "pt",
  CW: "en",
  CX: "en",
  CY: "el",
  CZ: "cs",
  DE: "de",
  DJ: "ar",
  DK: "da",
  DM: "en",
  DO: "es",
  DZ: "ar",
  EC: "es",
  EE: "et",
  EG: "ar",
  EH: "es",
  ER: "en",
  ES: "es",
  ET: "am",
  FI: "fi",
  FJ: "en",
  FK: "en",
  FM: "en",
  FO: "fo",
  FR: "fr",
  GA: "fr",
  GB: "en",
  GD: "en",
  GE: "ka",
  GF: "fr",
  GG: "en",
  GH: "en",
  GI: "en",
  GL: "kl",
  GM: "en",
  GN: "fr",
  GP: "fr",
  GQ: "fr",
  GR: "el",
  GS: "en",
  GT: "es",
  GU: "en",
  GW: "pt",
  GY: "en",
  HK: "zh",
  HM: "en",
  HN: "es",
  HR: "hr",
  HT: "fr",
  HU: "hu",
  ID: "id",
  IE: "en",
  IL: "he",
  IM: "en",
  IN: "hi",
  IO: "en",
  IQ: "ar",
  IR: "fa",
  IS: "is",
  IT: "it",
  JE: "en",
  JM: "en",
  JO: "ar",
  JP: "ja",
  KE: "en",
  KG: "ky",
  KH: "km",
  KI: "en",
  KM: "ar",
  KN: "en",
  KP: "ko",
  KR: "ko",
  KW: "ar",
  KY: "en",
  KZ: "kk",
  LA: "lo",
  LB: "ar",
  LC: "en",
  LI: "de",
  LK: "si",
  LR: "en",
  LS: "en",
  LT: "lt",
  LU: "de",
  LV: "lv",
  LY: "ar",
  MA: "ar",
  MC: "fr",
  MD: "ro",
  ME: "bs",
  MF: "en",
  MG: "fr",
  MH: "en",
  MK: "mk",
  ML: "fr",
  MM: "my",
  MN: "mn",
  MO: "pt",
  MP: "en",
  MQ: "fr",
  MR: "ar",
  MS: "en",
  MT: "en",
  MU: "en",
  MV: "dv",
  MW: "en",
  MX: "es",
  MY: "ms",
  MZ: "pt",
  NA: "en",
  NC: "fr",
  NE: "fr",
  NF: "en",
  NG: "en",
  NI: "es",
  NL: "nl",
  NO: "nn",
  NP: "ne",
  NR: "en",
  NU: "en",
  NZ: "en",
  OM: "ar",
  PA: "es",
  PE: "es",
  PF: "fr",
  PG: "en",
  PH: "en",
  PK: "en",
  PL: "pl",
  PM: "fr",
  PN: "en",
  PR: "es",
  PS: "ar",
  PT: "pt",
  PW: "en",
  PY: "es",
  QA: "ar",
  RE: "fr",
  RO: "ro",
  RS: "sr",
  RU: "ru",
  RW: "en",
  SA: "ar",
  SB: "en",
  SC: "en",
  SD: "ar",
  SE: "sv",
  SG: "en",
  SH: "en",
  SI: "sl",
  SJ: "no",
  SK: "sk",
  SL: "en",
  SM: "it",
  SN: "fr",
  SO: "ar",
  SR: "nl",
  SS: "en",
  ST: "pt",
  SV: "es",
  SX: "en",
  SY: "ar",
  SZ: "en",
  TC: "en",
  TD: "ar",
  TF: "fr",
  TG: "fr",
  TH: "th",
  TJ: "tg",
  TK: "en",
  TL: "pt",
  TM: "tk",
  TN: "ar",
  TO: "en",
  TR: "tr",
  TT: "en",
  TV: "en",
  TW: "zh",
  TZ: "en",
  UA: "uk",
  UG: "en",
  UM: "en",
  US: "en",
  UY: "es",
  UZ: "uz",
  VA: "it",
  VC: "en",
  VE: "es",
  VG: "en",
  VI: "en",
  VN: "vi",
  VU: "en",
  WF: "fr",
  WS: "en",
  YE: "ar",
  YT: "fr",
  ZA: "en",
  ZM: "en",
  ZW: "en",
  };
  // =======================================================================