def check(*args, **kwargs):
    assert args[0] == True
    assert kwargs.get('state') == "testOne"
