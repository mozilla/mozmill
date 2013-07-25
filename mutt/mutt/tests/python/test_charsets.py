#!/usr/bin/python
# -*- coding: UTF-8 -*-

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http:#mozilla.org/MPL/2.0/.

import os
import re
import unittest

import manifestparser
import mozmill


class TestCharsets(unittest.TestCase):

    def do_test(self, test_path=None, manifest_path=None, persisted=None,
                passes=0, fails=0, skips=0):

        abspath = os.path.dirname(os.path.abspath(__file__))

        if manifest_path:
            manifestpath = os.path.join(abspath, manifest_path)
            manifest = manifestparser.TestManifest(manifests=[manifestpath], strict=False)
            tests = manifest.active_tests()
        elif test_path:
            testpath = os.path.join(abspath, test_path)
            tests = [{'path': testpath}]

        m = mozmill.MozMill.create()
        if persisted:
            m.persisted.update(persisted)
        m.run(tests)
        results = m.finish(())

        # From the first test, there is one passing test
        self.assertEqual(len(results.passes), passes, 'Passes should match')
        self.assertEqual(len(results.fails), fails, 'Fails should match')
        self.assertEqual(len(results.skipped), skips, 'Skips should match')

        return (results, m.persisted)

    def test_unicode(self):
        data = {'translations' : [
          u'Tiim a ɛyɛ difɔlt.', # ak
          u'السمة المبدئية.', # ar
          u'অবিকল্পিত থীমটো', #as
          u'Змоўчная тэма.', #be
          u'Стандартна тема.', # bg
          u'পূর্বনির্ধারিত থিম।', # bn-BD
          u'ডিফল্ট থিম।', # bn-IN
          u'Výchozí motiv vzhledu', # cs
          u'Domëslny wëzdrzatk.', # csb - critical failure
          u'Το προεπιλεγμένο θέμα.', # el
          u'La ĉefa etoso.', #en-ZA
          u'تم پیش‌فرض.', # fa - critical failure
          u'Siŋkoore woowaande ndee.', # ff
          u'Le thème par défaut.', # fr - critical failure
          u'An téama réamhshocraithe.', # ga-IE - critical failure
          u'મૂળભૂત થીમ.', # gu-IN
          u'ערכת נושא ברירת מחדל.', # he - critical failure
          u'तयशुदा प्रसंग', # hi-IN
          u'Uobičajena tema', # hr
          u'Az alapértelmezett téma', # hu - critical failure
          u'Նախնական թեման:', # hy-AM
          u'Sjálfgefið þema.', # is - critical failure
          u'標準設定のテーマです。', # ja - critical failure
          u'ស្បែក​លំនាំដើម ។', # km
          u'ಪೂರ್ವನಿಯೋಜಿತ ಥೀಮ್.', # kn
          u'표준 설정 테마입니다.', # ko - critical failure
          u'Dirbê standard.', # ku - critical failure
          u'O têma predefinîo.', # lij - critical failure
          u'Noklusētā tēma', # lv
          u'पूर्वनिर्धारित प्रसंग', # mai
          u'Основна тема.', # mk
          u'സ്വതവേയുള്ള പ്രമേയം', # ml
          u'पूर्वनिर्धारीत दृष्य कल्पना.', # mr
          u'ପୂର୍ବନିର୍ଦ୍ଧାରିତ ସମୟ', # or
          u'ਡਿਫਾਲਟ ਥੀਮ ਹੈ।', # pa-IN
          u'Motyw domyślny.', # pl
          u'Tema Padrão', # pt-BR - critical failure
          u'O tema pré-definido.', # pt-PT - critical failure
          u'Tema implicită.', # ro
          u'Тема по умолчанию', # ru
          u'පෙරනිමි තේමාව.', # si
          u'Predvolená téma', # sk - critical failure
          u'Подразумевана тема.', # sr
          u'முன்னிருப்பு தீம்.', # ta
          u'பொது இருப்பு theme.', # ta-LK
          u'అప్రమేయ అలంకారం.', # te
          u'ชุดตกแต่งปริยาย', # th
          u'Varsayılan tema.', # tr
          u'Типова тема.', # uk
          u'Giao diện mặc định.', # vi
          u'預設佈景主題。', # zh-TW
        ]}

        testpath = os.path.join('js-modules', 'testUTF-8.js')
        results, persisted = self.do_test(test_path=testpath,
                                          persisted=data,
                                          passes=1)

        translations_tests = results.passes[0]['passes']
        self.assertEqual(len(translations_tests), len(data['translations']),
                         'All translations have been tested')

        for index in range(0, len(translations_tests)):
            test = translations_tests[index]
            test_data = data['translations'][index]

            self.assertTrue('pass' in test,
                            '"' + test_data + '" correctly send to the application')

            regex = r'\'(.*)\' should equal \'(.*)\''
            m = re.search(regex, test['pass']['message'])

            self.assertEqual(m.group(1), data['translations'][index],
                             '"' + test_data + '" correctly send back')
            self.assertEqual(m.group(2), data['translations'][index],
                             '"' + m.group(2) + '" correctly received')


if __name__ == '__main__':
    unittest.main()
