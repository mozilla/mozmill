# First unit test that really just ensures the unit test framework is ok
import unittest

class Sanity(unittest.TestCase):
    def some_supporting_func(self):
        return 'foo'

    def throw_planned_exception(self):
        raise NameError('WoahPartner')
    
    def throw_unplanned_exception(self):
        a = 5 
        b = 0
        return a/b 

    def test_python_pass(self):
        self.assertTrue(self.some_supporting_func() == 'foo')
    
    def test_python_fail(self):
        self.assertTrue(self.some_supporting_func() == 'bar')

    def test_python_raise(self):
        self.assertRaises(NameError, self.throw_planned_exception)

    def test_python_raise2(self):
        self.throw_unplanned_exception()
        
