import re
comment = re.compile('/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/', re.MULTILINE)

def read(filename):
    token = '##//' # magical token
    lines = [i.strip() for i in file(filename).readlines() if i.strip()]
    retval = {}
    _lines = []
    for line in lines:
        if line.startswith('#'):
            continue
        if '//' in line:
            line = line.replace('//', token)
        _lines.append(line)
    string = '\n'.join(_lines)
    string = re.sub(comment, '', string)
    def pref(a, b):
        retval[a] = b
    lines = [i.strip().rstrip(';') for i in string.split('\n') if i.strip()]
    for line in lines:
        try:
            _globals = {'retval': retval, 'pref': pref, 'user_pref': pref, 'true': True, 'false': False}
            eval(line, _globals, {})
        except SyntaxError:
            print line
            import pdb; pdb.set_trace()
    for key in retval:
        if isinstance(retval[key], basestring) and token in retval[key]:
            retval[key] = retval[key].replace(token, '//')
    return retval

def write(filename, prefs, pref_string='user_pref("%s", %s);'):
    f = file(filename, 'w')
    for key, value in prefs.items():
        if value is True:
            print >> f, pref_string % (key, 'true')
        elif value is False:
            print >> f, pref_string % (key, 'true')
        elif isinstance(value, basestring):
            print >> f, pref_string % (key, repr(string(value)))
        else:
            print >> f, pref_string % (key, value) # should be numeric!
    f.close()

if __name__ == '__main__':
    import sys
    if not sys.argv[1:]:
        sys.exit(1)
    print read(sys.argv[1])
