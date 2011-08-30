#!/usr/bin/env python

import mozmill
import os
import tempfile
import unittest

class TestMozmillPersisted(unittest.TestCase):
    """test persisted object"""

    test = """
    var setupModule = function(module){
    controller = mozmill.getBrowserController();
    }
    
    var test_something = function() {
    persisted.bar = 'bar';
    persisted.number += 1;
    persisted.fleem = 2;
    %(shutdown)s
    }
    """

    def make_test(self, shutdown=''):
        """make an example test to run"""
        fd, path = tempfile.mkstemp()
        os.write(fd, self.test % dict(shutdown=shutdown))
        os.close(fd)
        return path

    def test_persisted(self):
        path = self.make_test()
        m = mozmill.MozMill.create()
        m.persisted['foo'] = 'bar'
        m.persisted['bar'] = 'foo'
        m.persisted['number'] = 1
        results = m.run(dict(path=path))
        self.assertTrue(len(results.passes) == 1)
        self.inspect_persisted(m.persisted)

    def test_persisted_shutdown(self):
        path = self.make_test(shutdown='controller.stopApplication();')
        m = mozmill.MozMill.create()
        m.persisted['foo'] = 'bar'
        m.persisted['bar'] = 'foo'
        m.persisted['number'] = 1
        results = m.run(dict(path=path))
        self.assertTrue(len(results.passes) == 1)
        self.inspect_persisted(m.persisted)

    def inspect_persisted(self, persisted):
        """inspect the persisted data following the test"""
        self.assertTrue(persisted == {u'fleem': 2, u'foo': u'bar', u'bar': u'bar', u'number': 2})

if __name__ == '__main__':
    unittest.main()
