#!/bin/bash
for i in mozprocess mozprofile mozrunner jsbridge mozmill 
do 
    cd $i
    python setup.py develop
    cd ..
done

