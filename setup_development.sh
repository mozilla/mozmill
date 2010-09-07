#!/bin/bash
for i in jsbridge  mozmill  mozprocess  mozprofile  mozrunner
do 
    cd $i
    python setup.py develop
    cd ..
done

