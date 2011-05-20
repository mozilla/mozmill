#
# proclaunch  tests Makefile
#

CC      = gcc
CFLAGS  = -g -v -Iiniparser
LFLAGS  = -L.. -liniparser
AR	    = ar
ARFLAGS = rcv
RM      = rm -f


default: all

all: iniparser proclaunch

iniparser:
	$(MAKE) -C iniparser

proclaunch: proclaunch.c
	$(CC) $(CFLAGS) -o proclaunch proclaunch.c -Iiniparser -Liniparser -liniparser

clean veryclean:
	$(RM) proclaunch 

