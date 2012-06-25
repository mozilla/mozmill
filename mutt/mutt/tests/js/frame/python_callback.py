def check(*args, **kwargs):
    assert args[0] is True
    assert kwargs.get('state') == "testOne"
