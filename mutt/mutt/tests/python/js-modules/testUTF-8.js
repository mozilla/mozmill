/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_DATA = [
  "Tiim a ɛyɛ difɔlt.", // ak
  "السمة المبدئية.", // ar
  "অবিকল্পিত থীমটো", //as
  "Змоўчная тэма.", //be
  "Стандартна тема.", // bg
  "পূর্বনির্ধারিত থিম।", // bn-BD
  "ডিফল্ট থিম।", // bn-IN
  "Výchozí motiv vzhledu", // cs
  "Domëslny wëzdrzatk.", // csb - critical failure
  "Το προεπιλεγμένο θέμα.", // el
  "La ĉefa etoso.", //en-ZA
  "تم پیش‌فرض.", // fa - critical failure
  "Siŋkoore woowaande ndee.", // ff
  "Le thème par défaut.", // fr - critical failure
  "An téama réamhshocraithe.", // ga-IE - critical failure
  "મૂળભૂત થીમ.", // gu-IN
  "ערכת נושא ברירת מחדל.", // he - critical failure
  "तयशुदा प्रसंग", // hi-IN
  "Uobičajena tema", // hr
  "Az alapértelmezett téma", // hu - critical failure
  "Նախնական թեման:", // hy-AM
  "Sjálfgefið þema.", // is - critical failure
  "標準設定のテーマです。", // ja - critical failure
  "ស្បែក​លំនាំដើម ។", // km
  "ಪೂರ್ವನಿಯೋಜಿತ ಥೀಮ್.", // kn
  "표준 설정 테마입니다.", // ko - critical failure
  "Dirbê standard.", // ku - critical failure
  "O têma predefinîo.", // lij - critical failure
  "Noklusētā tēma", // lv
  "पूर्वनिर्धारित प्रसंग", // mai
  "Основна тема.", // mk
  "സ്വതവേയുള്ള പ്രമേയം", // ml
  "पूर्वनिर्धारीत दृष्य कल्पना.", // mr
  "ପୂର୍ବନିର୍ଦ୍ଧାରିତ ସମୟ", // or
  "ਡਿਫਾਲਟ ਥੀਮ ਹੈ।", // pa-IN
  "Motyw domyślny.", // pl
  "Tema Padrão", // pt-BR - critical failure
  "O tema pré-definido.", // pt-PT - critical failure
  "Tema implicită.", // ro
  "Тема по умолчанию", // ru
  "පෙරනිමි තේමාව.", // si
  "Predvolená téma", // sk - critical failure
  "Подразумевана тема.", // sr
  "முன்னிருப்பு தீம்.", // ta
  "பொது இருப்பு theme.", // ta-LK
  "అప్రమేయ అలంకారం.", // te
  "ชุดตกแต่งปริยาย", // th
  "Varsayılan tema.", // tr
  "Типова тема.", // uk
  "Giao diện mặc định.", // vi
  "預設佈景主題。", // zh-TW
];

function setupModule() {
  controller = mozmill.getBrowserController();
};

function test() {
  persisted.translations.forEach(function (text, index) {
    expect.equal(text, TEST_DATA[index], text);
  });
}
